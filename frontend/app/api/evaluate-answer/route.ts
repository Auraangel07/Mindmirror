import { NextRequest, NextResponse } from 'next/server';

interface EvaluationRequest {
  question: string;
  answer: string;
  category: string;
  roleId: string;
}

interface EvaluationResponse {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  detailedAnalysis: {
    clarity: number;
    relevance: number;
    depth: number;
    communication: number;
  };
}

// Simulated AI evaluation - In production, this would call OpenAI/Claude API
function evaluateAnswer(request: EvaluationRequest): EvaluationResponse {
  const { question, answer, category, roleId } = request;
  
  // Basic scoring algorithm (replace with actual AI evaluation)
  const wordCount = answer.split(' ').length;
  const hasExamples = answer.toLowerCase().includes('example') || answer.toLowerCase().includes('experience');
  const hasTechnicalTerms = /\b(api|database|framework|algorithm|design|user|data|system)\b/gi.test(answer);
  
  // Calculate scores
  let clarity = Math.min(100, (wordCount / 50) * 100);
  let relevance = hasTechnicalTerms ? 85 : 60;
  let depth = hasExamples ? 90 : 70;
  let communication = wordCount > 30 ? 85 : 60;
  
  // Adjust based on category
  if (category === 'Technical' && hasTechnicalTerms) {
    relevance += 10;
    depth += 5;
  }
  
  if (category === 'Communication' && wordCount > 100) {
    communication += 10;
    clarity += 5;
  }
  
  // Calculate overall score
  const overallScore = Math.round((clarity + relevance + depth + communication) / 4);
  
  // Generate feedback
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  if (clarity > 80) strengths.push("Clear and well-structured response");
  if (relevance > 80) strengths.push("Relevant technical knowledge demonstrated");
  if (depth > 80) strengths.push("Good use of examples and experience");
  if (communication > 80) strengths.push("Strong communication skills");
  
  if (clarity < 70) improvements.push("Try to structure your answer more clearly");
  if (relevance < 70) improvements.push("Include more relevant technical details");
  if (depth < 70) improvements.push("Provide specific examples from your experience");
  if (communication < 70) improvements.push("Expand on your answer with more detail");
  
  let feedback = "";
  if (overallScore >= 90) {
    feedback = "Excellent response! You demonstrated strong knowledge and communication skills.";
  } else if (overallScore >= 80) {
    feedback = "Good answer with solid understanding. Minor improvements could make it even stronger.";
  } else if (overallScore >= 70) {
    feedback = "Decent response, but there's room for improvement in depth and clarity.";
  } else {
    feedback = "Your answer needs more development. Focus on providing specific examples and clearer explanations.";
  }
  
  return {
    score: overallScore,
    feedback,
    strengths,
    improvements,
    detailedAnalysis: {
      clarity: Math.round(clarity),
      relevance: Math.round(relevance),
      depth: Math.round(depth),
      communication: Math.round(communication)
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: EvaluationRequest = await request.json();
    
    // Validate request
    if (!body.question || !body.answer || !body.category || !body.roleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const evaluation = evaluateAnswer(body);
    
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}