'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Square, Play, Pause } from 'lucide-react';

interface SpeechRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript: string) => void;
  isListening: boolean;
  disabled?: boolean;
}

export default function SpeechRecorder({ 
  onRecordingComplete, 
  isListening, 
  disabled = false 
}: SpeechRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      // Setup audio level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscript('');
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      updateAudioLevel();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleSubmitRecording = () => {
    if (recordedAudio && transcript) {
      onRecordingComplete(recordedAudio, transcript);
      setRecordedAudio(null);
      setTranscript('');
    }
  };

  const playRecording = () => {
    if (recordedAudio) {
      const audio = new Audio(URL.createObjectURL(recordedAudio));
      audio.play();
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
      <h4 className="text-lg font-semibold text-white mb-4">Voice Response</h4>
      
      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {!isRecording && !recordedAudio && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            disabled={disabled || !isListening}
            className="flex items-center gap-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </motion.button>
        )}

        {isRecording && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="flex items-center gap-3 bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Square className="w-5 h-5" />
            Stop Recording
          </motion.button>
        )}

        {recordedAudio && (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={playRecording}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Play className="w-4 h-4" />
              Play
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitRecording}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Submit Answer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setRecordedAudio(null);
                setTranscript('');
              }}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Re-record
            </motion.button>
          </div>
        )}
      </div>

      {/* Audio Level Indicator */}
      {isRecording && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MicOff className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-400">Recording...</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${audioLevel * 100}%` }}
              animate={{ width: `${audioLevel * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
          <h5 className="text-sm font-semibold text-gray-400 mb-2">Transcript:</h5>
          <p className="text-white text-sm">{transcript}</p>
        </div>
      )}

      {/* Status Messages */}
      {!isListening && !disabled && (
        <p className="text-gray-400 text-sm text-center">
          Wait for the interviewer to finish speaking before recording your answer
        </p>
      )}
      
      {disabled && (
        <p className="text-gray-400 text-sm text-center">
          Recording disabled during setup
        </p>
      )}
    </div>
  );
}