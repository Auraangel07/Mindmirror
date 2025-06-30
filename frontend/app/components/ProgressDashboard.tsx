'use client';

import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  Brain, 
  Star, 
  TrendingUp,
  Award,
  Zap,
  Users,
  Clock,
  BarChart3,
  Calendar
} from 'lucide-react';

interface ProgressDashboardProps {
  onBack: () => void;
}

const skillCategories = [
  { name: 'Communication', level: 8, maxLevel: 10, xp: 2400, color: 'bg-blue-500' },
  { name: 'Technical Skills', level: 6, maxLevel: 10, xp: 1800, color: 'bg-green-500' },
  { name: 'Leadership', level: 5, maxLevel: 10, xp: 1250, color: 'bg-purple-500' },
  { name: 'Problem Solving', level: 7, maxLevel: 10, xp: 2100, color: 'bg-orange-500' },
  { name: 'Emotional Intelligence', level: 9, maxLevel: 10, xp: 2700, color: 'bg-pink-500' },
];

const achievements = [
  { id: 1, name: 'First Steps', description: 'Complete your first interview', icon: '🎯', unlocked: true },
  { id: 2, name: 'Confidence Builder', description: 'Score 80%+ in 5 interviews', icon: '💪', unlocked: true },
  { id: 3, name: 'Tech Master', description: 'Complete Techno Trench', icon: '💻', unlocked: true },
  { id: 4, name: 'Smooth Talker', description: 'Perfect communication score', icon: '🗣️', unlocked: false },
  { id: 5, name: 'Stress Warrior', description: 'Survive Black Mirror Mode', icon: '⚡', unlocked: false },
  { id: 6, name: 'Multiverse Explorer', description: 'Complete all portals', icon: '🌌', unlocked: false },
];

const recentSessions = [
  { date: '2024-01-15', portal: 'Corporate Core', score: 87, duration: '12 min', improvement: '+5%' },
  { date: '2024-01-14', portal: 'Creative Cosmos', score: 92, duration: '15 min', improvement: '+8%' },
  { date: '2024-01-13', portal: 'Techno Trench', score: 78, duration: '18 min', improvement: '+3%' },
  { date: '2024-01-12', portal: 'Corporate Core', score: 82, duration: '11 min', improvement: '+2%' },
];

export default function ProgressDashboard({ onBack }: ProgressDashboardProps) {
  const totalXP = skillCategories.reduce((sum, skill) => sum + skill.xp, 0);
  const averageLevel = skillCategories.reduce((sum, skill) => sum + skill.level, 0) / skillCategories.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen cosmic-bg relative overflow-hidden">
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
              Progress Hub
            </h1>
            <p className="text-xl text-gray-300 mt-2">
              Track your journey to interview mastery
            </p>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <Brain className="w-8 h-8 text-blue-400 mb-3" />
            <div className="text-2xl font-bold text-white">{totalXP.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total XP</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <Target className="w-8 h-8 text-green-400 mb-3" />
            <div className="text-2xl font-bold text-white">{averageLevel.toFixed(1)}</div>
            <div className="text-sm text-gray-400">Avg Level</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <Trophy className="w-8 h-8 text-yellow-400 mb-3" />
            <div className="text-2xl font-bold text-white">{unlockedAchievements}/{achievements.length}</div>
            <div className="text-sm text-gray-400">Achievements</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <TrendingUp className="w-8 h-8 text-purple-400 mb-3" />
            <div className="text-2xl font-bold text-white">87%</div>
            <div className="text-sm text-gray-400">Success Rate</div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Skill Progress */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                Skill Progression
              </h3>
              <div className="space-y-6">
                {skillCategories.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">{skill.xp} XP</span>
                        <span className="text-white font-bold">Lv.{skill.level}</span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className={`h-full ${skill.color} rounded-full`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6 text-green-400" />
                Recent Sessions
              </h3>
              <div className="space-y-4">
                {recentSessions.map((session, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-600"
                  >
                    <div>
                      <div className="text-white font-semibold">{session.portal}</div>
                      <div className="text-gray-400 text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {session.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">{session.score}%</div>
                      <div className="text-green-400 text-sm">{session.improvement}</div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {session.duration}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 sticky top-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Award className="w-6 h-6 text-yellow-400" />
                Achievements
              </h3>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      achievement.unlocked
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : 'border-gray-600 bg-gray-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <h4 className="text-white font-semibold">{achievement.name}</h4>
                        {achievement.unlocked && (
                          <div className="flex items-center gap-1 text-yellow-400 text-sm">
                            <Star className="w-3 h-3 fill-current" />
                            Unlocked
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">{achievement.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Next Goal */}
              <div className="mt-8 p-4 bg-blue-600/20 border border-blue-500 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400 font-semibold">Next Goal</span>
                </div>
                <p className="text-white text-sm">
                  Complete 3 more sessions to unlock &quot;Smooth Talker&quot; achievement
                </p>
                <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
                </div>
                <p className="text-gray-400 text-xs mt-1">3/5 sessions completed</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}