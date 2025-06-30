"""
Feedback Generator Module

Converts model predictions into structured, actionable feedback for users.
Provides specific suggestions for improvement based on speech analysis results.
"""

from typing import Dict, List, Tuple
import logging
from dataclasses import dataclass

from ..config.settings import (
    CONFIDENCE_THRESHOLD, NERVOUSNESS_THRESHOLD, FLUENCY_THRESHOLD,
    PACE_THRESHOLD, TONE_THRESHOLD
)

logger = logging.getLogger(__name__)


@dataclass
class FeedbackItem:
    """Individual feedback item"""
    category: str
    score: float
    message: str
    suggestions: List[str]
    severity: str  # 'low', 'medium', 'high'


@dataclass
class SpeechFeedback:
    """Complete speech feedback"""
    overall_score: float
    characteristics: Dict[str, float]
    feedback_items: List[FeedbackItem]
    summary: str
    improvement_areas: List[str]
    strengths: List[str]


class FeedbackGenerator:
    """
    Generates structured feedback from speech analysis predictions
    """
    
    def __init__(self):
        """Initialize feedback generator with thresholds and templates"""
        self.thresholds = {
            'confidence': CONFIDENCE_THRESHOLD,
            'nervousness': NERVOUSNESS_THRESHOLD,
            'fluency': FLUENCY_THRESHOLD,
            'pace': PACE_THRESHOLD,
            'tone': TONE_THRESHOLD
        }
        
        # Feedback templates
        self.feedback_templates = {
            'nervousness': {
                'high': {
                    'message': "You showed signs of nervousness during your responses.",
                    'suggestions': [
                        "Practice deep breathing exercises before interviews",
                        "Prepare thoroughly to build confidence",
                        "Use positive self-talk and visualization",
                        "Practice with mock interviews to reduce anxiety"
                    ]
                },
                'medium': {
                    'message': "There were some moments of nervousness in your speech.",
                    'suggestions': [
                        "Focus on maintaining steady breathing",
                        "Practice your responses to common questions",
                        "Use pauses to collect your thoughts"
                    ]
                },
                'low': {
                    'message': "You maintained good composure throughout.",
                    'suggestions': [
                        "Continue practicing to maintain this level of confidence",
                        "Build on this foundation for future interviews"
                    ]
                }
            },
            'confidence': {
                'high': {
                    'message': "You demonstrated strong confidence in your responses.",
                    'suggestions': [
                        "Maintain this confident approach",
                        "Use this confidence to engage more with the interviewer",
                        "Leverage your confidence to ask thoughtful questions"
                    ]
                },
                'medium': {
                    'message': "Your confidence level was adequate but could be improved.",
                    'suggestions': [
                        "Practice speaking with more conviction",
                        "Prepare specific examples to support your points",
                        "Work on maintaining eye contact and open body language"
                    ]
                },
                'low': {
                    'message': "Your responses lacked confidence and conviction.",
                    'suggestions': [
                        "Practice your responses until you feel comfortable",
                        "Focus on your strengths and achievements",
                        "Use power poses before interviews",
                        "Record yourself speaking and identify areas for improvement"
                    ]
                }
            },
            'fluency': {
                'high': {
                    'message': "Your speech was very fluent and well-paced.",
                    'suggestions': [
                        "Maintain this level of fluency",
                        "Use this fluency to convey complex ideas clearly"
                    ]
                },
                'medium': {
                    'message': "Your speech fluency was generally good with some interruptions.",
                    'suggestions': [
                        "Practice speaking without filler words",
                        "Use pauses instead of 'um' and 'uh'",
                        "Slow down slightly to improve clarity"
                    ]
                },
                'low': {
                    'message': "Your speech contained frequent interruptions and filler words.",
                    'suggestions': [
                        "Practice speaking slowly and deliberately",
                        "Record yourself and identify filler words",
                        "Use structured responses (STAR method)",
                        "Practice with a speech coach or mentor"
                    ]
                }
            },
            'pace': {
                'high': {
                    'message': "Your speaking pace was well-controlled and appropriate.",
                    'suggestions': [
                        "Maintain this balanced speaking pace",
                        "Use pace variations to emphasize key points"
                    ]
                },
                'medium': {
                    'message': "Your speaking pace was generally good but could be more consistent.",
                    'suggestions': [
                        "Practice maintaining consistent pace throughout responses",
                        "Use pauses strategically to organize thoughts",
                        "Avoid rushing through important points"
                    ]
                },
                'low': {
                    'message': "Your speaking pace needs improvement - either too fast or inconsistent.",
                    'suggestions': [
                        "Practice speaking at a measured, consistent pace",
                        "Use breathing exercises to control pace",
                        "Record yourself and adjust speed accordingly",
                        "Practice with a metronome to develop rhythm"
                    ]
                }
            },
            'tone': {
                'high': {
                    'message': "Your tone was engaging and professional throughout.",
                    'suggestions': [
                        "Maintain this professional and engaging tone",
                        "Use tone variations to convey enthusiasm appropriately"
                    ]
                },
                'medium': {
                    'message': "Your tone was generally appropriate but could be more engaging.",
                    'suggestions': [
                        "Practice varying your tone to show enthusiasm",
                        "Use vocal inflections to emphasize key points",
                        "Work on sounding more enthusiastic about opportunities"
                    ]
                },
                'low': {
                    'message': "Your tone was flat or lacked appropriate variation.",
                    'suggestions': [
                        "Practice speaking with more vocal variety",
                        "Use tone to convey enthusiasm and interest",
                        "Record yourself and work on vocal expression",
                        "Practice reading aloud with different emotions"
                    ]
                }
            }
        }
    
    def _get_severity(self, score: float, characteristic: str) -> str:
        """
        Determine severity level based on score and characteristic
        
        Args:
            score: Prediction score (0-1)
            characteristic: Speech characteristic
            
        Returns:
            Severity level ('low', 'medium', 'high')
        """
        threshold = self.thresholds.get(characteristic, 0.5)
        
        if characteristic == 'nervousness':
            # For nervousness, higher score = worse
            if score >= threshold * 1.2:
                return 'high'
            elif score >= threshold:
                return 'medium'
            else:
                return 'low'
        else:
            # For other characteristics, higher score = better
            if score >= threshold * 1.2:
                return 'high'
            elif score >= threshold:
                return 'medium'
            else:
                return 'low'
    
    def _calculate_overall_score(self, characteristics: Dict[str, float]) -> float:
        """
        Calculate overall speech quality score
        
        Args:
            characteristics: Dictionary of characteristic scores
            
        Returns:
            Overall score (0-1)
        """
        # Weight the characteristics
        weights = {
            'confidence': 0.25,
            'fluency': 0.25,
            'nervousness': 0.20,
            'pace': 0.15,
            'tone': 0.15
        }
        
        overall_score = 0.0
        for char, score in characteristics.items():
            if char in weights:
                if char == 'nervousness':
                    # Invert nervousness score (lower is better)
                    overall_score += weights[char] * (1.0 - score)
                else:
                    overall_score += weights[char] * score
        
        return overall_score
    
    def generate_feedback(self, predictions: Dict[str, float]) -> SpeechFeedback:
        """
        Generate comprehensive feedback from model predictions
        
        Args:
            predictions: Dictionary of model predictions
            
        Returns:
            Structured speech feedback
        """
        feedback_items = []
        improvement_areas = []
        strengths = []
        
        # Generate feedback for each characteristic
        for characteristic, score in predictions.items():
            severity = self._get_severity(score, characteristic)
            
            # Get template
            template = self.feedback_templates.get(characteristic, {}).get(severity, {})
            
            feedback_item = FeedbackItem(
                category=characteristic,
                score=score,
                message=template.get('message', f"Your {characteristic} score was {score:.2f}."),
                suggestions=template.get('suggestions', []),
                severity=severity
            )
            
            feedback_items.append(feedback_item)
            
            # Categorize as strength or improvement area
            if characteristic == 'nervousness':
                if score < self.thresholds[characteristic]:
                    strengths.append(characteristic)
                else:
                    improvement_areas.append(characteristic)
            else:
                if score >= self.thresholds[characteristic]:
                    strengths.append(characteristic)
                else:
                    improvement_areas.append(characteristic)
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(predictions)
        
        # Generate summary
        summary = self._generate_summary(overall_score, strengths, improvement_areas)
        
        return SpeechFeedback(
            overall_score=overall_score,
            characteristics=predictions,
            feedback_items=feedback_items,
            summary=summary,
            improvement_areas=improvement_areas,
            strengths=strengths
        )
    
    def _generate_summary(self, overall_score: float, strengths: List[str], improvement_areas: List[str]) -> str:
        """
        Generate overall summary
        
        Args:
            overall_score: Overall speech quality score
            strengths: List of strong areas
            improvement_areas: List of areas needing improvement
            
        Returns:
            Summary string
        """
        if overall_score >= 0.8:
            summary = "Excellent performance! Your speech demonstrated strong communication skills."
        elif overall_score >= 0.6:
            summary = "Good performance with room for improvement in specific areas."
        elif overall_score >= 0.4:
            summary = "Fair performance. Focus on the identified improvement areas."
        else:
            summary = "Your speech needs significant improvement. Focus on the suggestions provided."
        
        if strengths:
            summary += f" Your strengths include: {', '.join(strengths)}."
        
        if improvement_areas:
            summary += f" Areas for improvement: {', '.join(improvement_areas)}."
        
        return summary
    
    def generate_interview_specific_feedback(self, predictions: Dict[str, float], question_type: str = "general") -> Dict:
        """
        Generate feedback specific to interview question types
        
        Args:
            predictions: Model predictions
            question_type: Type of interview question
            
        Returns:
            Interview-specific feedback
        """
        base_feedback = self.generate_feedback(predictions)
        
        # Add question-specific insights
        question_insights = {
            'technical': {
                'nervousness': "Technical questions often cause nervousness. Practice common technical concepts.",
                'confidence': "Confidence in technical responses shows expertise and preparation.",
                'fluency': "Clear, fluent technical explanations demonstrate deep understanding."
            },
            'behavioral': {
                'nervousness': "Behavioral questions require storytelling - practice your STAR responses.",
                'confidence': "Confidence in behavioral responses shows self-awareness and growth.",
                'fluency': "Fluent behavioral responses indicate well-prepared examples."
            },
            'situational': {
                'nervousness': "Situational questions test problem-solving under pressure.",
                'confidence': "Confident situational responses show analytical thinking.",
                'fluency': "Clear situational responses demonstrate structured thinking."
            }
        }
        
        insights = question_insights.get(question_type, {})
        
        return {
            'base_feedback': base_feedback,
            'question_type': question_type,
            'question_insights': insights,
            'recommendations': self._get_question_specific_recommendations(question_type, predictions)
        }
    
    def _get_question_specific_recommendations(self, question_type: str, predictions: Dict[str, float]) -> List[str]:
        """
        Get recommendations specific to question type
        
        Args:
            question_type: Type of interview question
            predictions: Model predictions
            
        Returns:
            List of specific recommendations
        """
        recommendations = []
        
        if question_type == 'technical':
            if predictions.get('nervousness', 0) > 0.6:
                recommendations.append("Practice technical concepts until you can explain them confidently")
            if predictions.get('fluency', 0) < 0.6:
                recommendations.append("Structure your technical explanations clearly")
        
        elif question_type == 'behavioral':
            if predictions.get('confidence', 0) < 0.6:
                recommendations.append("Prepare specific examples using the STAR method")
            if predictions.get('pace', 0) < 0.6:
                recommendations.append("Practice telling your stories at a measured pace")
        
        elif question_type == 'situational':
            if predictions.get('nervousness', 0) > 0.6:
                recommendations.append("Practice thinking through scenarios calmly")
            if predictions.get('tone', 0) < 0.6:
                recommendations.append("Use tone to show enthusiasm for problem-solving")
        
        return recommendations


def create_feedback_generator() -> FeedbackGenerator:
    """Factory function to create feedback generator"""
    return FeedbackGenerator() 