'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Users, 
  Brain, 
  Trophy, 
  Play, 
  Settings,
  Star,
  Target,
  Gamepad2,
  Sparkles,
  Code,
  Briefcase,
  LogIn,
  UserPlus,
  LogOut,
  User,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import MultiversePortals from './components/MultiversePortals';
import AvatarCustomization from './components/AvatarCustomization';
import ProgressDashboard from './components/ProgressDashboard';
import AuthModal from './components/AuthModal';
import SetupGuide from './components/SetupGuide';

export default function Home() {
  const [currentView, setCurrentView] = useState<'home' | 'interviews' | 'avatar' | 'progress' | 'setup'>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  const { user, userProfile, loading, logout } = useAuth();

  // Show setup guide if Supabase is not configured
  useEffect(() => {
    if (!isSupabaseConfigured && currentView === 'home') {
      setCurrentView('setup');
    }
  }, [currentView]);

  const handleAuthAction = (mode: 'login' | 'signup') => {
    if (!isSupabaseConfigured) {
      setCurrentView('setup');
      return;
    }
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentView('home'); // Return to home after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProtectedAction = (view: 'interviews' | 'avatar' | 'progress') => {
    if (!isSupabaseConfigured) {
      setCurrentView('setup');
      return;
    }
    if (!user) {
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }
    setCurrentView(view);
  };

  const handleSetupComplete = () => {
    setCurrentView('home');
    // Reload the page to reinitialize with new Supabase config
    window.location.reload();
  };

  // Close auth modal when user successfully authenticates
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [user, showAuthModal]);

  const stats = [
    { icon: Brain, label: 'Confidence XP', value: userProfile?.total_xp?.toLocaleString() || '0', color: 'text-blue-400' },
    { icon: Trophy, label: 'Current Level', value: userProfile?.level?.toString() || '1', color: 'text-purple-400' },
    { icon: Target, label: 'Subscription', value: userProfile?.subscription_tier || 'Free', color: 'text-green-400' },
    { icon: Star, label: 'Member Since', value: userProfile?.created_at ? new Date(userProfile.created_at).getFullYear().toString() : '2024', color: 'text-yellow-400' },
  ];

  const renderCurrentView = () => {
    // Show setup guide if Supabase is not configured
    if (currentView === 'setup') {
      return <SetupGuide onComplete={handleSetupComplete} />;
    }

    // Require authentication for protected views
    if (!user && (currentView === 'interviews' || currentView === 'avatar' || currentView === 'progress')) {
      setCurrentView('home');
      return null;
    }

    switch (currentView) {
      case 'interviews':
        return <MultiversePortals onBack={() => setCurrentView('home')} />;
      case 'avatar':
        return <AvatarCustomization onBack={() => setCurrentView('home')} />;
      case 'progress':
        return <ProgressDashboard onBack={() => setCurrentView('home')} />;
      default:
        return (
          <div className="min-h-screen cosmic-bg relative overflow-hidden">
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 container mx-auto px-6 py-12">
              {/* Supabase Warning Banner */}
              {!isSupabaseConfigured && (
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 bg-yellow-600/20 border border-yellow-500 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-yellow-400 font-semibold">Supabase Setup Required</h4>
                      <p className="text-yellow-100 text-sm">
                        Authentication and data features are disabled. 
                        <button 
                          onClick={() => setCurrentView('setup')}
                          className="ml-2 underline hover:no-underline"
                        >
                          Click here to set up Supabase
                        </button>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Header with Auth */}
              <div className="flex items-center justify-between mb-8">
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center flex-1"
                >
                  <h1 className="text-6xl md:text-8xl font-bold font-orbitron glow-text mb-6">
                    MirrorMind
                  </h1>
                  <p className="text-2xl md:text-3xl text-blue-300 mb-4">
                    Master Any Interview
                  </p>
                  <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                    Practice with AI-powered role-based interviews. Get real-time feedback, 
                    build confidence, and land your dream job.
                  </p>
                </motion.div>

                {/* Auth Section */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex items-center gap-4"
                >
                  {loading ? (
                    <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : user ? (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {userProfile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-gray-400 text-sm">Level {userProfile?.level || 1}</p>
                      </div>
                      {(user.user_metadata?.avatar_url || userProfile?.photo_url) && (
                        <img 
                          src={user.user_metadata?.avatar_url || userProfile?.photo_url} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full border-2 border-blue-400"
                        />
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-semibold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </motion.button>
                    </div>
                  ) : isSupabaseConfigured ? (
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAuthAction('login')}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl font-semibold transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAuthAction('signup')}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-semibold transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Sign Up
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentView('setup')}
                      className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-xl font-semibold transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Setup Required
                    </motion.button>
                  )}
                </motion.div>
              </div>

              {/* Stats Grid - Only show for authenticated users */}
              {user && userProfile && isSupabaseConfigured && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      whileHover={{ scale: 1.05 }}
                      className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300"
                    >
                      <stat.icon className={`w-8 h-8 ${stat.color} mb-3`} />
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Main Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="grid md:grid-cols-3 gap-8 mb-16"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProtectedAction('interviews')}
                  className="group relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-left overflow-hidden hover:from-blue-500 hover:to-purple-600 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Code className="w-12 h-12 text-white mb-4 relative z-10" />
                  <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Role-Based Interviews</h3>
                  <p className="text-blue-100 relative z-10">
                    Practice interviews for Frontend, Backend, Data Analyst, Product Manager, and more
                  </p>
                  {(!user || !isSupabaseConfigured) && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                      {!isSupabaseConfigured ? 'Setup required' : 'Sign up required'}
                    </div>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProtectedAction('avatar')}
                  className="group relative bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl p-8 text-left overflow-hidden hover:from-purple-500 hover:to-pink-600 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Users className="w-12 h-12 text-white mb-4 relative z-10" />
                  <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Avatar Studio</h3>
                  <p className="text-purple-100 relative z-10">
                    Customize your professional persona and practice your presence
                  </p>
                  {(!user || !isSupabaseConfigured) && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                      {!isSupabaseConfigured ? 'Setup required' : 'Sign up required'}
                    </div>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProtectedAction('progress')}
                  className="group relative bg-gradient-to-br from-green-600 to-teal-700 rounded-2xl p-8 text-left overflow-hidden hover:from-green-500 hover:to-teal-600 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Trophy className="w-12 h-12 text-white mb-4 relative z-10" />
                  <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Progress Hub</h3>
                  <p className="text-green-100 relative z-10">
                    Track your growth, unlock achievements, and level up your skills
                  </p>
                  {(!user || !isSupabaseConfigured) && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                      {!isSupabaseConfigured ? 'Setup required' : 'Sign up required'}
                    </div>
                  )}
                </motion.button>
              </motion.div>

              {/* Quick Start Section */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Ready to Begin?</h3>
                    <p className="text-gray-300">
                      {!isSupabaseConfigured 
                        ? "Set up Supabase to enable authentication and data features"
                        : user 
                        ? "Start with a Frontend Developer interview - perfect for beginners"
                        : "Sign up now to access AI-powered interview practice"
                      }
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!isSupabaseConfigured) {
                        setCurrentView('setup');
                      } else if (user) {
                        handleProtectedAction('interviews');
                      } else {
                        handleAuthAction('signup');
                      }
                    }}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-semibold transition-colors duration-300"
                  >
                    {!isSupabaseConfigured ? <Settings className="w-5 h-5" /> : user ? <Play className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {!isSupabaseConfigured ? 'Setup Supabase' : user ? 'Quick Start' : 'Get Started'}
                  </motion.button>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <span>AI-Powered Feedback</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span>Real-time Video Practice</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Brain className="w-5 h-5 text-green-400" />
                    <span>Role-Specific Questions</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderCurrentView()}
      {isSupabaseConfigured && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      )}
    </>
  );
}