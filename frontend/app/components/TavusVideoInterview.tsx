'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Settings,
  Clock,
  MessageSquare,
  Maximize,
  Minimize,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  BarChart3,
  Brain,
  Target,
  Loader2,
  Mic,
  MicOff
} from 'lucide-react';
import { tavusClient, tavusPersonas, TavusSession, TavusContext } from '@/lib/tavus';
import SpeechRecorder from './SpeechRecorder';
import { APIClient } from '@/lib/api';

interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: number;
  expectedDuration: number;
}

interface TavusVideoInterviewProps {
  roleId: string;
  onBack: () => void;
}

interface Evaluation {
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

const roleConfigs = {
  'frontend-developer': {
    name: 'Frontend Developer',
    interviewer: {
      name: 'Eric - Frontend Expert',
      role: 'Senior Frontend Lead',
      company: 'TechCorp',
      personality: 'Technical but approachable, focused on user experience and modern frameworks.'
    },
    instructions: "Welcome to your Frontend Developer interview. I'm Eric, and I'll be asking you questions about React, JavaScript, CSS, and modern web development practices. Please answer clearly and provide specific examples when possible. Let's begin!",
    questions: [
      {
        id: 'fe1',
        text: 'Tell me about your experience with React and how you handle state management in complex applications.',
        category: 'Technical',
        difficulty: 3,
        expectedDuration: 180
      },
      {
        id: 'fe2',
        text: 'Walk me through how you would implement responsive design for a complex dashboard.',
        category: 'UI/UX',
        difficulty: 2,
        expectedDuration: 150
      },
      {
        id: 'fe3',
        text: 'Describe a challenging bug you encountered in JavaScript and how you debugged it.',
        category: 'Problem Solving',
        difficulty: 3,
        expectedDuration: 200
      },
      {
        id: 'fe4',
        text: 'How do you ensure your applications are accessible to users with disabilities?',
        category: 'Best Practices',
        difficulty: 2,
        expectedDuration: 160
      }
    ]
  },
  'backend-developer': {
    name: 'Backend Developer',
    interviewer: {
      name: 'Eric - Backend Specialist',
      role: 'Principal Backend Engineer',
      company: 'DataFlow Inc',
      personality: 'Systematic thinker, focused on scalability and performance.'
    },
    instructions: "Hello! I'm Eric, and I'll be conducting your Backend Developer interview today. We'll discuss APIs, databases, system design, and backend architecture. Please provide detailed explanations and real-world examples. Ready to start?",
    questions: [
      {
        id: 'be1',
        text: 'Explain how you would design a RESTful API for a social media platform.',
        category: 'System Design',
        difficulty: 4,
        expectedDuration: 240
      },
      {
        id: 'be2',
        text: 'Describe your approach to database optimization for a high-traffic application.',
        category: 'Database',
        difficulty: 4,
        expectedDuration: 220
      },
      {
        id: 'be3',
        text: 'How do you handle error handling and logging in production applications?',
        category: 'Best Practices',
        difficulty: 3,
        expectedDuration: 180
      }
    ]
  },
  'data-analyst': {
    name: 'Data Analyst',
    interviewer: {
      name: 'Eric - Data Expert',
      role: 'Senior Data Science Manager',
      company: 'Analytics Pro',
      personality: 'Detail-oriented, passionate about extracting insights from data.'
    },
    instructions: "Hi there! I'm Eric, and I'll be your interviewer for the Data Analyst position. We'll explore your experience with data analysis, statistics, and business insights. Please explain your thought process and provide concrete examples. Let's dive into the world of data!",
    questions: [
      {
        id: 'da1',
        text: 'Walk me through your process for analyzing a new dataset.',
        category: 'Methodology',
        difficulty: 2,
        expectedDuration: 180
      },
      {
        id: 'da2',
        text: 'Explain the difference between correlation and causation with a real-world example.',
        category: 'Statistics',
        difficulty: 3,
        expectedDuration: 160
      },
      {
        id: 'da3',
        text: 'How would you present complex data insights to non-technical stakeholders?',
        category: 'Communication',
        difficulty: 2,
        expectedDuration: 150
      }
    ]
  }
};

export default function TavusVideoInterview({ roleId, onBack }: TavusVideoInterviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 for instructions
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isAIListening, setIsAIListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Tavus-specific state
  const [tavusSession, setTavusSession] = useState<TavusSession | null>(null);
  const [isConnectingTavus, setIsConnectingTavus] = useState(false);
  const [tavusError, setTavusError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const tavusVideoRef = useRef<HTMLVideoElement>(null);
  const config = roleConfigs[roleId as keyof typeof roleConfigs];
  const currentQuestion = currentQuestionIndex >= 0 ? config.questions[currentQuestionIndex] : null;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInterviewStarted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInterviewStarted]);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (tavusSession) {
        tavusClient.endSession(tavusSession.session_id).catch(console.error);
      }
    };
  }, [mediaStream, tavusSession]);

  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setMediaStream(stream);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      setMediaPermissionDenied(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setMediaPermissionDenied(true);
      }
    }
  };

  const startTavusSession = async () => {
    setIsConnectingTavus(true);
    setTavusError(null);
    
    try {
      const persona = tavusPersonas[roleId];
      if (!persona) {
        throw new Error('Persona not found for role');
      }

      const context: TavusContext = {
        user_name: "Candidate",
        role: config.name,
        interview_type: "technical_interview",
        goals: ["assessment", "skill_evaluation", "cultural_fit"],
        experience_level: "mid_level"
      };

      const session = await tavusClient.startPersonaSession(
        persona.id,
        persona.replicaId,
        context
      );

      setTavusSession(session);
      
      // If there's a stream URL, set it up
      if (session.stream_url && tavusVideoRef.current) {
        tavusVideoRef.current.src = session.stream_url;
      }
      
    } catch (error: any) {
      console.error('Failed to start Tavus session:', error);
      setTavusError(error.message || 'Failed to connect to AI interviewer');
    } finally {
      setIsConnectingTavus(false);
    }
  };

  const startInterview = async () => {
    try {
      // Start interview session in database
      const response = await APIClient.startInterview(roleId, config.name);
      setSessionId(response.sessionId);
      setStartTime(Date.now());
      
      // Start Tavus session
      await startTavusSession();
      
      setIsInterviewStarted(true);
      
      // Send initial instructions to Tavus
      if (tavusSession) {
        await tavusClient.sendMessage(tavusSession.session_id, config.instructions);
        setIsAISpeaking(true);
        
        // Simulate AI speaking time
        setTimeout(() => {
          setIsAISpeaking(false);
          setCurrentQuestionIndex(0);
          askCurrentQuestion();
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview. Please try again.');
    }
  };

  const askCurrentQuestion = async () => {
    if (currentQuestion && tavusSession) {
      setIsAISpeaking(true);
      try {
        await tavusClient.sendMessage(tavusSession.session_id, currentQuestion.text);
        
        // Simulate AI speaking time
        setTimeout(() => {
          setIsAISpeaking(false);
          setIsAIListening(true);
        }, 3000);
      } catch (error) {
        console.error('Failed to send question to Tavus:', error);
        setIsAISpeaking(false);
        setIsAIListening(true);
      }
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob, transcript: string) => {
    if (!sessionId || !currentQuestion) return;
    
    setIsAIListening(false);
    setIsEvaluating(true);

    try {
      const responseTime = Math.floor((Date.now() - startTime) / 1000);
      
      // Submit response to backend
      const response = await APIClient.submitResponse(sessionId, {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        questionCategory: currentQuestion.category,
        questionDifficulty: currentQuestion.difficulty,
        responseText: transcript,
        responseTime
      });

      setEvaluations(prev => [...prev, response.evaluation]);
      
      // Send response to Tavus for context
      if (tavusSession) {
        await tavusClient.sendMessage(tavusSession.session_id, 
          `Candidate answered: "${transcript}". Please provide brief feedback and move to the next question.`
        );
      }
      
      // Move to next question or complete interview
      if (currentQuestionIndex < config.questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          askCurrentQuestion();
        }, 2000);
      } else {
        setTimeout(() => {
          completeInterview();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const completeInterview = async () => {
    if (!sessionId) return;
    
    try {
      await APIClient.completeInterview(sessionId, timeElapsed);
      
      // End Tavus session
      if (tavusSession) {
        await tavusClient.endSession(tavusSession.session_id);
        setTavusSession(null);
      }
      
      setIsInterviewStarted(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error completing interview:', error);
      // Still show results even if completion fails
      setIsInterviewStarted(false);
      setShowResults(true);
    }
  };

  const calculateOverallScore = () => {
    if (evaluations.length === 0) return 0;
    return Math.round(evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Results Screen
  if (showResults) {
    const overallScore = calculateOverallScore();
    
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-3 bg-gray-800 rounded-xl border border-gray-600 hover:border-blue-500 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold">Interview Complete!</h1>
              <p className="text-gray-300">{config.name} Interview Results</p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Overall Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center"
            >
              <div className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-bold ${
                overallScore >= 80 ? 'bg-green-600' : overallScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
              }`}>
                {overallScore}%
              </div>
              <h3 className="text-2xl font-bold mb-2">Overall Score</h3>
              <p className="text-gray-400">
                {overallScore >= 80 ? 'Excellent Performance!' : 
                 overallScore >= 60 ? 'Good Performance' : 'Needs Improvement'}
              </p>
            </motion.div>

            {/* Detailed Results */}
            <div className="lg:col-span-2 space-y-6">
              {evaluations.map((evaluation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Question {index + 1}</h4>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      evaluation.score >= 80 ? 'bg-green-600' : 
                      evaluation.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                      {evaluation.score}%
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{evaluation.feedback}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="text-green-400 font-semibold mb-2">Strengths:</h5>
                      <ul className="space-y-1">
                        {evaluation.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-yellow-400 font-semibold mb-2">Areas for Improvement:</h5>
                      <ul className="space-y-1">
                        {evaluation.improvements.map((improvement, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <Target className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{evaluation.detailedAnalysis.clarity}</div>
                      <div className="text-xs text-gray-400">Clarity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{evaluation.detailedAnalysis.relevance}</div>
                      <div className="text-xs text-gray-400">Relevance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{evaluation.detailedAnalysis.depth}</div>
                      <div className="text-xs text-gray-400">Depth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{evaluation.detailedAnalysis.communication}</div>
                      <div className="text-xs text-gray-400">Communication</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Setup Screen
  if (!isInterviewStarted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-3 bg-gray-800 rounded-xl border border-gray-600 hover:border-blue-500 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold">{config.name} Interview</h1>
              <p className="text-gray-300">with AI-Powered Video Interviewer</p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Video Setup */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Video className="w-6 h-6 text-blue-400" />
                Camera Setup
              </h3>
              
              <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
                {isVideoEnabled ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <VideoOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Camera not enabled</p>
                    </div>
                  </div>
                )}
              </div>

              {mediaPermissionDenied && (
                <div className="mb-6 p-4 bg-red-600/20 border border-red-500 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-400 font-semibold mb-1">Permission Denied</h4>
                      <p className="text-red-200 text-sm">
                        Camera and microphone access was denied. Please enable permissions and try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={requestMediaPermissions}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <Settings className="w-5 h-5" />
                Enable Camera & Microphone
              </motion.button>
            </div>

            {/* AI Interviewer Preview */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <h3 className="text-xl font-bold mb-6">Meet Your AI Interviewer</h3>
              
              <div className="bg-gray-900 rounded-xl p-6 mb-6" style={{ height: '300px' }}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-12 h-12 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">AI-Powered Video Interview</h4>
                    <p className="text-gray-400 text-sm">
                      Experience realistic conversations with our advanced AI interviewer
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-blue-400">{config.interviewer.name}</h4>
                  <p className="text-gray-300">{config.interviewer.role}</p>
                  <p className="text-gray-400 text-sm">{config.interviewer.company}</p>
                </div>
                
                <div className="bg-blue-600/20 border border-blue-500 rounded-xl p-4">
                  <p className="text-blue-100 text-sm">{config.interviewer.personality}</p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Questions: {config.questions.length}</span>
                  <span className="text-gray-400">Duration: ~15-20 min</span>
                </div>
              </div>

              {tavusError && (
                <div className="mb-6 p-4 bg-red-600/20 border border-red-500 rounded-xl">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-400 font-semibold mb-1">Connection Error</h4>
                      <p className="text-red-200 text-sm">{tavusError}</p>
                    </div>
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startInterview}
                disabled={!isVideoEnabled || !isAudioEnabled || isConnectingTavus}
                className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                {isConnectingTavus ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting to AI...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Start AI Interview
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Interview Screen
  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gray-900 text-white`}>
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h2 className="font-semibold">{config.name} Interview</h2>
              <p className="text-sm text-gray-400">with {config.interviewer.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-mono">{formatTime(timeElapsed)}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="text-sm">
                {currentQuestionIndex === -1 ? 'Instructions' : `${currentQuestionIndex + 1}/${config.questions.length}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interview Interface */}
      <div className="grid lg:grid-cols-2 h-[calc(100vh-80px)]">
        {/* AI Interviewer Side */}
        <div className="relative bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex flex-col">
          <div className="flex-1 p-8">
            <div className="h-full bg-gray-800/50 rounded-2xl overflow-hidden">
              {tavusSession?.stream_url ? (
                <video
                  ref={tavusVideoRef}
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    {isConnectingTavus ? (
                      <>
                        <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
                        <p className="text-white">Connecting to AI Interviewer...</p>
                      </>
                    ) : (
                      <>
                        <Brain className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <p className="text-white">AI Interviewer Ready</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* AI Status */}
          <div className="p-6 bg-gray-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{config.interviewer.name}</h3>
                <p className="text-gray-400 text-sm">{config.interviewer.role}</p>
              </div>
              <div className="flex items-center gap-2">
                {isAISpeaking && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-sm">Speaking...</span>
                  </div>
                )}
                {isAIListening && (
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm">Listening...</span>
                  </div>
                )}
                {isEvaluating && (
                  <div className="flex items-center gap-2 text-purple-400">
                    <Brain className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Evaluating...</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Current Question or Instructions */}
            <div className="bg-blue-600/20 border border-blue-500 rounded-xl p-4">
              {currentQuestionIndex === -1 ? (
                <div>
                  <h4 className="text-blue-400 font-semibold mb-2">Interview Instructions</h4>
                  <p className="text-white text-sm">{config.instructions}</p>
                </div>
              ) : currentQuestion ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">{currentQuestion.category}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < currentQuestion.difficulty ? 'text-yellow-400 fill-current' : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-white">{currentQuestion.text}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* User Video Side */}
        <div className="relative bg-gray-900 flex flex-col">
          <div className="flex-1 p-8">
            <div className="h-full bg-gray-800 rounded-2xl overflow-hidden relative">
              {isVideoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <VideoOff className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          
          {/* Recording Controls */}
          <div className="p-6 bg-gray-800/80 backdrop-blur-sm">
            <SpeechRecorder
              onRecordingComplete={handleRecordingComplete}
              isListening={isAIListening}
              disabled={isAISpeaking || isEvaluating || currentQuestionIndex === -1}
            />
            
            <div className="flex items-center justify-center mt-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onBack}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-semibold transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
                End Interview
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fullscreen Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="fixed bottom-4 right-4 z-30 p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </motion.button>
    </div>
  );
}