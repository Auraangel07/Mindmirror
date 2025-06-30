"""
RAVDESS Dataset Annotation Script

This script processes the existing RAVDESS dataset and creates annotations for speech analysis training.
RAVDESS contains 24 professional actors (12 male, 12 female) expressing 8 emotions.
"""

import os
import json
import pandas as pd
from pathlib import Path
import logging
from typing import Dict, List, Tuple
import numpy as np
from sklearn.model_selection import train_test_split

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Emotion mapping for RAVDESS
EMOTION_MAPPING = {
    '01': 'neutral',
    '02': 'calm', 
    '03': 'happy',
    '04': 'sad',
    '05': 'angry',
    '06': 'fearful',
    '07': 'disgust',
    '08': 'surprised'
}

# Intensity mapping
INTENSITY_MAPPING = {
    '01': 'normal',
    '02': 'strong'
}

# Statement mapping
STATEMENT_MAPPING = {
    '01': 'Kids are talking by the door',
    '02': 'Dogs are sitting by the door'
}

# Repetition mapping
REPETITION_MAPPING = {
    '01': 'first',
    '02': 'second'
}

# Actor mapping (gender)
ACTOR_GENDER = {
    '01': 'female', '02': 'female', '03': 'female', '04': 'female',
    '05': 'female', '06': 'female', '07': 'female', '08': 'female',
    '09': 'female', '10': 'female', '11': 'female', '12': 'female',
    '13': 'male', '14': 'male', '15': 'male', '16': 'male',
    '17': 'male', '18': 'male', '19': 'male', '20': 'male',
    '21': 'male', '22': 'male', '23': 'male', '24': 'male'
}


def parse_filename(filename: str) -> Dict:
    """
    Parse RAVDESS filename to extract metadata
    
    RAVDESS filename format: XX-XX-XX-XX-XX-XX-XX-XX.wav
    Where each XX represents:
    - Modality (01=full-AV, 02=video-only, 03=audio-only)
    - Vocal channel (01=speech, 02=song)
    - Emotion (01-08)
    - Emotional intensity (01=normal, 02=strong)
    - Statement (01-02)
    - Repetition (01-02)
    - Actor (01-24)
    - Gender (01=female, 02=male)
    
    Args:
        filename: RAVDESS audio filename
        
    Returns:
        Dictionary containing parsed metadata
    """
    if not filename.endswith('.wav'):
        return None
    
    parts = filename.replace('.wav', '').split('-')
    if len(parts) != 8:
        return None
    
    try:
        modality, vocal_channel, emotion, intensity, statement, repetition, actor, gender = parts
        
        return {
            'filename': filename,
            'modality': modality,
            'vocal_channel': vocal_channel,
            'emotion': emotion,
            'emotion_name': EMOTION_MAPPING.get(emotion, 'unknown'),
            'intensity': intensity,
            'intensity_name': INTENSITY_MAPPING.get(intensity, 'unknown'),
            'statement': statement,
            'statement_text': STATEMENT_MAPPING.get(statement, 'unknown'),
            'repetition': repetition,
            'repetition_name': REPETITION_MAPPING.get(repetition, 'unknown'),
            'actor': actor,
            'gender': gender,
            'actor_gender': ACTOR_GENDER.get(actor, 'unknown')
        }
    except Exception as e:
        logger.warning(f"Error parsing filename {filename}: {e}")
        return None


def map_emotion_to_speech_characteristics(emotion: str, intensity: str) -> Dict[str, float]:
    """
    Map RAVDESS emotions to speech analysis characteristics
    
    Args:
        emotion: Emotion name from RAVDESS
        intensity: Intensity level (normal/strong)
        
    Returns:
        Dictionary of speech characteristics scores
    """
    # Base scores for each emotion
    emotion_scores = {
        'neutral': {
            'nervousness': 0.2,
            'confidence': 0.7,
            'fluency': 0.8,
            'pace': 0.7,
            'tone': 0.6
        },
        'calm': {
            'nervousness': 0.1,
            'confidence': 0.8,
            'fluency': 0.9,
            'pace': 0.8,
            'tone': 0.7
        },
        'happy': {
            'nervousness': 0.1,
            'confidence': 0.9,
            'fluency': 0.9,
            'pace': 0.8,
            'tone': 0.9
        },
        'sad': {
            'nervousness': 0.3,
            'confidence': 0.4,
            'fluency': 0.6,
            'pace': 0.5,
            'tone': 0.3
        },
        'angry': {
            'nervousness': 0.2,
            'confidence': 0.8,
            'fluency': 0.7,
            'pace': 0.9,
            'tone': 0.8
        },
        'fearful': {
            'nervousness': 0.8,
            'confidence': 0.3,
            'fluency': 0.4,
            'pace': 0.6,
            'tone': 0.4
        },
        'disgust': {
            'nervousness': 0.2,
            'confidence': 0.6,
            'fluency': 0.7,
            'pace': 0.7,
            'tone': 0.5
        },
        'surprised': {
            'nervousness': 0.4,
            'confidence': 0.7,
            'fluency': 0.8,
            'pace': 0.8,
            'tone': 0.8
        }
    }
    
    # Get base scores
    base_scores = emotion_scores.get(emotion, emotion_scores['neutral']).copy()
    
    # Adjust for intensity
    if intensity == 'strong':
        # Amplify the characteristics
        for key in base_scores:
            if key == 'nervousness':
                # For nervousness, stronger emotion might mean more nervous
                base_scores[key] = min(1.0, base_scores[key] * 1.3)
            else:
                # For other characteristics, stronger emotion might mean more pronounced
                base_scores[key] = min(1.0, base_scores[key] * 1.2)
    
    # Add some randomness to make it more realistic
    for key in base_scores:
        noise = np.random.normal(0, 0.05)  # 5% standard deviation
        base_scores[key] = np.clip(base_scores[key] + noise, 0.0, 1.0)
    
    return base_scores


def create_annotations(data_dir: Path) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Create annotations for the RAVDESS dataset
    
    Args:
        data_dir: Directory containing the extracted dataset
        
    Returns:
        Tuple of (train_annotations, val_annotations, test_annotations)
    """
    raw_audio_dir = data_dir / "raw_audio"
    annotations = []
    
    # Check if raw_audio directory exists
    if not raw_audio_dir.exists():
        logger.error(f"Raw audio directory not found: {raw_audio_dir}")
        logger.info("Please ensure your RAVDESS dataset is extracted to the 'raw_audio' directory")
        return [], [], []
    
    # Find all audio files
    audio_files = list(raw_audio_dir.rglob("*.wav"))
    logger.info(f"Found {len(audio_files)} audio files")
    
    if len(audio_files) == 0:
        logger.error("No WAV files found in the raw_audio directory")
        logger.info("Please ensure your RAVDESS dataset contains WAV files")
        return [], [], []
    
    for audio_file in audio_files:
        # Parse filename
        metadata = parse_filename(audio_file.name)
        if not metadata:
            continue
        
        # Only use speech modality (not song)
        if metadata['vocal_channel'] != '01':
            continue
        
        # Map emotion to speech characteristics
        speech_scores = map_emotion_to_speech_characteristics(
            metadata['emotion_name'], 
            metadata['intensity_name']
        )
        
        # Create annotation
        annotation = {
            'filename': str(audio_file.relative_to(raw_audio_dir)),
            'filepath': str(audio_file),
            'emotion': metadata['emotion_name'],
            'intensity': metadata['intensity_name'],
            'actor': metadata['actor'],
            'gender': metadata['actor_gender'],
            'statement': metadata['statement_text'],
            'repetition': metadata['repetition_name'],
            **speech_scores
        }
        
        annotations.append(annotation)
    
    logger.info(f"Created {len(annotations)} annotations")
    
    if len(annotations) == 0:
        logger.error("No valid annotations created. Please check your dataset structure.")
        return [], [], []
    
    # Split into train/val/test
    train_annotations, temp_annotations = train_test_split(
        annotations, test_size=0.3, random_state=42, stratify=[a['emotion'] for a in annotations]
    )
    
    val_annotations, test_annotations = train_test_split(
        temp_annotations, test_size=0.5, random_state=42, 
        stratify=[a['emotion'] for a in temp_annotations]
    )
    
    logger.info(f"Split: {len(train_annotations)} train, {len(val_annotations)} val, {len(test_annotations)} test")
    
    return train_annotations, val_annotations, test_annotations


def save_annotations(annotations: List[Dict], filepath: Path):
    """Save annotations to JSON file"""
    with open(filepath, 'w') as f:
        json.dump(annotations, f, indent=2)
    logger.info(f"Saved {len(annotations)} annotations to {filepath}")


def create_csv_annotations(annotations: List[Dict], filepath: Path):
    """Create CSV format annotations for compatibility"""
    df = pd.DataFrame(annotations)
    df.to_csv(filepath, index=False)
    logger.info(f"Saved {len(annotations)} annotations to {filepath}")


def main():
    """Main function to process existing RAVDESS dataset"""
    # Set up paths
    base_dir = Path("/teamspace/studios/this_studio/Mirror_Mind")
    data_dir = base_dir / "data"
    annotations_dir = data_dir / "annotations"
    
    # Create directories
    data_dir.mkdir(exist_ok=True)
    annotations_dir.mkdir(exist_ok=True)
    
    logger.info("Starting RAVDESS dataset processing...")
    logger.info(f"Looking for dataset in: {data_dir}")
    
    # Check if raw_audio directory exists
    raw_audio_dir = data_dir / "raw_audio"
    if not raw_audio_dir.exists():
        logger.error(f"Raw audio directory not found: {raw_audio_dir}")
        logger.info("Please ensure your RAVDESS dataset is extracted to the 'raw_audio' directory")
        logger.info("Expected structure: data/raw_audio/Actor_01/, Actor_02/, etc.")
        return
    
    # Step 1: Create annotations
    logger.info("Creating annotations...")
    train_annotations, val_annotations, test_annotations = create_annotations(data_dir)
    
    if len(train_annotations) == 0:
        logger.error("No annotations created. Please check your dataset.")
        return
    
    # Step 2: Save annotations
    logger.info("Saving annotations...")
    save_annotations(train_annotations, annotations_dir / "train_annotations.json")
    save_annotations(val_annotations, annotations_dir / "val_annotations.json")
    save_annotations(test_annotations, annotations_dir / "test_annotations.json")
    
    # Also create CSV versions for compatibility
    create_csv_annotations(train_annotations, annotations_dir / "train_annotations.csv")
    create_csv_annotations(val_annotations, annotations_dir / "val_annotations.csv")
    create_csv_annotations(test_annotations, annotations_dir / "test_annotations.csv")
    
    # Create combined CSV for training
    all_annotations = train_annotations + val_annotations + test_annotations
    create_csv_annotations(all_annotations, data_dir / "labels.csv")
    
    # Print summary
    print("\n" + "="*60)
    print("RAVDESS DATASET PROCESSING COMPLETED!")
    print("="*60)
    print(f"Total audio files: {len(all_annotations)}")
    print(f"Training samples: {len(train_annotations)}")
    print(f"Validation samples: {len(val_annotations)}")
    print(f"Test samples: {len(test_annotations)}")
    
    # Emotion distribution
    emotion_counts = {}
    for ann in all_annotations:
        emotion = ann['emotion']
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    print("\nEmotion distribution:")
    for emotion, count in sorted(emotion_counts.items()):
        print(f"  {emotion}: {count}")
    
    # Actor distribution
    actor_counts = {}
    for ann in all_annotations:
        actor = ann['actor']
        actor_counts[actor] = actor_counts.get(actor, 0) + 1
    
    print(f"\nActor distribution: {len(actor_counts)} actors")
    print(f"Gender distribution:")
    male_count = sum(1 for ann in all_annotations if ann['gender'] == 'male')
    female_count = sum(1 for ann in all_annotations if ann['gender'] == 'female')
    print(f"  Male: {male_count}")
    print(f"  Female: {female_count}")
    
    print(f"\nDataset ready for training!")
    print(f"Use: python train.py --data_dir {data_dir}")
    print(f"Annotation files saved to: {annotations_dir}")


if __name__ == "__main__":
    main() 