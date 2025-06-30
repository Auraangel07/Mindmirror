"""
Audio Processing Module

Handles audio loading, preprocessing, and feature extraction:
- Audio loading and resampling
- Voice activity detection
- Audio segmentation
- Preprocessing for ML models
"""

import torch
import torchaudio
import numpy as np
from typing import Tuple, Optional, List, Dict
import librosa
from pathlib import Path
import logging
import soundfile as sf
from scipy import signal
from scipy.stats import skew, kurtosis
import warnings
warnings.filterwarnings('ignore')

from src.config.settings import (
    SAMPLE_RATE, CHUNK_DURATION, VAD_THRESHOLD, 
    SUPPORTED_AUDIO_FORMATS
)

logger = logging.getLogger(__name__)


class AudioProcessor:
    """
    Audio processing class for speech analysis
    """
    
    def __init__(self):
        """Initialize audio processor"""
        self.sample_rate = SAMPLE_RATE
        self.chunk_duration = CHUNK_DURATION
        self.chunk_size = int(self.sample_rate * self.chunk_duration)
    
    def load_audio(self, audio_path: str) -> Tuple[np.ndarray, int]:
        """
        Load audio file and resample to target sample rate
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Tuple of (audio_array, sample_rate)
        """
        try:
            # Check file format
            audio_path_obj = Path(audio_path)
            if audio_path_obj.suffix.lower() not in SUPPORTED_AUDIO_FORMATS:
                raise ValueError(f"Unsupported audio format: {audio_path_obj.suffix}")
            
            # Load audio using librosa for better format support
            audio, sr = librosa.load(str(audio_path), sr=self.sample_rate)
            
            # Convert to mono if stereo
            if len(audio.shape) > 1:
                audio = np.mean(audio, axis=1)
            
            logger.info(f"Loaded audio: {audio_path_obj.name}, duration: {len(audio)/sr:.2f}s")
            return audio, int(sr)
            
        except Exception as e:
            logger.error(f"Error loading audio {audio_path}: {e}")
            raise
    
    def detect_voice_activity_simple(self, audio: np.ndarray) -> List[bool]:
        """
        Simple voice activity detection using energy threshold
        
        Args:
            audio: Audio array at target sample rate
            
        Returns:
            List of boolean values indicating voice activity for each chunk
        """
        # Calculate energy for each chunk
        voice_activity = []
        for i in range(0, len(audio) - self.chunk_size + 1, self.chunk_size):
            chunk = audio[i:i + self.chunk_size]
            energy = np.mean(chunk ** 2)
            
            # Simple threshold-based VAD
            is_speech = energy > VAD_THRESHOLD
            voice_activity.append(is_speech)
        
        return voice_activity
    
    def segment_speech_simple(self, audio: np.ndarray, min_silence_len: int = 500) -> List[np.ndarray]:
        """
        Simple speech segmentation using energy-based silence detection
        
        Args:
            audio: Audio array
            min_silence_len: Minimum silence length in ms
            
        Returns:
            List of audio segments
        """
        # Use simple VAD
        voice_activity = self.detect_voice_activity_simple(audio)
        
        # Find speech segments
        speech_segments = []
        start_idx = None
        
        for i, is_speech in enumerate(voice_activity):
            if is_speech and start_idx is None:
                start_idx = i * self.chunk_size
            elif not is_speech and start_idx is not None:
                end_idx = i * self.chunk_size
                segment = audio[start_idx:end_idx]
                
                # Only keep segments longer than 1 second
                if len(segment) > self.sample_rate:
                    speech_segments.append(segment)
                
                start_idx = None
        
        # Handle case where speech continues to end
        if start_idx is not None:
            segment = audio[start_idx:]
            if len(segment) > self.sample_rate:
                speech_segments.append(segment)
        
        logger.info(f"Segmented audio into {len(speech_segments)} speech segments")
        return speech_segments
    
    def extract_audio_features(self, audio: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Extract basic audio features for analysis
        
        Args:
            audio: Audio array
            
        Returns:
            Dictionary of audio features
        """
        features = {}
        
        # Spectral features
        stft = librosa.stft(audio, n_fft=2048, hop_length=512)
        magnitude = np.abs(stft)
        
        # Mel spectrogram
        mel_spec = librosa.feature.melspectrogram(
            y=audio, sr=self.sample_rate, n_mels=128
        )
        features['mel_spectrogram'] = librosa.power_to_db(mel_spec, ref=np.max)
        
        # MFCC
        features['mfcc'] = librosa.feature.mfcc(
            y=audio, sr=self.sample_rate, n_mfcc=13
        )
        
        # Spectral centroid
        features['spectral_centroid'] = librosa.feature.spectral_centroid(
            y=audio, sr=self.sample_rate
        )[0]
        
        # Spectral rolloff
        features['spectral_rolloff'] = librosa.feature.spectral_rolloff(
            y=audio, sr=self.sample_rate
        )[0]
        
        # Zero crossing rate
        features['zero_crossing_rate'] = librosa.feature.zero_crossing_rate(audio)[0]
        
        # Root mean square energy
        features['rms_energy'] = librosa.feature.rms(y=audio)[0]
        
        # Pitch (fundamental frequency)
        pitches, magnitudes = librosa.piptrack(y=audio, sr=self.sample_rate)
        features['pitch'] = np.mean(pitches, axis=0)
        
        return features
    
    def detect_filler_words(self, audio: np.ndarray) -> Dict[str, float]:
        """
        Detect potential filler words and hesitations
        
        Args:
            audio: Audio array
            
        Returns:
            Dictionary with filler word indicators
        """
        # Voice activity detection
        voice_activity = self.detect_voice_activity_simple(audio)
        
        # Calculate speech statistics
        total_chunks = len(voice_activity)
        speech_chunks = sum(voice_activity)
        speech_ratio = speech_chunks / total_chunks if total_chunks > 0 else 0
        
        # Detect pauses (gaps in speech)
        pause_lengths = []
        current_pause = 0
        
        for is_speech in voice_activity:
            if not is_speech:
                current_pause += 1
            else:
                if current_pause > 0:
                    pause_lengths.append(current_pause)
                    current_pause = 0
        
        # Calculate pause statistics
        avg_pause_length = float(np.mean(pause_lengths)) if pause_lengths else 0.0
        pause_frequency = float(len(pause_lengths) / (len(audio) / self.sample_rate))  # pauses per second
        
        # Detect speech rate variations
        speech_segments = self.segment_speech_simple(audio)
        segment_lengths = [len(seg) / self.sample_rate for seg in speech_segments]
        
        # Calculate speech rate consistency
        speech_rate_std = float(np.std(segment_lengths)) if segment_lengths else 0.0
        speech_rate_mean = float(np.mean(segment_lengths)) if segment_lengths else 0.0
        
        return {
            'speech_ratio': speech_ratio,
            'pause_frequency': pause_frequency,
            'avg_pause_length': avg_pause_length,
            'speech_rate_std': speech_rate_std,
            'speech_rate_mean': speech_rate_mean,
            'num_segments': len(speech_segments)
        }
    
    def preprocess_for_model(self, audio: np.ndarray) -> torch.Tensor:
        """
        Preprocess audio for model input
        
        Args:
            audio: Audio array
            
        Returns:
            Preprocessed tensor
        """
        # Ensure correct length (pad or truncate to 10 seconds)
        target_length = 10 * self.sample_rate
        
        if len(audio) > target_length:
            audio = audio[:target_length]
        else:
            # Pad with zeros
            padding = target_length - len(audio)
            audio = np.pad(audio, (0, padding), 'constant')
        
        # Convert to tensor
        audio_tensor = torch.FloatTensor(audio)
        
        # Normalize
        audio_tensor = audio_tensor / torch.max(torch.abs(audio_tensor))
        
        return audio_tensor.unsqueeze(0)  # Add batch dimension
    
    def detect_voice_activity(self, audio: np.ndarray) -> List[bool]:
        """
        Detect voice activity (alias for simple VAD)
        
        Args:
            audio: Audio array at target sample rate
            
        Returns:
            List of boolean values indicating voice activity for each chunk
        """
        return self.detect_voice_activity_simple(audio)
    
    def segment_speech(self, audio: np.ndarray, min_silence_len: int = 500) -> List[np.ndarray]:
        """
        Segment audio into speech segments (alias for simple segmentation)
        
        Args:
            audio: Audio array
            min_silence_len: Minimum silence length in ms
            
        Returns:
            List of audio segments
        """
        return self.segment_speech_simple(audio, min_silence_len)


def create_audio_processor() -> AudioProcessor:
    """Factory function to create audio processor"""
    return AudioProcessor() 