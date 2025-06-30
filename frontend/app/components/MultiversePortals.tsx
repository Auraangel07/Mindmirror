'use client';

import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Code, 
  Database, 
  BarChart3, 
  Briefcase,
  Palette,
  Settings,
  Lock,
  Star,
  Zap,
  Users,
  Brain
} from 'lucide-react';
import TavusVideoInterview from './TavusVideoInterview';
import { useState } from 'react';

interface Role {
  id: string;
  name: string;
  description: string;
  icon: any;
  difficulty: number;
  unlocked: boolean;
  color: string;
  bgGradient: string;
  skills: string[];
  avgSalary: string;
  xpReward: number;
}

const roles: Role[] = [
  {
    id: 'frontend-developer',
    name: 'Frontend Developer',
    description: 'Master React, JavaScript, and modern UI/UX development practices',
    icon: Code,
    difficulty: 3,
    unlocked: true,
    color: 'text-blue-400',
    bgGradient: 'from-blue-600/20 to-cyan-700/20',
    skills: ['React', 'JavaScript', 'CSS', 'TypeScript'],
    avgSalary: '$75k - $120k',
    xpReward: 300
  },
  {
    id: 'backend-developer',
    name: 'Backend Developer',
    description: 'Deep dive into APIs, databases, and server-side architecture',
    icon: Database,
    difficulty: 4,
    unlocked: true,
    color: 'text-green-400',
    bgGradient: 'from-green-600/20 to-teal-700/20',
    skills: ['Node.js', 'Python', 'SQL', 'System Design'],
    avgSalary: '$80k - $130k',
    xpReward: 400
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Excel at data interpretation, statistics, and business insights',
    icon: BarChart3,
    difficulty: 3,
    unlocked: true,
    color: 'text-purple-400',
    bgGradient: 'from-purple-600/20 to-indigo-700/20',
    skills: ['SQL', 'Python', 'Excel', 'Tableau'],
    avgSalary: '$65k - $95k',
    xpReward: 350
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    description: 'Navigate strategy, stakeholder management, and product roadmaps',
    icon: Briefcase,
    difficulty: 4,
    unlocked: true,
    color: 'text-orange-400',
    bgGradient: 'from-orange-600/20 to-red-700/20',
    skills: ['Strategy', 'Analytics', 'Leadership', 'Communication'],
    avgSalary: '$90k - $150k',
    xpReward: 450
  },
  {
    id: 'ux-designer',
    name: 'UX Designer',
    description: 'Master user research, design thinking, and prototyping',
    icon: Palette,
    difficulty: 3,
    unlocked: true,
    color: 'text-pink-400',
    bgGradient: 'from-pink-600/20 to-purple-700/20',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    avgSalary: '$70k - $110k',
    xpReward: 325
  },
  {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    description: 'Tackle CI/CD, cloud infrastructure, and system reliability',
    icon: Settings,
    difficulty: 5,
    unlocked: true,
    color: 'text-gray-400',
    bgGradient: 'from-gray-600/20 to-slate-700/20',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    avgSalary: '$85k - $140k',
    xpReward: 500
  }
];

interface MultiversePortalsProps {
  onBack: () => void;
}

export default function MultiversePortals({ onBack }: MultiversePortalsProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleEnter = (role: Role) => {
    if (!role.unlocked) return;
    setSelectedRole(role.id);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
  };

  if (selectedRole) {
    return (
      <TavusVideoInterview 
        roleId={selectedRole} 
        onBack={handleBackToRoles}
      />
    );
  }

  return (
    <div className="min-h-screen cosmic-bg relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
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
            <h1 className="text-4xl md:text-6xl font-bold font-orbitron glow-text">
              AI Interview Studio
            </h1>
            <p className="text-xl text-gray-300 mt-2">
              Practice with AI-powered video interviews in realistic scenarios
            </p>
          </div>
        </motion.div>

        {/* Roles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative group cursor-pointer ${
                role.unlocked ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed'
              } transition-all duration-300`}
              onClick={() => handleRoleEnter(role)}
            >
              <div className={`
                relative bg-gradient-to-br ${role.bgGradient} 
                backdrop-blur-sm rounded-2xl p-8 border border-gray-700 
                ${role.unlocked ? 'hover:border-blue-500 portal-glow' : 'border-gray-800'}
                overflow-hidden
              `}>
                {/* Unlock Overlay */}
                {!role.unlocked && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <div className="text-center">
                      <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 font-semibold">Coming Soon</p>
                    </div>
                  </div>
                )}

                {/* Role Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <role.icon className={`w-12 h-12 ${role.color}`} />
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < role.difficulty ? role.color : 'text-gray-600'
                          }`}
                          fill={i < role.difficulty ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">{role.name}</h3>
                  <p className="text-gray-300 mb-6">{role.description}</p>

                  {/* Skills */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">KEY SKILLS</h4>
                    <div className="flex flex-wrap gap-2">
                      {role.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-800/50 rounded-full text-xs text-gray-300 border border-gray-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Salary & XP */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Avg Salary</div>
                      <div className="text-white font-semibold">{role.avgSalary}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-semibold">+{role.xpReward} XP</span>
                      </div>
                    </div>
                  </div>

                  {role.unlocked && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-center text-sm font-semibold transition-colors"
                    >
                      Start AI Video Interview
                    </motion.div>
                  )}
                </div>

                {/* Animated Background Elements */}
                {role.unlocked && (
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      background: [
                        'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 max-w-2xl mx-auto">
            <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Realistic AI Video Interview Experience</h3>
            <p className="text-gray-300">
              Each role features an AI-powered video interviewer with realistic conversations, 
              industry-specific questions, and real-time interaction powered by Tavus AI technology.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}