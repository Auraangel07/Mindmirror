import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

interface EvaluationRequest {
  questionId: string;
  questionText: string;
  questionCategory: string;
  questionDifficulty: number;
  responseText: string;
  audioUrl?: string;
  transcriptText?: string;
  responseTime: number;
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

// Enhanced AI evaluation function
function evaluateAnswer(request: EvaluationRequest): EvaluationResponse {
  const { questionText, responseText, questionCategory, questionDifficulty } = request;
  
  // Basic scoring algorithm with improved logic
  const wordCount = responseText.split(' ').length;
  const hasExamples = responseText.toLowerCase().includes('example') || 
                     responseText.toLowerCase().includes('experience') ||
                     responseText.toLowerCase().includes('project');
  
  const hasTechnicalTerms = /\b(api|database|framework|algorithm|design|user|data|system|code|development|testing|deployment|architecture|scalability|performance|security)\b/gi.test(responseText);
  
  const hasStructure = responseText.includes('.') && responseText.split('.').length > 2;
  const hasSpecificDetails = /\b(specifically|particularly|for instance|such as|including|like)\b/gi.test(responseText);
  
  // Calculate base scores
  let clarity = Math.min(100, Math.max(20, (wordCount / 80) * 100));
  if (hasStructure) clarity += 10;
  if (wordCount > 150) clarity += 5;
  
  let relevance = hasTechnicalTerms ? 85 : 60;
  if (questionCategory === 'Technical' && hasTechnicalTerms) relevance += 10;
  if (questionCategory === 'Communication' && wordCount > 100) relevance += 5;
  if (questionCategory === 'Leadership' && responseText.toLowerCase().includes('team')) relevance += 10;
  
  let depth = hasExamples ? 90 : 70;
  if (hasSpecificDetails) depth += 10;
  if (wordCount > 200) depth += 5;
  
  let communication = wordCount > 50 ? 85 : 60;
  if (hasStructure) communication += 10;
  if (hasExamples) communication += 5;

  // Difficulty adjustment
  const difficultyMultiplier = 1 + (questionDifficulty - 3) * 0.1;
  clarity = Math.min(100, Math.max(0, clarity * difficultyMultiplier));
  relevance = Math.min(100, Math.max(0, relevance * difficultyMultiplier));
  depth = Math.min(100, Math.max(0, depth * difficultyMultiplier));
  communication = Math.min(100, Math.max(0, communication * difficultyMultiplier));
  
  // Calculate overall score
  const overallScore = Math.round((clarity + relevance + depth + communication) / 4);
  
  // Generate dynamic feedback
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  if (clarity > 80) strengths.push("Clear and well-structured response");
  if (relevance > 80) strengths.push("Relevant technical knowledge demonstrated");
  if (depth > 80) strengths.push("Good use of examples and specific details");
  if (communication > 80) strengths.push("Strong communication skills");
  if (hasExamples) strengths.push("Excellent use of real-world examples");
  if (hasTechnicalTerms && questionCategory === 'Technical') strengths.push("Appropriate technical terminology");
  
  if (clarity < 70) improvements.push("Structure your answer more clearly with logical flow");
  if (relevance < 70) improvements.push("Include more relevant details specific to the question");
  if (depth < 70) improvements.push("Provide specific examples from your experience");
  if (communication < 70) improvements.push("Expand on your answer with more detail and context");
  if (wordCount < 50) improvements.push("Provide more comprehensive answers");
  if (!hasExamples) improvements.push("Include concrete examples to illustrate your points");
  
  let feedback = "";
  if (overallScore >= 90) {
    feedback = "Excellent response! You demonstrated strong knowledge, clear communication, and provided relevant examples. This is exactly what interviewers want to hear.";
  } else if (overallScore >= 80) {
    feedback = "Great answer with solid understanding and good structure. Minor improvements in detail or examples could make it even stronger.";
  } else if (overallScore >= 70) {
    feedback = "Good response that shows understanding. Focus on providing more specific examples and structuring your answer more clearly.";
  } else if (overallScore >= 60) {
    feedback = "Decent foundation, but your answer needs more development. Add specific examples, technical details, and clearer structure.";
  } else {
    feedback = "Your answer needs significant improvement. Focus on providing specific examples, relevant details, and clearer explanations to demonstrate your expertise.";
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

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get user from session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.sessionId;
    const body: EvaluationRequest = await request.json();

    // Validate request
    if (!body.questionId || !body.questionText || !body.responseText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Evaluate the response
    const evaluation = evaluateAnswer(body);

    // Save the response to Supabase
    const { data: response, error } = await supabase
      .from('interview_responses')
      .insert([{
        session_id: sessionId,
        user_id: user.id,
        question_id: body.questionId,
        question_text: body.questionText,
        question_category: body.questionCategory,
        question_difficulty: body.questionDifficulty,
        response_text: body.responseText,
        audio_url: body.audioUrl,
        transcript_text: body.transcriptText,
        response_time: body.responseTime,
        evaluation,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving interview response:', error);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    // Update session response count and questions count
    const { data: responses } = await supabase
      .from('interview_responses')
      .select('id')
      .eq('session_id', sessionId);

    await supabase
      .from('interview_sessions')
      .update({ 
        responses_count: responses?.length || 0,
        questions_count: responses?.length || 0
      })
      .eq('id', sessionId);

    return NextResponse.json({
      responseId: response.id,
      evaluation,
      message: 'Response evaluated and saved successfully',
    });
  } catch (error) {
    console.error('Error evaluating response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}