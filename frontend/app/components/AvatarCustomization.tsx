'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Shirt, 
  Palette, 
  Volume2, 
  Eye,
  Smile,
  Briefcase,
  Save,
  RotateCcw
} from 'lucide-react';

interface AvatarCustomizationProps {
  onBack: () => void;
}

const outfitOptions = [
  { id: 'corporate', name: 'Corporate Suit', icon: '👔', description: 'Professional business attire' },
  { id: 'business-casual', name: 'Business Casual', icon: '👕', description: 'Smart casual look' },
  { id: 'creative', name: 'Creative Style', icon: '🎨', description: 'Artistic and expressive' },
  { id: 'tech', name: 'Tech Casual', icon: '💻', description: 'Modern tech industry style' },
];

const personalityTraits = [
  { id: 'confident', name: 'Confident', color: 'bg-blue-500', description: 'Assertive and self-assured' },
  { id: 'friendly', name: 'Friendly', color: 'bg-green-500', description: 'Warm and approachable' },
  { id: 'analytical', name: 'Analytical', color: 'bg-purple-500', description: 'Logical and detail-oriented' },
  { id: 'creative', name: 'Creative', color: 'bg-pink-500', description: 'Innovative and imaginative' },
  { id: 'diplomatic', name: 'Diplomatic', color: 'bg-yellow-500', description: 'Tactful and balanced' },
];

const voiceTones = [
  { id: 'professional', name: 'Professional', description: 'Clear and authoritative' },
  { id: 'conversational', name: 'Conversational', description: 'Natural and engaging' },
  { id: 'enthusiastic', name: 'Enthusiastic', description: 'Energetic and passionate' },
  { id: 'calm', name: 'Calm', description: 'Steady and composed' },
];

export default function AvatarCustomization({ onBack }: AvatarCustomizationProps) {
  const [selectedOutfit, setSelectedOutfit] = useState('corporate');
  const [selectedPersonality, setSelectedPersonality] = useState(['confident']);
  const [selectedVoice, setSelectedVoice] = useState('professional');
  const [avatarName, setAvatarName] = useState('Professional Me');

  const handlePersonalityToggle = (traitId: string) => {
    setSelectedPersonality(prev => 
      prev.includes(traitId) 
        ? prev.filter(id => id !== traitId)
        : [...prev, traitId].slice(0, 3) // Max 3 traits
    );
  };

  const handleSave = () => {
    // Save avatar configuration
    console.log('Saving avatar:', {
      name: avatarName,
      outfit: selectedOutfit,
      personality: selectedPersonality,
      voice: selectedVoice
    });
  };

  const handleReset = () => {
    setSelectedOutfit('corporate');
    setSelectedPersonality(['confident']);
    setSelectedVoice('professional');
    setAvatarName('Professional Me');
  };

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
              Avatar Studio
            </h1>
            <p className="text-xl text-gray-300 mt-2">
              Craft your professional persona
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Avatar Preview */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 sticky top-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-blue-400" />
                Preview
              </h3>
              
              {/* Avatar Display */}
              <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-700/20 rounded-xl p-8 mb-6 text-center">
                <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-6xl">
                  {outfitOptions.find(o => o.id === selectedOutfit)?.icon || '👤'}
                </div>
                <h4 className="text-xl font-bold text-white mb-2">{avatarName}</h4>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {selectedPersonality.map(trait => {
                    const traitData = personalityTraits.find(p => p.id === trait);
                    return (
                      <span key={trait} className={`px-3 py-1 ${traitData?.color} rounded-full text-white text-sm`}>
                        {traitData?.name}
                      </span>
                    );
                  })}
                </div>
                <p className="text-gray-300 text-sm">
                  Voice: {voiceTones.find(v => v.id === selectedVoice)?.name}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Save Avatar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-3 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Customization Options */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Avatar Name */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Smile className="w-6 h-6 text-purple-400" />
                Avatar Identity
              </h3>
              <input
                type="text"
                value={avatarName}
                onChange={(e) => setAvatarName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Enter avatar name..."
              />
            </div>

            {/* Outfit Selection */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Shirt className="w-6 h-6 text-green-400" />
                Professional Attire
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {outfitOptions.map((outfit) => (
                  <motion.button
                    key={outfit.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedOutfit(outfit.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedOutfit === outfit.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{outfit.icon}</div>
                    <h4 className="font-semibold text-white mb-1">{outfit.name}</h4>
                    <p className="text-sm text-gray-400">{outfit.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Personality Traits */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Palette className="w-6 h-6 text-pink-400" />
                Personality Traits
                <span className="text-sm text-gray-400 font-normal">(Select up to 3)</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {personalityTraits.map((trait) => (
                  <motion.button
                    key={trait.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePersonalityToggle(trait.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPersonality.includes(trait.id)
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <div className={`w-4 h-4 ${trait.color} rounded-full mb-2`}></div>
                    <h4 className="font-semibold text-white mb-1">{trait.name}</h4>
                    <p className="text-sm text-gray-400">{trait.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Voice Tone */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Volume2 className="w-6 h-6 text-yellow-400" />
                Voice Tone
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {voiceTones.map((voice) => (
                  <motion.button
                    key={voice.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedVoice === voice.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <h4 className="font-semibold text-white mb-1">{voice.name}</h4>
                    <p className="text-sm text-gray-400">{voice.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}