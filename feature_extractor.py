"""
Feature Extraction Module

Extracts high-level features from audio using:
- Mel spectrogram features
- Prosodic features (pitch, energy, speaking rate)
- Basic spectral features
"""

import torch
import torch.nn.functional as F
import numpy as np
from typing import Dict, Tuple, Optional
import logging
import librosa

logger = logging.getLogger(__name__)


class FeatureExtractor:
    """
    Feature extraction class combining multiple audio analysis techniques
    """
    
    def __init__(self, device: str = "cpu"):
        """
        Initialize feature extractors
        
        Args:
            device: Device to run models on
        """
        self.device = device
        logger.info(f"Initialized feature extractor on device: {device}")
    
    def extract_mel_spectrogram_features(self, audio: np.ndarray, sample_rate: int = 16000) -> np.ndarray:
        """
        Extract mel spectrogram features
        
        Args:
            audio: Audio array
            sample_rate: Sample rate
            
        Returns:
            Mel spectrogram features
        """
        try:
            # Extract mel spectrogram
            mel_spec = librosa.feature.melspectrogram(
                y=audio, sr=sample_rate, n_mels=128, n_fft=2048, hop_length=512
            )
            
            # Convert to log scale
            mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
            
            # Global statistics
            features = []
            features.extend([np.mean(mel_spec_db), np.std(mel_spec_db)])
            features.extend([np.percentile(mel_spec_db, p) for p in [25, 50, 75]])
            features.extend([np.max(mel_spec_db), np.min(mel_spec_db)])
            
            return np.array(features)
            
        except Exception as e:
            logger.error(f"Error extracting mel spectrogram features: {e}")
            return np.zeros(7)  # Return zeros if failed
    
    def extract_prosodic_features(self, audio: np.ndarray, sample_rate: int = 16000) -> np.ndarray:
        """
        Extract prosodic features (pitch, energy, speaking rate)
        
        Args:
            audio: Audio array
            sample_rate: Sample rate
            
        Returns:
            Prosodic features
        """
        try:
            features = []
            
            # Pitch features
            pitches, magnitudes = librosa.piptrack(y=audio, sr=sample_rate)
            pitch_values = pitches[magnitudes > 0.1]
            
            if len(pitch_values) > 0:
                features.extend([
                    np.mean(pitch_values),
                    np.std(pitch_values),
                    np.percentile(pitch_values, 25),
                    np.percentile(pitch_values, 75)
                ])
            else:
                features.extend([0, 0, 0, 0])
            
            # Energy features
            rms_energy = librosa.feature.rms(y=audio)[0]
            features.extend([
                np.mean(rms_energy),
                np.std(rms_energy),
                np.max(rms_energy),
                np.min(rms_energy)
            ])
            
            # Speaking rate approximation (using zero crossing rate)
            zcr = librosa.feature.zero_crossing_rate(audio)[0]
            features.extend([
                np.mean(zcr),
                np.std(zcr)
            ])
            
            # Spectral features
            spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=sample_rate)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sample_rate)[0]
            
            features.extend([
                np.mean(spectral_centroid),
                np.std(spectral_centroid),
                np.mean(spectral_rolloff),
                np.std(spectral_rolloff)
            ])
            
            return np.array(features)
            
        except Exception as e:
            logger.error(f"Error extracting prosodic features: {e}")
            return np.zeros(16)  # Return zeros if failed
    
    def extract_mfcc_features(self, audio: np.ndarray, sample_rate: int = 16000) -> np.ndarray:
        """
        Extract MFCC features
        
        Args:
            audio: Audio array
            sample_rate: Sample rate
            
        Returns:
            MFCC features
        """
        try:
            # Extract MFCC
            mfcc = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=13)
            
            # Global statistics
            features = []
            features.extend([np.mean(mfcc), np.std(mfcc)])
            features.extend([np.percentile(mfcc, p) for p in [25, 50, 75]])
            features.extend([np.max(mfcc), np.min(mfcc)])
            
            return np.array(features)
            
        except Exception as e:
            logger.error(f"Error extracting MFCC features: {e}")
            return np.zeros(7)  # Return zeros if failed
    
    def extract_all_features(self, audio: torch.Tensor, sample_rate: int = 16000) -> Dict[str, torch.Tensor]:
        """
        Extract all available features
        
        Args:
            audio: Audio tensor
            sample_rate: Sample rate
            
        Returns:
            Dictionary of all extracted features
        """
        features = {}
        
        # Convert to numpy for feature extraction
        audio_np = audio.squeeze().numpy()
        
        # Extract mel spectrogram features
        mel_features = self.extract_mel_spectrogram_features(audio_np, sample_rate)
        features['mel_spectrogram'] = torch.FloatTensor(mel_features).unsqueeze(0)
        
        # Extract prosodic features
        prosodic_features = self.extract_prosodic_features(audio_np, sample_rate)
        features['prosodic'] = torch.FloatTensor(prosodic_features).unsqueeze(0)
        
        # Extract MFCC features
        mfcc_features = self.extract_mfcc_features(audio_np, sample_rate)
        features['mfcc'] = torch.FloatTensor(mfcc_features).unsqueeze(0)
        
        logger.info(f"Extracted features: {list(features.keys())}")
        return features
    
    def combine_features(self, features: Dict[str, torch.Tensor]) -> torch.Tensor:
        """
        Combine all features into a single tensor
        
        Args:
            features: Dictionary of feature tensors
            
        Returns:
            Combined feature tensor
        """
        feature_vectors = []
        
        for feature_name, feature_tensor in features.items():
            if feature_tensor is not None:
                feature_vectors.append(feature_tensor.squeeze())
        
        if not feature_vectors:
            raise ValueError("No features available for combination")
        
        # Concatenate all features
        combined = torch.cat(feature_vectors, dim=0)
        
        return combined.unsqueeze(0)  # Add batch dimension


def create_feature_extractor(device: str = "cpu") -> FeatureExtractor:
    """Factory function to create feature extractor"""
    return FeatureExtractor(device) 