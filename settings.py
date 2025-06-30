"""
Configuration settings for the Speech Analysis Model
"""

import os
from pathlib import Path

# Base directory
BASE_DIR = Path("/teamspace/studios/this_studio/Mirror_Mind")

# Data directories
DATA_DIR = BASE_DIR / "data"
RAW_AUDIO_DIR = DATA_DIR / "raw_audio"
ANNOTATIONS_DIR = DATA_DIR / "annotations"
PROCESSED_FEATURES_DIR = DATA_DIR / "processed_features"

# Model directories
MODELS_DIR = BASE_DIR / "models"
TRAINED_MODEL_PATH = MODELS_DIR / "trained_speech_analysis_model.pth"
MODEL_SAVE_DIR = MODELS_DIR

# Audio processing settings
SAMPLE_RATE = 16000  # Hz
CHUNK_DURATION = 0.03  # seconds (30ms for VAD)
VAD_AGGRESSIVENESS = 2  # 0-3, higher = more aggressive
VAD_THRESHOLD = 0.5
MIN_AUDIO_DURATION = 1.0  # seconds
MAX_AUDIO_DURATION = 300.0  # seconds

# Feature extraction settings
WAV2VEC2_MODEL = "facebook/wav2vec2-base"
HUBERT_MODEL = "facebook/hubert-base-ls960"
OPENSMILE_CONFIG = "ComParE_2016"  # OpenSMILE configuration

# Model architecture settings
HIDDEN_SIZE = 256
NUM_LAYERS = 2
DROPOUT_RATE = 0.3
NUM_ATTENTION_HEADS = 8

# Model configuration dictionary
MODEL_CONFIG = {
    'hidden_size': HIDDEN_SIZE,
    'num_layers': NUM_LAYERS,
    'dropout_rate': DROPOUT_RATE,
    'num_attention_heads': NUM_ATTENTION_HEADS,
    'speech_characteristics': [
        'nervousness',
        'confidence', 
        'fluency',
        'pace',
        'tone'
    ]
}

# Training settings
BATCH_SIZE = 16
LEARNING_RATE = 1e-4
NUM_EPOCHS = 50
VALIDATION_SPLIT = 0.2
TEST_SPLIT = 0.1
DEVICE = "cpu"  # or "cuda" if available

# Speech characteristics to analyze
SPEECH_CHARACTERISTICS = [
    'nervousness',
    'confidence', 
    'fluency',
    'pace',
    'tone'
]

# Thresholds for feedback generation
CONFIDENCE_THRESHOLD = 0.7
NERVOUSNESS_THRESHOLD = 0.6
FLUENCY_THRESHOLD = 0.6
PACE_THRESHOLD = 0.5
TONE_THRESHOLD = 0.5

# Confidence thresholds for different characteristics
CONFIDENCE_THRESHOLDS = {
    'nervousness': 0.6,
    'confidence': 0.7,
    'fluency': 0.6,
    'pace': 0.5,
    'tone': 0.5
}

# Feedback templates and suggestions
FEEDBACK_TEMPLATES = {
    'nervousness': {
        'high': "Your speech shows signs of nervousness. Consider taking deep breaths and speaking more slowly.",
        'medium': "You appear somewhat nervous. Try to relax your shoulders and maintain steady eye contact.",
        'low': "You appear calm and composed. Great job maintaining your composure!"
    },
    'confidence': {
        'high': "You speak with great confidence! Your tone conveys authority and self-assurance.",
        'medium': "Your confidence level is good, but there's room for improvement. Speak with more conviction.",
        'low': "Try to speak with more confidence. Use a stronger voice and maintain good posture."
    },
    'fluency': {
        'high': "Your speech is very fluent with minimal filler words. Excellent communication skills!",
        'medium': "Your fluency is decent, but try to reduce filler words like 'um' and 'uh'.",
        'low': "Work on reducing filler words and improving speech flow. Practice speaking clearly."
    },
    'pace': {
        'high': "Your speaking pace is excellent - not too fast, not too slow.",
        'medium': "Your pace is generally good, but try to be more consistent throughout your response.",
        'low': "Your speech pace could be improved. Try to speak more evenly and avoid rushing."
    },
    'tone': {
        'high': "Your tone is engaging and appropriate for the context. Well done!",
        'medium': "Your tone is generally good, but try to vary it more to maintain listener interest.",
        'low': "Work on varying your tone to make your speech more engaging and expressive."
    }
}

IMPROVEMENT_SUGGESTIONS = {
    'nervousness': [
        "Practice deep breathing exercises before speaking",
        "Record yourself speaking and review for nervous habits",
        "Focus on your message rather than how you're being perceived"
    ],
    'confidence': [
        "Practice power poses before important conversations",
        "Use a stronger, more authoritative voice",
        "Maintain good posture and eye contact"
    ],
    'fluency': [
        "Practice speaking without filler words",
        "Record yourself and identify patterns in your speech",
        "Take brief pauses instead of using filler words"
    ],
    'pace': [
        "Practice speaking at a consistent, moderate pace",
        "Use pauses strategically to emphasize key points",
        "Record yourself and adjust your speed accordingly"
    ],
    'tone': [
        "Practice varying your pitch and intonation",
        "Listen to confident speakers and mimic their tone",
        "Use your voice to convey emotion and enthusiasm"
    ]
}

# Feedback output directory
FEEDBACK_OUTPUT_DIR = DATA_DIR / "feedback"

# API settings
API_HOST = "0.0.0.0"
API_PORT = 8000
MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50MB
SUPPORTED_AUDIO_FORMATS = ['.wav', '.mp3', '.m4a', '.flac']

# Create directories if they don't exist
for directory in [DATA_DIR, RAW_AUDIO_DIR, ANNOTATIONS_DIR, PROCESSED_FEATURES_DIR, MODELS_DIR, FEEDBACK_OUTPUT_DIR]:
    directory.mkdir(parents=True, exist_ok=True) 