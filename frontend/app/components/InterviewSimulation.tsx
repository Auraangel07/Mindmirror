'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Video,
  VideoOff,
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Star,
  Brain,
  Clock,
  Target,
  Zap,
  Award,
  Camera,
  Settings,
  AlertCircle
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: number;
  tips: string[];
  followUp?: string;
}

interface InterviewSimulationProps {
  roleId: string;
  onBack: () => void;
}

const roleConfigs = {
  'frontend-developer': {
    name: 'Frontend Developer',
    interviewer: {
      name: 'Sarah Mitchell',
      role: 'Senior Frontend Lead',
      avatar: '👩‍💻',
      personality: 'Technical but approachable, focused on user experience and modern frameworks.',
      background: 'from-blue-900/40 to-cyan-900/60'
    },
    questions: [
      {
        id: 'fe1',
        text: 'Tell me about your experience with React and how you handle state management in complex applications.',
        category: 'Technical',
        difficulty: 3,
        tips: ['Mention specific state management tools (Redux, Zustand, Context)', 'Discuss component architecture', 'Give concrete examples'],
        followUp: 'How do you optimize React applications for performance?'
      },
      {
        id: 'fe2',
        text: 'Walk me through how you would implement responsive design for a complex dashboard.',
        category: 'UI/UX',
        difficulty: 2,
        tips: ['Discuss mobile-first approach', 'Mention CSS Grid/Flexbox', 'Consider accessibility'],
        followUp: 'How do you test responsive designs across different devices?'
      },
      {
        id: 'fe3',
        text: 'Describe a challenging bug you encountered in JavaScript and how you debugged it.',
        category: 'Problem Solving',
        difficulty: 3,
        tips: ['Use STAR method', 'Explain debugging tools used', 'Show systematic approach'],
        followUp: 'What debugging tools do you prefer and why?'
      },
      {
        id: 'fe4',
        text: 'How do you ensure cross-browser compatibility in your applications?',
        category: 'Best Practices',
        difficulty: 2,
        tips: ['Mention testing strategies', 'Discuss polyfills and fallbacks', 'Talk about progressive enhancement'],
        followUp: 'What are your thoughts on supporting legacy browsers?'
      }
    ]
  },
  'backend-developer': {
    name: 'Backend Developer',
    interviewer: {
      name: 'Marcus Chen',
      role: 'Principal Backend Engineer',
      avatar: '👨‍💻',
      personality: 'Systematic thinker, focused on scalability, performance, and system architecture.',
      background: 'from-green-900/40 to-teal-900/60'
    },
    questions: [
      {
        id: 'be1',
        text: 'Explain how you would design a RESTful API for a social media platform.',
        category: 'System Design',
        difficulty: 4,
        tips: ['Start with requirements', 'Discuss endpoints and HTTP methods', 'Consider authentication and rate limiting'],
        followUp: 'How would you handle API versioning as the platform grows?'
      },
      {
        id: 'be2',
        text: 'Describe your approach to database optimization for a high-traffic application.',
        category: 'Database',
        difficulty: 4,
        tips: ['Discuss indexing strategies', 'Mention caching layers', 'Talk about query optimization'],
        followUp: 'When would you choose NoSQL over SQL databases?'
      },
      {
        id: 'be3',
        text: 'How do you handle error handling and logging in production applications?',
        category: 'Best Practices',
        difficulty: 3,
        tips: ['Discuss structured logging', 'Mention monitoring tools', 'Talk about error recovery strategies'],
        followUp: 'What metrics do you track to ensure application health?'
      },
      {
        id: 'be4',
        text: 'Explain microservices architecture and when you would recommend it.',
        category: 'Architecture',
        difficulty: 4,
        tips: ['Compare with monolithic architecture', 'Discuss communication patterns', 'Mention deployment challenges'],
        followUp: 'How do you handle data consistency across microservices?'
      }
    ]
  },
  'data-analyst': {
    name: 'Data Analyst',
    interviewer: {
      name: 'Dr. Emily Rodriguez',
      role: 'Senior Data Science Manager',
      avatar: '👩‍🔬',
      personality: 'Analytical and detail-oriented, passionate about extracting insights from data.',
      background: 'from-purple-900/40 to-indigo-900/60'
    },
    questions: [
      {
        id: 'da1',
        text: 'Walk me through your process for analyzing a new dataset.',
        category: 'Methodology',
        difficulty: 2,
        tips: ['Mention data exploration steps', 'Discuss data cleaning', 'Talk about validation'],
        followUp: 'How do you handle missing or inconsistent data?'
      },
      {
        id: 'da2',
        text: 'Explain the difference between correlation and causation with a real-world example.',
        category: 'Statistics',
        difficulty: 3,
        tips: ['Use clear examples', 'Discuss confounding variables', 'Mention experimental design'],
        followUp: 'How would you design an experiment to establish causation?'
      },
      {
        id: 'da3',
        text: 'Describe a time when you had to present complex data insights to non-technical stakeholders.',
        category: 'Communication',
        difficulty: 2,
        tips: ['Focus on storytelling', 'Mention visualization choices', 'Discuss simplification strategies'],
        followUp: 'What tools do you prefer for data visualization and why?'
      },
      {
        id: 'da4',
        text: 'How would you approach A/B testing for a new feature launch?',
        category: 'Experimentation',
        difficulty: 3,
        tips: ['Discuss sample size calculation', 'Mention statistical significance', 'Talk about bias prevention'],
        followUp: 'What would you do if the test results are inconclusive?'
      }
    ]
  },
  'product-manager': {
    name: 'Product Manager',
    interviewer: {
      name: 'Alex Thompson',
      role: 'VP of Product',
      avatar: '👨‍💼',
      personality: 'Strategic thinker, user-focused, excellent at balancing technical and business needs.',
      background: 'from-orange-900/40 to-red-900/60'
    },
    questions: [
      {
        id: 'pm1',
        text: 'How would you prioritize features for a product roadmap with limited resources?',
        category: 'Strategy',
        difficulty: 3,
        tips: ['Mention prioritization frameworks', 'Discuss stakeholder alignment', 'Consider user impact vs effort'],
        followUp: 'How do you handle conflicting priorities from different stakeholders?'
      },
      {
        id: 'pm2',
        text: 'Walk me through how you would launch a new product feature.',
        category: 'Execution',
        difficulty: 3,
        tips: ['Discuss go-to-market strategy', 'Mention success metrics', 'Talk about risk mitigation'],
        followUp: 'How do you measure the success of a feature post-launch?'
      },
      {
        id: 'pm3',
        text: 'Describe a time when you had to make a difficult product decision with incomplete information.',
        category: 'Decision Making',
        difficulty: 4,
        tips: ['Use STAR method', 'Show analytical thinking', 'Discuss how you gathered insights'],
        followUp: 'How do you balance data-driven decisions with intuition?'
      },
      {
        id: 'pm4',
        text: 'How do you work with engineering teams to ensure product requirements are clearly understood?',
        category: 'Collaboration',
        difficulty: 2,
        tips: ['Discuss documentation practices', 'Mention user stories and acceptance criteria', 'Talk about communication methods'],
        followUp: 'How do you handle scope creep during development?'
      }
    ]
  },
  'ux-designer': {
    name: 'UX Designer',
    interviewer: {
      name: 'Maya Patel',
      role: 'Design Director',
      avatar: '👩‍🎨',
      personality: 'Creative and empathetic, focused on user-centered design and design thinking.',
      background: 'from-pink-900/40 to-purple-900/60'
    },
    questions: [
      {
        id: 'ux1',
        text: 'Walk me through your design process from problem identification to final solution.',
        category: 'Process',
        difficulty: 2,
        tips: ['Mention user research methods', 'Discuss ideation and prototyping', 'Talk about testing and iteration'],
        followUp: 'How do you handle feedback that conflicts with user research findings?'
      },
      {
        id: 'ux2',
        text: 'Describe a challenging design problem you solved and your approach.',
        category: 'Problem Solving',
        difficulty: 3,
        tips: ['Use specific examples', 'Show design thinking process', 'Mention user impact'],
        followUp: 'What would you do differently if you could redo this project?'
      },
      {
        id: 'ux3',
        text: 'How do you ensure your designs are accessible to users with disabilities?',
        category: 'Accessibility',
        difficulty: 3,
        tips: ['Mention WCAG guidelines', 'Discuss inclusive design principles', 'Talk about testing methods'],
        followUp: 'How do you advocate for accessibility when there are budget constraints?'
      },
      {
        id: 'ux4',
        text: 'Explain how you would conduct user research for a completely new product.',
        category: 'Research',
        difficulty: 3,
        tips: ['Discuss research methods', 'Mention user personas', 'Talk about validation techniques'],
        followUp: 'How do you present research findings to stakeholders effectively?'
      }
    ]
  },
  'devops-engineer': {
    name: 'DevOps Engineer',
    interviewer: {
      name: 'James Wilson',
      role: 'DevOps Team Lead',
      avatar: '👨‍🔧',
      personality: 'Systematic and reliability-focused, passionate about automation and infrastructure.',
      background: 'from-gray-900/40 to-slate-900/60'
    },
    questions: [
      {
        id: 'do1',
        text: 'Explain your approach to implementing CI/CD pipelines for a microservices architecture.',
        category: 'CI/CD',
        difficulty: 4,
        tips: ['Discuss pipeline stages', 'Mention testing strategies', 'Talk about deployment patterns'],
        followUp: 'How do you handle rollbacks in a microservices environment?'
      },
      {
        id: 'do2',
        text: 'How would you design monitoring and alerting for a high-availability system?',
        category: 'Monitoring',
        difficulty: 4,
        tips: ['Discuss metrics and logs', 'Mention alerting strategies', 'Talk about incident response'],
        followUp: 'What&apos;s your approach to reducing alert fatigue?'
      },
      {
        id: 'do3',
        text: 'Describe your experience with Infrastructure as Code and its benefits.',
        category: 'Infrastructure',
        difficulty: 3,
        tips: ['Mention specific tools (Terraform, CloudFormation)', 'Discuss version control', 'Talk about reproducibility'],
        followUp: 'How do you handle secrets management in IaC?'
      },
      {
        id: 'do4',
        text: 'Walk me through how you would troubleshoot a production outage.',
        category: 'Troubleshooting',
        difficulty: 4,
        tips: ['Show systematic approach', 'Mention communication during incidents', 'Discuss post-mortem process'],
        followUp: 'How do you prevent similar issues from happening again?'
      }
    ]
  }
};

export default function InterviewSimulation({ roleId, onBack }: InterviewSimulationProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const config = roleConfigs[roleId as keyof typeof roleConfigs];
  const currentQuestion = config.questions[currentQuestionIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !sessionComplete) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sessionComplete]);

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
      setVideoEnabled(true);
      setAudioEnabled(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      // Allow proceeding without media if user denies permission
    }
  };

  const handleStartSession = () => {
    setIsPlaying(true);
    setTimeElapsed(0);
    setSetupComplete(true);
  };

  const handleNextQuestion = () => {
    if (currentResponse.trim()) {
      setResponses([...responses, currentResponse]);
      setCurrentResponse('');
      
      if (currentQuestionIndex < config.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        completeSession();
      }
    }
  };

  const completeSession = () => {
    setSessionComplete(true);
    setIsPlaying(false);
    // Calculate score based on responses and time
    const baseScore = Math.max(60, 100 - (timeElapsed / 60) * 2);
    const responseBonus = responses.length * 5;
    setScore(Math.min(100, Math.round(baseScore + responseBonus)));
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setResponses([]);
    setCurrentResponse('');
    setSessionComplete(false);
    setScore(0);
    setTimeElapsed(0);
    setIsPlaying(false);
    setSetupComplete(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Media Setup Screen
  if (!setupComplete) {
    return (
      <div className="min-h-screen cosmic-bg relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${config.interviewer.background} opacity-60`} />
        
        <div className="relative z-10 container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-3 bg-gray-800/50 rounded-xl border border-gray-600 hover:border-blue-500 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-white">{config.name} Interview</h1>
              <p className="text-gray-300">Setup your interview environment</p>
            </div>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Video Preview */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <Camera className="w-6 h-6 text-blue-400" />
                  Video Setup
                </h3>
                
                <div className="relative bg-gray-800 rounded-xl overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
                  {videoEnabled ? (
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Camera</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${videoEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mic className="w-5 h-5 text-green-400" />
                      <span className="text-white">Microphone</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${audioEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={requestMediaPermissions}
                  className="w-full mt-6 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  Enable Camera & Microphone
                </motion.button>
              </motion.div>

              {/* Interview Preview */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
              >
                <h3 className="text-xl font-bold text-white mb-6">Interview Details</h3>
                
                <div className="flex items-start gap-6 mb-6">
                  <div className="text-6xl">{config.interviewer.avatar}</div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">{config.interviewer.name}</h4>
                    <p className="text-blue-400 mb-3">{config.interviewer.role}</p>
                    <p className="text-gray-300 text-sm">{config.interviewer.personality}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-purple-400" />
                    <span className="text-white">Role: {config.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-green-400" />
                    <span className="text-white">{config.questions.length} Questions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">~15-20 minutes</span>
                  </div>
                </div>

                <div className="bg-blue-600/20 border border-blue-500 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 font-semibold">Interview Tips</span>
                  </div>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Speak clearly and maintain eye contact with the camera</li>
                    <li>• Take your time to think before answering</li>
                    <li>• Use specific examples from your experience</li>
                    <li>• Ask clarifying questions if needed</li>
                  </ul>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartSession}
                  disabled={!videoEnabled && !audioEnabled}
                  className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start Interview
                </motion.button>
                
                {!videoEnabled && !audioEnabled && (
                  <p className="text-gray-400 text-sm text-center mt-3">
                    Enable camera and microphone to start the interview
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session Complete Screen
  if (sessionComplete) {
    return (
      <div className="min-h-screen cosmic-bg relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-12 border border-gray-700">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <Award className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-4xl font-bold text-white mb-4">Interview Complete!</h2>
              <p className="text-xl text-gray-300 mb-8">
                You&apos;ve completed the {config.name} interview simulation
              </p>
              
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{score}%</div>
                  <div className="text-gray-400">Performance Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{formatTime(timeElapsed)}</div>
                  <div className="text-gray-400">Time Taken</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{responses.length}</div>
                  <div className="text-gray-400">Questions Answered</div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRestart}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Roles
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Active Interview Screen
  return (
    <div className="min-h-screen cosmic-bg relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.interviewer.background} opacity-60`} />
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-3 bg-gray-800/50 rounded-xl border border-gray-600 hover:border-blue-500 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-white">{config.name} Interview</h1>
              <p className="text-gray-300">with {config.interviewer.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-xl">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white font-mono">{formatTime(timeElapsed)}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-xl">
              <Target className="w-5 h-5 text-purple-400" />
              <span className="text-white">{currentQuestionIndex + 1}/{config.questions.length}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Question Panel */}
          <div className="lg:col-span-2">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 mb-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{config.interviewer.avatar}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{config.interviewer.name}</h3>
                    <p className="text-gray-400 text-sm">{currentQuestion.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < currentQuestion.difficulty ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-600/20 border border-blue-500 rounded-xl p-6 mb-6">
                <p className="text-white text-lg leading-relaxed">{currentQuestion.text}</p>
              </div>
              
              <textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Type your response here..."
                className="w-full h-32 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white resize-none focus:border-blue-500 focus:outline-none transition-colors"
              />
              
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsRecording(!isRecording)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-500' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {isRecording ? 'Stop Recording' : 'Voice Response'}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTips(!showTips)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl font-semibold transition-colors"
                  >
                    <Brain className="w-5 h-5" />
                    {showTips ? 'Hide Tips' : 'Show Tips'}
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextQuestion}
                  disabled={!currentResponse.trim()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-xl font-semibold transition-colors"
                >
                  {currentQuestionIndex === config.questions.length - 1 ? 'Complete' : 'Next Question'}
                </motion.button>
              </div>
            </motion.div>
            
            <AnimatePresence>
              {showTips && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-purple-600/20 border border-purple-500 rounded-xl p-6"
                >
                  <h4 className="text-lg font-semibold text-purple-400 mb-3">💡 Tips for this question:</h4>
                  <ul className="space-y-2">
                    {currentQuestion.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Progress Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-6">Progress</h3>
              
              <div className="space-y-4 mb-6">
                {config.questions.map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index < currentQuestionIndex 
                        ? 'bg-green-500 text-white' 
                        : index === currentQuestionIndex 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-600 text-gray-400'
                    }`}>
                      {index < currentQuestionIndex ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <span className={`text-sm ${
                      index <= currentQuestionIndex ? 'text-white' : 'text-gray-400'
                    }`}>
                      Question {index + 1}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(((currentQuestionIndex + (currentResponse ? 1 : 0)) / config.questions.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + (currentResponse ? 1 : 0)) / config.questions.length) * 100}%` }}
                    className="h-full bg-blue-500 rounded-full"
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}