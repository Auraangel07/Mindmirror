"""
Machine Learning Model Module

PyTorch-based speech analysis model with:
- Multi-modal feature fusion
- LSTM with attention for temporal modeling
- Multi-head classification for different speech characteristics
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging
from pathlib import Path
import json
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score
import matplotlib.pyplot as plt
import seaborn as sns

from src.config.settings import (
    DEVICE,
    MODEL_CONFIG
)

logger = logging.getLogger(__name__)


class MultiHeadAttention(nn.Module):
    """
    Multi-head attention mechanism for temporal modeling
    """
    
    def __init__(self, hidden_size: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_heads = num_heads
        self.head_size = hidden_size // num_heads
        
        assert hidden_size % num_heads == 0, "Hidden size must be divisible by number of heads"
        
        self.query = nn.Linear(hidden_size, hidden_size)
        self.key = nn.Linear(hidden_size, hidden_size)
        self.value = nn.Linear(hidden_size, hidden_size)
        self.output = nn.Linear(hidden_size, hidden_size)
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        batch_size, seq_len, hidden_size = x.shape
        
        # Linear transformations
        Q = self.query(x).view(batch_size, seq_len, self.num_heads, self.head_size).transpose(1, 2)
        K = self.key(x).view(batch_size, seq_len, self.num_heads, self.head_size).transpose(1, 2)
        V = self.value(x).view(batch_size, seq_len, self.num_heads, self.head_size).transpose(1, 2)
        
        # Attention scores
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.head_size ** 0.5)
        
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)
        
        # Apply attention
        context = torch.matmul(attention_weights, V)
        context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, hidden_size)
        
        output = self.output(context)
        return output


class FeatureFusionLayer(nn.Module):
    """
    Layer to fuse different types of audio features
    """
    
    def __init__(self, feature_dims: Dict[str, int], output_dim: int):
        super().__init__()
        self.feature_dims = feature_dims
        self.output_dim = output_dim
        
        # Create projection layers for each feature type
        self.projections = nn.ModuleDict()
        for feature_name, dim in feature_dims.items():
            self.projections[feature_name] = nn.Linear(dim, output_dim)
        
        # Attention weights for feature fusion
        self.attention_weights = nn.Parameter(torch.ones(len(feature_dims)))
        
    def forward(self, features: Dict[str, torch.Tensor]) -> torch.Tensor:
        # Project each feature to common dimension
        projected_features = []
        attention_weights = F.softmax(self.attention_weights, dim=0)
        
        for i, (feature_name, feature_tensor) in enumerate(features.items()):
            if feature_name in self.projections:
                projected = self.projections[feature_name](feature_tensor)
                weighted = projected * attention_weights[i]
                projected_features.append(weighted)
        
        # Combine features
        if projected_features:
            combined = torch.stack(projected_features, dim=0).sum(dim=0)
        else:
            # Fallback if no features available
            combined = torch.zeros(feature_tensor.shape[0], self.output_dim, device=feature_tensor.device)
        
        return combined


class SpeechAnalysisModel(nn.Module):
    """
    Main model for speech analysis
    """
    
    def __init__(
        self,
        input_dim: int,
        hidden_size: int = MODEL_CONFIG['hidden_size'],
        num_layers: int = MODEL_CONFIG['num_layers'],
        dropout_rate: float = MODEL_CONFIG['dropout_rate'],
        num_attention_heads: int = MODEL_CONFIG['num_attention_heads'],
        num_characteristics: int = len(MODEL_CONFIG['speech_characteristics'])
    ):
        super().__init__()
        
        self.input_dim = input_dim
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.num_characteristics = num_characteristics
        
        # Input projection
        self.input_projection = nn.Linear(input_dim, hidden_size)
        
        # LSTM layers for temporal modeling
        self.lstm = nn.LSTM(
            input_size=hidden_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout_rate if num_layers > 1 else 0,
            batch_first=True,
            bidirectional=True
        )
        
        # Multi-head attention
        self.attention = MultiHeadAttention(
            hidden_size * 2,  # *2 for bidirectional LSTM
            num_attention_heads,
            dropout_rate
        )
        
        # Layer normalization
        self.layer_norm1 = nn.LayerNorm(hidden_size * 2)
        self.layer_norm2 = nn.LayerNorm(hidden_size * 2)
        
        # Feed-forward network
        self.ffn = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size * 4),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_size * 4, hidden_size * 2),
            nn.Dropout(dropout_rate)
        )
        
        # Global average pooling
        self.global_pool = nn.AdaptiveAvgPool1d(1)
        
        # Output heads for different speech characteristics
        self.output_heads = nn.ModuleDict({
            'nervousness': nn.Sequential(
                nn.Linear(hidden_size * 2, hidden_size),
                nn.ReLU(),
                nn.Dropout(dropout_rate),
                nn.Linear(hidden_size, 1),
                nn.Sigmoid()
            ),
            'confidence': nn.Sequential(
                nn.Linear(hidden_size * 2, hidden_size),
                nn.ReLU(),
                nn.Dropout(dropout_rate),
                nn.Linear(hidden_size, 1),
                nn.Sigmoid()
            ),
            'fluency': nn.Sequential(
                nn.Linear(hidden_size * 2, hidden_size),
                nn.ReLU(),
                nn.Dropout(dropout_rate),
                nn.Linear(hidden_size, 1),
                nn.Sigmoid()
            ),
            'pace': nn.Sequential(
                nn.Linear(hidden_size * 2, hidden_size),
                nn.ReLU(),
                nn.Dropout(dropout_rate),
                nn.Linear(hidden_size, 1),
                nn.Sigmoid()
            ),
            'tone': nn.Sequential(
                nn.Linear(hidden_size * 2, hidden_size),
                nn.ReLU(),
                nn.Dropout(dropout_rate),
                nn.Linear(hidden_size, 1),
                nn.Sigmoid()
            )
        })
        
        # Initialize weights
        self._init_weights()
    
    def _init_weights(self):
        """Initialize model weights"""
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                if module.bias is not None:
                    nn.init.zeros_(module.bias)
            elif isinstance(module, nn.LSTM):
                for name, param in module.named_parameters():
                    if 'weight' in name:
                        nn.init.xavier_uniform_(param)
                    elif 'bias' in name:
                        nn.init.zeros_(param)
    
    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Forward pass
        
        Args:
            x: Input tensor (batch_size, input_dim) or (batch_size, seq_len, input_dim)
            
        Returns:
            Dictionary of predictions for each speech characteristic
        """
        # Handle both 2D and 3D inputs
        if len(x.shape) == 2:
            # Add sequence dimension: (batch_size, input_dim) -> (batch_size, 1, input_dim)
            x = x.unsqueeze(1)
        
        batch_size, seq_len, _ = x.shape
        
        # Input projection
        x = self.input_projection(x)  # (batch_size, seq_len, hidden_size)
        
        # LSTM processing
        lstm_out, _ = self.lstm(x)  # (batch_size, seq_len, hidden_size * 2)
        
        # Self-attention
        attended = self.attention(lstm_out)
        attended = self.layer_norm1(lstm_out + attended)  # Residual connection
        
        # Feed-forward network
        ffn_out = self.ffn(attended)
        ffn_out = self.layer_norm2(attended + ffn_out)  # Residual connection
        
        # Global pooling
        pooled = self.global_pool(ffn_out.transpose(1, 2)).squeeze(-1)  # (batch_size, hidden_size * 2)
        
        # Output predictions
        predictions = {}
        for characteristic, head in self.output_heads.items():
            predictions[characteristic] = head(pooled).squeeze(-1)
        
        return predictions
    
    def predict(self, x: torch.Tensor) -> Dict[str, float]:
        """
        Make predictions and return as dictionary of floats
        
        Args:
            x: Input tensor
            
        Returns:
            Dictionary of predictions as floats
        """
        self.eval()
        with torch.no_grad():
            predictions = self.forward(x)
            return {k: v.item() for k, v in predictions.items()}


class SpeechAnalysisModelWrapper:
    """
    Wrapper class for the speech analysis model with additional functionality
    """
    
    def __init__(self, model: SpeechAnalysisModel, device: str = DEVICE):
        self.model = model
        self.device = device
        self.model.to(device)
    
    def load_weights(self, weights_path: str):
        """Load model weights"""
        try:
            checkpoint = torch.load(weights_path, map_location=self.device)
            if 'model_state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['model_state_dict'])
            else:
                self.model.load_state_dict(checkpoint)
            logger.info(f"Loaded model weights from {weights_path}")
        except Exception as e:
            logger.error(f"Error loading model weights: {e}")
            raise
    
    def save_weights(self, weights_path: str):
        """Save model weights"""
        try:
            torch.save(self.model.state_dict(), weights_path)
            logger.info(f"Saved model weights to {weights_path}")
        except Exception as e:
            logger.error(f"Error saving model weights: {e}")
            raise
    
    def predict(self, features: torch.Tensor) -> Dict[str, float]:
        """Make predictions"""
        features = features.to(self.device)
        return self.model.predict(features)
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        
        return {
            'model_type': 'SpeechAnalysisModel',
            'input_dim': self.model.input_dim,
            'hidden_size': self.model.hidden_size,
            'num_layers': self.model.num_layers,
            'num_characteristics': self.model.num_characteristics,
            'total_parameters': total_params,
            'trainable_parameters': trainable_params,
            'device': self.device
        }


def create_speech_analysis_model(
    input_dim: int,
    hidden_size: int = MODEL_CONFIG['hidden_size'],
    num_layers: int = MODEL_CONFIG['num_layers'],
    dropout_rate: float = MODEL_CONFIG['dropout_rate'],
    num_attention_heads: int = MODEL_CONFIG['num_attention_heads']
) -> SpeechAnalysisModel:
    """Factory function to create speech analysis model"""
    return SpeechAnalysisModel(
        input_dim=input_dim,
        hidden_size=hidden_size,
        num_layers=num_layers,
        dropout_rate=dropout_rate,
        num_attention_heads=num_attention_heads
    ) 