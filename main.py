"""
FastAPI Application for Speech Analysis

Provides REST API endpoints for:
- Real-time speech analysis
- Batch processing
- Interview-specific feedback
- Model information and health checks
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import numpy as np
import tempfile
import os
from pathlib import Path
from typing import Dict, List, Optional
import logging
import json
from datetime import datetime

# Import our modules
from src.core.audio_processor import create_audio_processor
from src.core.feature_extractor import create_feature_extractor
from src.core.ml_model import create_speech_analysis_model, SpeechAnalysisModelWrapper
from src.utils.feedback_generator import create_feedback_generator
from ..config.settings import (
    TRAINED_MODEL_PATH, API_HOST, API_PORT, MAX_AUDIO_SIZE,
    SUPPORTED_AUDIO_FORMATS, SAMPLE_RATE
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Speech Analysis API",
    description="AI-powered speech analysis for interview feedback",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model components
audio_processor = None
feature_extractor = None
model = None
feedback_generator = None


def initialize_models():
    """Initialize all model components"""
    global audio_processor, feature_extractor, model, feedback_generator
    
    try:
        # Initialize components
        audio_processor = create_audio_processor()
        feature_extractor = create_feature_extractor(device="cpu")
        feedback_generator = create_feedback_generator()
        
        # Initialize model (input dimension will be set when features are extracted)
        # For now, use a reasonable default
        default_input_dim = 768 + 7 + 16  # wav2vec2 + mel + prosodic
        model = create_speech_analysis_model(input_dim=default_input_dim)
        model_wrapper = SpeechAnalysisModelWrapper(model, device="cpu")
        
        # Load trained weights if available
        if TRAINED_MODEL_PATH.exists():
            model_wrapper.load_weights(str(TRAINED_MODEL_PATH))
            logger.info("Loaded trained model weights")
        else:
            logger.warning("No trained model found. Using untrained model.")
        
        model = model_wrapper
        
        logger.info("All models initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing models: {e}")
        raise


@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    initialize_models()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Speech Analysis API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if models are initialized
        if audio_processor is None or feature_extractor is None or model is None:
            raise Exception("Models not initialized")
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "models_loaded": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@app.get("/model/info")
async def get_model_info():
    """Get model information"""
    try:
        if model is None:
            raise HTTPException(status_code=500, detail="Model not initialized")
        
        info = model.get_model_info()
        return {
            "model_info": info,
            "supported_formats": SUPPORTED_AUDIO_FORMATS,
            "sample_rate": SAMPLE_RATE,
            "max_audio_size": MAX_AUDIO_SIZE
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting model info: {str(e)}")


@app.post("/analyze/speech")
async def analyze_speech(
    audio_file: UploadFile = File(...),
    question_type: Optional[str] = "general"
):
    """
    Analyze speech from uploaded audio file
    
    Args:
        audio_file: Audio file to analyze
        question_type: Type of interview question (technical, behavioral, situational, general)
    
    Returns:
        Speech analysis results with feedback
    """
    try:
        # Validate file
        if audio_file.size > MAX_AUDIO_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size: {MAX_AUDIO_SIZE / (1024*1024):.1f}MB"
            )
        
        file_extension = Path(audio_file.filename).suffix.lower()
        if file_extension not in SUPPORTED_AUDIO_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Supported: {SUPPORTED_AUDIO_FORMATS}"
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Process audio
            audio, sr = audio_processor.load_audio(temp_file_path)
            
            # Preprocess for model
            audio_tensor = audio_processor.preprocess_for_model(audio)
            
            # Extract features
            features = feature_extractor.extract_all_features(audio_tensor, sr)
            
            # Combine features
            combined_features = feature_extractor.combine_features(features)
            
            # Make predictions
            predictions = model.predict(combined_features)
            
            # Generate feedback
            if question_type != "general":
                feedback = feedback_generator.generate_interview_specific_feedback(
                    predictions, question_type
                )
            else:
                feedback = feedback_generator.generate_feedback(predictions)
            
            # Extract filler word information
            filler_info = audio_processor.detect_filler_words(audio)
            
            # Prepare response
            response = {
                "audio_info": {
                    "filename": audio_file.filename,
                    "duration": len(audio) / sr,
                    "sample_rate": sr,
                    "file_size": len(content)
                },
                "predictions": predictions,
                "feedback": {
                    "overall_score": feedback.overall_score,
                    "summary": feedback.summary,
                    "strengths": feedback.strengths,
                    "improvement_areas": feedback.improvement_areas,
                    "detailed_feedback": [
                        {
                            "category": item.category,
                            "score": item.score,
                            "message": item.message,
                            "suggestions": item.suggestions,
                            "severity": item.severity
                        }
                        for item in feedback.feedback_items
                    ]
                },
                "speech_analysis": {
                    "filler_words": filler_info,
                    "voice_activity_ratio": filler_info.get('speech_ratio', 0),
                    "pause_frequency": filler_info.get('pause_frequency', 0)
                },
                "question_type": question_type,
                "timestamp": datetime.now().isoformat()
            }
            
            return response
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        logger.error(f"Error analyzing speech: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze/batch")
async def analyze_batch(
    background_tasks: BackgroundTasks,
    audio_files: List[UploadFile] = File(...),
    question_type: Optional[str] = "general"
):
    """
    Analyze multiple audio files in batch
    
    Args:
        audio_files: List of audio files to analyze
        question_type: Type of interview question
    
    Returns:
        Batch analysis results
    """
    try:
        if len(audio_files) > 10:  # Limit batch size
            raise HTTPException(status_code=400, detail="Maximum 10 files per batch")
        
        results = []
        
        for audio_file in audio_files:
            try:
                # Validate file
                if audio_file.size > MAX_AUDIO_SIZE:
                    results.append({
                        "filename": audio_file.filename,
                        "error": f"File too large. Maximum size: {MAX_AUDIO_SIZE / (1024*1024):.1f}MB"
                    })
                    continue
                
                file_extension = Path(audio_file.filename).suffix.lower()
                if file_extension not in SUPPORTED_AUDIO_FORMATS:
                    results.append({
                        "filename": audio_file.filename,
                        "error": f"Unsupported file format. Supported: {SUPPORTED_AUDIO_FORMATS}"
                    })
                    continue
                
                # Save uploaded file temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                    content = await audio_file.read()
                    temp_file.write(content)
                    temp_file_path = temp_file.name
                
                try:
                    # Process audio
                    audio, sr = audio_processor.load_audio(temp_file_path)
                    audio_tensor = audio_processor.preprocess_for_model(audio)
                    features = feature_extractor.extract_all_features(audio_tensor, sr)
                    combined_features = feature_extractor.combine_features(features)
                    predictions = model.predict(combined_features)
                    
                    # Generate feedback
                    feedback = feedback_generator.generate_feedback(predictions)
                    
                    results.append({
                        "filename": audio_file.filename,
                        "predictions": predictions,
                        "overall_score": feedback.overall_score,
                        "summary": feedback.summary,
                        "strengths": feedback.strengths,
                        "improvement_areas": feedback.improvement_areas
                    })
                    
                finally:
                    os.unlink(temp_file_path)
                    
            except Exception as e:
                results.append({
                    "filename": audio_file.filename,
                    "error": str(e)
                })
        
        return {
            "batch_results": results,
            "total_files": len(audio_files),
            "successful_analyses": len([r for r in results if "error" not in r]),
            "question_type": question_type,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")


@app.post("/feedback/interview")
async def generate_interview_feedback(
    predictions: Dict[str, float],
    question_type: str = "general",
    interview_context: Optional[Dict] = None
):
    """
    Generate interview-specific feedback from predictions
    
    Args:
        predictions: Model predictions dictionary
        question_type: Type of interview question
        interview_context: Additional context about the interview
    
    Returns:
        Interview-specific feedback
    """
    try:
        # Validate predictions
        required_keys = ['nervousness', 'confidence', 'fluency', 'pace', 'tone']
        for key in required_keys:
            if key not in predictions:
                raise HTTPException(status_code=400, detail=f"Missing prediction: {key}")
        
        # Generate feedback
        feedback = feedback_generator.generate_interview_specific_feedback(
            predictions, question_type
        )
        
        response = {
            "feedback": feedback,
            "interview_context": interview_context or {},
            "timestamp": datetime.now().isoformat()
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating interview feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Feedback generation failed: {str(e)}")


@app.get("/features/extract")
async def extract_features_demo():
    """
    Demo endpoint to show available features
    """
    return {
        "available_features": [
            "wav2vec2_embeddings",
            "hubert_embeddings", 
            "opensmile_acoustic",
            "mel_spectrogram",
            "prosodic_features"
        ],
        "feature_descriptions": {
            "wav2vec2_embeddings": "High-level speech representations from Wav2Vec2 model",
            "hubert_embeddings": "Self-supervised speech representations from HuBERT model",
            "opensmile_acoustic": "Traditional acoustic features (pitch, energy, spectral features)",
            "mel_spectrogram": "Mel-frequency spectrogram features",
            "prosodic_features": "Prosodic features (pitch, energy, speaking rate)"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.api.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True
    ) 