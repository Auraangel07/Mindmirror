'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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
  Target
} from 'lucide-react';
import Enhanced3DHuman from './Enhanced3DHuman';
import SpeechRecorder from './SpeechRecorder';
import { APIClient } from '@/lib/api';

interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: number;
  expectedDuration: number;
}

interface AIAvatarInterviewProps {
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
      name: 'Eric',
      persona_id: 'p2e3bf82d71f',
      replica_id: 're10607e3db7',
      company: 'TechCorp',
      personality: 'Technical but approachable, focused on user experience and modern frameworks.'
    },
    instructions: "Welcome to your Frontend Developer interview. I'll be asking you both technical and behavioral questions about frontend development. Please answer clearly and provide specific examples when possible. Let's begin!",
    questions: [
      // Technical Questions
      { id: 'fe-t1', text: 'What is the difference between null and undefined in JavaScript?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'fe-t2', text: 'Explain the box model in CSS.', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'fe-t3', text: 'How does event delegation work in JavaScript?', category: 'Technical', difficulty: 3, expectedDuration: 120 },
      { id: 'fe-t4', text: 'What are the differences between React, Vue, and Angular?', category: 'Technical', difficulty: 3, expectedDuration: 150 },
      { id: 'fe-t5', text: 'What is DOM Virtualization?', category: 'Technical', difficulty: 3, expectedDuration: 120 },
      { id: 'fe-t6', text: 'What is the difference between == and ===?', category: 'Technical', difficulty: 1, expectedDuration: 90 },
      { id: 'fe-t7', text: 'Explain how localStorage, sessionStorage, and cookies differ.', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'fe-t8', text: 'What are SPA and SSR?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'fe-t9', text: 'How would you optimize a website's performance?', category: 'Technical', difficulty: 3, expectedDuration: 150 },
      { id: 'fe-t10', text: 'What is CORS and how do you handle it on the frontend?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      // General/Behavioral
      { id: 'fe-b1', text: 'How do you stay updated with frontend technologies?', category: 'General/Behavioral', difficulty: 1, expectedDuration: 90 },
      { id: 'fe-b2', text: 'How do you handle browser compatibility issues?', category: 'General/Behavioral', difficulty: 2, expectedDuration: 120 },
      { id: 'fe-b3', text: 'Can you describe a UI project you're most proud of?', category: 'General/Behavioral', difficulty: 2, expectedDuration: 120 },
      { id: 'fe-b4', text: 'How do you manage large-scale CSS?', category: 'General/Behavioral', difficulty: 2, expectedDuration: 120 },
      { id: 'fe-b5', text: 'What tools do you use for debugging frontend issues?', category: 'General/Behavioral', difficulty: 1, expectedDuration: 90 },
    ]
  },
  'backend-developer': {
    name: 'Backend Developer',
    interviewer: {
      name: 'Claire Dalton',
      persona_id: 'p3f85b2723cc',
      replica_id: 're0eae1fbe11',
      company: 'DataFlow Inc',
      personality: 'Systematic thinker, focused on scalability and performance.'
    },
    instructions: "Hello! I'm Claire Dalton, and I'll be conducting your Backend Developer interview today. We'll discuss both technical and behavioral aspects of backend development. Please provide detailed explanations and real-world examples. Let's begin!",
    questions: [
      // Technical Questions
      { id: 'be-t1', text: 'What is REST API and how is it different from GraphQL?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'be-t2', text: 'How do JWT tokens work for authentication?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'be-t3', text: 'What are the differences between SQL and NoSQL databases?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'be-t4', text: 'Explain the MVC architecture.', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'be-t5', text: 'How do you handle rate limiting in an API?', category: 'Technical', difficulty: 3, expectedDuration: 120 },
      { id: 'be-t6', text: 'What are middleware functions in Express.js?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'be-t7', text: 'How does load balancing work?', category: 'Technical', difficulty: 3, expectedDuration: 120 },
      { id: 'be-t8', text: 'What is ORM and give examples (e.g., Sequelize, TypeORM)?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'be-t9', text: 'How do you ensure secure password storage?', category: 'Technical', difficulty: 3, expectedDuration: 120 },
      { id: 'be-t10', text: 'What is a webhook and when would you use one?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      // General/Behavioral
      { id: 'be-b1', text: 'How do you handle and log errors on the backend?', category: 'General/Behavioral', difficulty: 2, expectedDuration: 120 },
      { id: 'be-b2', text: 'Describe a time you had to scale a backend system.', category: 'General/Behavioral', difficulty: 3, expectedDuration: 150 },
      { id: 'be-b3', text: 'How do you structure your database for performance?', category: 'General/Behavioral', difficulty: 2, expectedDuration: 120 },
      { id: 'be-b4', text: 'How do you ensure your API is secure?', category: 'General/Behavioral', difficulty: 3, expectedDuration: 120 },
      { id: 'be-b5', text: 'What do you do when your server crashes unexpectedly?', category: 'General/Behavioral', difficulty: 2, expectedDuration: 120 },
    ]
  },
  'data-analyst': {
    name: 'Data Analyst',
    interviewer: {
      name: 'Evelyn Cross',
      persona_id: 'p87da90823bb',
      replica_id: 'r4dcf31b60e1',
      company: 'Analytics Pro',
      personality: 'Detail-oriented, passionate about extracting insights from data.'
    },
    instructions: "Hi there! I'm Evelyn Cross, and I'll be your interviewer for the Data Analyst position. We'll explore both technical and behavioral aspects of data analysis. Please explain your thought process and provide concrete examples. Let's begin!",
    questions: [
      // Technical Questions
      { id: 'da-t1', text: 'What is the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN in SQL?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'da-t2', text: 'How would you handle missing data?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'da-t3', text: 'Explain normalization and denormalization in databases.', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'da-t4', text: 'What's the difference between variance and standard deviation?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'da-t5', text: 'What is p-value and how is it used in hypothesis testing?', category: 'Technical', difficulty: 3, expectedDuration: 120 },
      { id: 'da-t6', text: 'What are some common KPIs you've worked with?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'da-t7', text: 'Describe how you would build a dashboard for sales performance.', category: 'Technical', difficulty: 3, expectedDuration: 150 },
      { id: 'da-t8', text: 'What are the differences between Excel, SQL, and Python in data analysis?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'da-t9', text: 'How do you decide which visualization to use for which data?', category: 'Technical', difficulty: 2, expectedDuration: 120 },
      { id: 'da-t10', text: 'What is ETL? Explain a simple pipeline you've built.', category: 'Technical', difficulty: 3, expectedDuration: 150 },
      // General/Behavioral
      { id: 'da-b1', text: 'How do you prioritize when working with multiple stakeholders?', category: 'General/Behavioral', difficulty: 2, expectedDuration: 120 },
      { id: 'da-b2', text: 'Describe a time you found a critical insight from data.', category: 'General/Behavioral', difficulty: 3, expectedDuration: 150 },
      { id: 'da-b3', text: 'How do you validate the accuracy of your data?', category: 'General/Behavioral', difficulty: 2, expectedDuration: 120 },
      { id: 'da-b4', text: 'How do you explain technical insights to non-technical stakeholders?', category: 'General/Behavioral', difficulty: 2, expectedDuration: 120 },
      { id: 'da-b5', text: 'Describe a time your analysis influenced a business decision.', category: 'General/Behavioral', difficulty: 3, expectedDuration: 150 },
    ]
  }
};

export default function AIAvatarInterview({ roleId, onBack }: AIAvatarInterviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 for instructions
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isAIListening, setIsAIListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const config = roleConfigs[roleId as keyof typeof roleConfigs];
  const currentQuestion = currentQuestionIndex >= 0 ? config.questions[currentQuestionIndex] : null;
  const personaId = config.interviewer.persona_id;
  const replicaId = config.interviewer.replica_id;

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
    };
  }, [mediaStream]);

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

  const startInterview = async () => {
    try {
      // Start interview session in database
      const response = await APIClient.startInterview(roleId, config.name);
      setSessionId(response.sessionId);
      setStartTime(Date.now());
      setIsInterviewStarted(true);
      speakInstructions();
    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview. Please try again.');
    }
  };

  const speakInstructions = () => {
    setIsAISpeaking(true);
    setCurrentSpeechText(config.instructions);
  };

  const handleSpeechComplete = () => {
    setIsAISpeaking(false);
    setCurrentSpeechText('');
    
    if (currentQuestionIndex === -1) {
      // Instructions complete, move to first question
      setTimeout(() => {
        setCurrentQuestionIndex(0);
        askCurrentQuestion();
      }, 1000);
    } else {
      // Question complete, start listening
      setIsAIListening(true);
    }
  };

  const askCurrentQuestion = () => {
    if (currentQuestion) {
      setIsAISpeaking(true);
      setCurrentSpeechText(currentQuestion.text);
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
              <p className="text-gray-300">with {config.interviewer.name}</p>
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
                <Canvas camera={{ position: [0, 0, 5] }}>
                  <ambientLight intensity={0.6} />
                  <pointLight position={[10, 10, 10]} />
                  <pointLight position={[-10, -10, -10]} intensity={0.3} />
                  <Suspense fallback={null}>
                    <Enhanced3DHuman 
                      isListening={false} 
                      isSpeaking={false}
                      currentText=""
                    />
                  </Suspense>
                  <OrbitControls enableZoom={false} />
                </Canvas>
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startInterview}
                disabled={!isVideoEnabled || !isAudioEnabled}
                className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <Phone className="w-5 h-5" />
                Start Interview
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Interview Screen
  if (isInterviewStarted && !showResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
        {/* Persona Embed - Centered */}
        {personaId && replicaId && (
          <div className="w-full flex justify-center mb-8">
            <iframe
              src={`https://embed.tavus.io/persona/${personaId}/replica/${replicaId}`}
              style={{ width: '100%', maxWidth: 480, height: 480, border: 'none', borderRadius: 16, background: '#111' }}
              title="Tavus Persona Interviewer"
              allow="camera; microphone; autoplay"
            />
          </div>
        )}
        {/* Main Interview Interface */}
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8">
          {/* Interviewer Side */}
          <div className="flex flex-col">
            <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 rounded-t-2xl">
              <button onClick={onBack} className="text-white hover:text-blue-400">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold mt-2">{config.name} Interview</h1>
              <p className="text-gray-300">with {config.interviewer.name}</p>
            </div>
            <div className="flex-1 p-8">
              <div className="bg-blue-600/20 border border-blue-500 rounded-xl p-4 mb-4">
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
                            className={`w-3 h-3 ${i < currentQuestion.difficulty ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-white">{currentQuestion.text}</p>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg mb-4">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-mono">{formatTime(timeElapsed)}</span>
                <MessageSquare className="w-4 h-4 text-purple-400 ml-4" />
                <span className="text-sm">
                  {currentQuestionIndex === -1 ? 'Instructions' : `${currentQuestionIndex + 1}/${config.questions.length}`}
                </span>
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
          </div>
          {/* User Video Side */}
          <div className="flex flex-col">
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
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-semibold transition-colors"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}