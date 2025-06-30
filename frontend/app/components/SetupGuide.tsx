'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Key, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Copy,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { isSupabaseConfigured, checkSupabaseConnection } from '@/lib/supabase';

interface SetupGuideProps {
  onComplete?: () => void;
}

export default function SetupGuide({ onComplete }: SetupGuideProps) {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    error: string | null;
    checking: boolean;
  }>({
    connected: false,
    error: null,
    checking: true
  });

  const checkConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, checking: true }));
    
    const result = await checkSupabaseConnection();
    setConnectionStatus({
      connected: result.connected,
      error: result.error,
      checking: false
    });
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const setupSteps = [
    {
      title: 'Create Supabase Project',
      description: 'Sign up at supabase.com and create a new project',
      action: (
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white font-semibold transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Supabase
        </a>
      )
    },
    {
      title: 'Get Project Credentials',
      description: 'Go to Project Settings > API to find your URL and anon key',
      action: (
        <div className="text-sm text-gray-400">
          Look for &quot;Project URL&quot; and &quot;anon public&quot; key
        </div>
      )
    },
    {
      title: 'Update Environment Variables',
      description: 'Replace the placeholder values in your .env.local file',
      action: (
        <div className="space-y-2">
          <div className="bg-gray-800 p-3 rounded-lg font-mono text-sm">
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL=your_url_here</span>
              <button
                onClick={() => copyToClipboard('NEXT_PUBLIC_SUPABASE_URL=')}
                className="text-blue-400 hover:text-blue-300"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg font-mono text-sm">
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here</span>
              <button
                onClick={() => copyToClipboard('NEXT_PUBLIC_SUPABASE_ANON_KEY=')}
                className="text-blue-400 hover:text-blue-300"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Restart Development Server',
      description: 'Stop and restart your dev server to load new environment variables',
      action: (
        <div className="bg-gray-800 p-3 rounded-lg font-mono text-sm">
          npm run dev
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Database className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Supabase Setup Required</h1>
          <p className="text-gray-300 text-lg">
            Configure your Supabase connection to enable authentication and data storage
          </p>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Connection Status</h3>
            <button
              onClick={checkConnection}
              disabled={connectionStatus.checking}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${connectionStatus.checking ? 'animate-spin' : ''}`} />
              Check Connection
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {connectionStatus.checking ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-300">Checking connection...</span>
              </>
            ) : connectionStatus.connected ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">Connected to Supabase</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-semibold">
                  Not connected: {connectionStatus.error}
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Setup Steps */}
        <div className="space-y-6">
          {setupSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  {step.action}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-yellow-600/20 border border-yellow-500 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2">Important Notes</h4>
              <ul className="text-yellow-100 space-y-1 text-sm">
                <li>• Keep your Supabase credentials secure and never commit them to version control</li>
                <li>• The anon key is safe to use in client-side code</li>
                <li>• Make sure to enable Row Level Security (RLS) in your Supabase tables</li>
                <li>• Restart your development server after updating environment variables</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Continue Button */}
        {connectionStatus.connected && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <button
              onClick={onComplete}
              className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
            >
              Continue to Application
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}