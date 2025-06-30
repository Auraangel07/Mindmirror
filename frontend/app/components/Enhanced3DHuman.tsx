'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface Enhanced3DHumanProps {
  isListening: boolean;
  isSpeaking: boolean;
  currentText?: string;
  onSpeechComplete?: () => void;
}

export default function Enhanced3DHuman({ 
  isListening, 
  isSpeaking, 
  currentText = '',
  onSpeechComplete 
}: Enhanced3DHumanProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [speechTimer, setSpeechTimer] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // Speech synthesis
  useEffect(() => {
    if (isSpeaking && currentText && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentText);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      // Find a professional voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.includes('en-US')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        if (onSpeechComplete) {
          onSpeechComplete();
        }
      };

      speechSynthesis.speak(utterance);

      return () => {
        speechSynthesis.cancel();
      };
    }
  }, [isSpeaking, currentText, onSpeechComplete]);

  // Animation loop
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Idle breathing animation
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    
    // Head slight movement
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }

    // Blinking animation
    setBlinkTimer(prev => prev + delta);
    if (blinkTimer > 3 + Math.random() * 2) {
      setIsBlinking(true);
      setBlinkTimer(0);
      setTimeout(() => setIsBlinking(false), 150);
    }

    if (eyeLeftRef.current && eyeRightRef.current) {
      const eyeScale = isBlinking ? 0.1 : 1;
      eyeLeftRef.current.scale.y = eyeScale;
      eyeRightRef.current.scale.y = eyeScale;
    }

    // Speaking animation
    if (isSpeaking) {
      setSpeechTimer(prev => prev + delta);
      if (mouthRef.current) {
        const mouthScale = 0.8 + Math.sin(speechTimer * 8) * 0.3;
        mouthRef.current.scale.y = mouthScale;
        mouthRef.current.scale.x = mouthScale;
      }
    } else {
      if (mouthRef.current) {
        mouthRef.current.scale.y = 0.6;
        mouthRef.current.scale.x = 1;
      }
    }

    // Listening animation - subtle glow
    if (isListening && groupRef.current) {
      const glowIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      groupRef.current.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissive.setRGB(0, glowIntensity * 0.2, glowIntensity * 0.4);
        }
      });
    } else if (groupRef.current) {
      groupRef.current.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissive.setRGB(0, 0, 0);
        }
      });
    }

    // Arm gestures during speaking
    if (leftArmRef.current && rightArmRef.current) {
      if (isSpeaking) {
        leftArmRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.3;
        rightArmRef.current.rotation.z = -Math.sin(state.clock.elapsedTime * 2.5) * 0.2;
      } else {
        leftArmRef.current.rotation.z = 0.2;
        rightArmRef.current.rotation.z = -0.2;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Head */}
      <Sphere ref={headRef} args={[0.8, 32, 32]} position={[0, 2, 0]}>
        <meshStandardMaterial 
          color={isSpeaking ? "#4f46e5" : "#6366f1"} 
          roughness={0.3}
          metalness={0.1}
        />
      </Sphere>
      
      {/* Eyes */}
      <Sphere ref={eyeLeftRef} args={[0.12, 16, 16]} position={[-0.25, 2.15, 0.7]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere ref={eyeRightRef} args={[0.12, 16, 16]} position={[0.25, 2.15, 0.7]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      
      {/* Eye pupils */}
      <Sphere args={[0.06, 16, 16]} position={[-0.25, 2.15, 0.75]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      <Sphere args={[0.06, 16, 16]} position={[0.25, 2.15, 0.75]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      
      {/* Eyebrows */}
      <Box args={[0.2, 0.05, 0.1]} position={[-0.25, 2.3, 0.7]}>
        <meshStandardMaterial color="#2d1810" />
      </Box>
      <Box args={[0.2, 0.05, 0.1]} position={[0.25, 2.3, 0.7]}>
        <meshStandardMaterial color="#2d1810" />
      </Box>
      
      {/* Nose */}
      <Box args={[0.08, 0.15, 0.1]} position={[0, 2, 0.75]}>
        <meshStandardMaterial color="#e8b4a0" />
      </Box>
      
      {/* Mouth */}
      <Box 
        ref={mouthRef} 
        args={[0.25, 0.08, 0.05]} 
        position={[0, 1.8, 0.75]}
      >
        <meshStandardMaterial color="#8b4513" />
      </Box>
      
      {/* Neck */}
      <Cylinder args={[0.3, 0.35, 0.4, 16]} position={[0, 1.3, 0]}>
        <meshStandardMaterial color="#e8b4a0" />
      </Cylinder>
      
      {/* Torso */}
      <Box args={[1.2, 1.8, 0.6]} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#2563eb" />
      </Box>
      
      {/* Arms */}
      <group ref={leftArmRef} position={[-0.8, 0.8, 0]}>
        <Cylinder args={[0.15, 0.12, 1.2, 16]} position={[0, -0.6, 0]}>
          <meshStandardMaterial color="#e8b4a0" />
        </Cylinder>
        <Sphere args={[0.18, 16, 16]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#2563eb" />
        </Sphere>
      </group>
      
      <group ref={rightArmRef} position={[0.8, 0.8, 0]}>
        <Cylinder args={[0.15, 0.12, 1.2, 16]} position={[0, -0.6, 0]}>
          <meshStandardMaterial color="#e8b4a0" />
        </Cylinder>
        <Sphere args={[0.18, 16, 16]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#2563eb" />
        </Sphere>
      </group>
      
      {/* Legs */}
      <Cylinder args={[0.18, 0.15, 1.5, 16]} position={[-0.3, -1.5, 0]}>
        <meshStandardMaterial color="#1e293b" />
      </Cylinder>
      <Cylinder args={[0.18, 0.15, 1.5, 16]} position={[0.3, -1.5, 0]}>
        <meshStandardMaterial color="#1e293b" />
      </Cylinder>
      
      {/* Feet */}
      <Box args={[0.4, 0.15, 0.6]} position={[-0.3, -2.4, 0.2]}>
        <meshStandardMaterial color="#000000" />
      </Box>
      <Box args={[0.4, 0.15, 0.6]} position={[0.3, -2.4, 0.2]}>
        <meshStandardMaterial color="#000000" />
      </Box>
      
      {/* Hair */}
      <Sphere args={[0.85, 16, 16]} position={[0, 2.4, -0.2]}>
        <meshStandardMaterial color="#2d1810" />
      </Sphere>
      
      {/* Listening indicator */}
      {isListening && (
        <Sphere args={[1.5, 32, 32]} position={[0, 1, 0]}>
          <meshStandardMaterial 
            color="#10b981" 
            transparent 
            opacity={0.2}
            wireframe
          />
        </Sphere>
      )}
    </group>
  );
}