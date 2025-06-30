"""
Training Script for Speech Analysis Model

Trains the deep learning model on speech data to analyze:
- Nervousness
- Confidence
- Fluency
- Pace
- Tone
"""

from ast import Num
import torch
import torch.nn as nn
import torch.optim as optim
import os
from torch.utils.data import DataLoader, Dataset
import numpy as np
import pandas as pd
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import argparse
from tqdm import tqdm

# Import our modules
from src.core.audio_processor import create_audio_processor
from src.core.feature_extractor import create_feature_extractor
from src.core.ml_model import create_speech_analysis_model, SpeechAnalysisModelWrapper
from src.config.settings import (
    DATA_DIR, MODELS_DIR,
    BATCH_SIZE, LEARNING_RATE, NUM_EPOCHS,
    HIDDEN_SIZE, NUM_LAYERS, DROPOUT_RATE, NUM_ATTENTION_HEADS
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SpeechDataset(Dataset):
    """
    Dataset class for speech analysis training
    """
    
    def __init__(self, annotations: List[Dict], audio_dir: Path, feature_extractor, audio_processor):
        self.audio_dir = audio_dir
        self.feature_extractor = feature_extractor
        self.audio_processor = audio_processor
        
        # Filter annotations to only include files that exist
        self.annotations = []
        for annotation in annotations:
            audio_path = self.audio_dir / annotation['filename']
            if audio_path.exists():
                self.annotations.append(annotation)
            else:
                logger.warning(f"Audio file not found: {audio_path}")
        
        logger.info(f"Dataset initialized with {len(self.annotations)} valid samples out of {len(annotations)} total")
        
        # Define target characteristics
        self.target_characteristics = ['nervousness', 'confidence', 'fluency', 'pace', 'tone']
    
    def __len__(self):
        return len(self.annotations)
    
    def __getitem__(self, idx):
        annotation = self.annotations[idx]
        
        try:
            # Load audio
            audio_path = self.audio_dir / annotation['filename']
            audio, sr = self.audio_processor.load_audio(str(audio_path))
            
            # Preprocess for model
            audio_tensor = self.audio_processor.preprocess_for_model(audio)
            
            # Extract features
            features = self.feature_extractor.extract_all_features(audio_tensor, sr)
            combined_features = self.feature_extractor.combine_features(features)
            
            # Prepare targets
            targets = torch.FloatTensor([
                annotation.get(char, 0.5) for char in self.target_characteristics
            ])
            
            return combined_features.squeeze(0), targets
            
        except Exception as e:
            logger.warning(f"Error loading sample {idx}: {e}")
            # Return dummy data for failed samples
            dummy_features = torch.zeros(30)  # 30 features from our simplified extractor
            dummy_targets = torch.FloatTensor([0.5] * len(self.target_characteristics))
            return dummy_features, dummy_targets


class SpeechTrainer:
    """
    Trainer class for speech analysis model
    """
    
    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader,
        device: str = "cpu",
        learning_rate: float = LEARNING_RATE
    ):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device
        self.learning_rate = learning_rate
        
        # Move model to device
        self.model.to(device)
        
        # Setup optimizer and loss function
        self.optimizer = optim.AdamW(model.parameters(), lr=learning_rate)
        self.criterion = nn.MSELoss()
        
        # Training history
        self.train_losses = []
        self.val_losses = []
        self.train_metrics = {char: [] for char in ['nervousness', 'confidence', 'fluency', 'pace', 'tone']}
        self.val_metrics = {char: [] for char in ['nervousness', 'confidence', 'fluency', 'pace', 'tone']}
    
    def train_epoch(self) -> Tuple[float, Dict[str, float]]:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0.0
        epoch_metrics = {char: [] for char in ['nervousness', 'confidence', 'fluency', 'pace', 'tone']}
        
        progress_bar = tqdm(self.train_loader, desc="Training")
        
        for batch_idx, (features, targets) in enumerate(progress_bar):
            features = features.to(self.device)
            targets = targets.to(self.device)
            
            # Forward pass
            self.optimizer.zero_grad()
            predictions = self.model(features)
            
            # Calculate loss
            loss = torch.tensor(0.0, device=self.device)
            for i, char in enumerate(['nervousness', 'confidence', 'fluency', 'pace', 'tone']):
                char_loss = self.criterion(predictions[char], targets[:, i])
                loss += char_loss
                
                # Calculate metrics
                with torch.no_grad():
                    mae = mean_absolute_error(
                        targets[:, i].cpu().numpy(),
                        predictions[char].cpu().numpy()
                    )
                    epoch_metrics[char].append(mae)
            
            # Backward pass
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            
            # Update progress bar
            progress_bar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'avg_loss': f'{total_loss / (batch_idx + 1):.4f}'
            })
        
        # Calculate average metrics
        avg_metrics = {}
        for char in epoch_metrics:
            avg_metrics[char] = np.mean(epoch_metrics[char])
        
        return total_loss / len(self.train_loader), avg_metrics
    
    def validate(self) -> Tuple[float, Dict[str, float]]:
        """Validate the model"""
        self.model.eval()
        total_loss = 0.0
        epoch_metrics = {char: [] for char in ['nervousness', 'confidence', 'fluency', 'pace', 'tone']}
        
        with torch.no_grad():
            for features, targets in tqdm(self.val_loader, desc="Validation"):
                features = features.to(self.device)
                targets = targets.to(self.device)
                
                # Forward pass
                predictions = self.model(features)
                
                # Calculate loss
                loss = torch.tensor(0.0, device=self.device)
                for i, char in enumerate(['nervousness', 'confidence', 'fluency', 'pace', 'tone']):
                    char_loss = self.criterion(predictions[char], targets[:, i])
                    loss += char_loss
                    
                    # Calculate metrics
                    mae = mean_absolute_error(
                        targets[:, i].cpu().numpy(),
                        predictions[char].cpu().numpy()
                    )
                    epoch_metrics[char].append(mae)
                
                total_loss += loss.item()
        
        # Calculate average metrics
        avg_metrics = {}
        for char in epoch_metrics:
            avg_metrics[char] = np.mean(epoch_metrics[char])
        
        return total_loss / len(self.val_loader), avg_metrics
    
    def train(self, num_epochs: int, save_path: Path) -> Dict:
        """Train the model for specified number of epochs"""
        best_val_loss = float('inf')
        training_history = {
            'train_losses': [],
            'val_losses': [],
            'train_metrics': {char: [] for char in ['nervousness', 'confidence', 'fluency', 'pace', 'tone']},
            'val_metrics': {char: [] for char in ['nervousness', 'confidence', 'fluency', 'pace', 'tone']}
        }
        
        logger.info(f"Starting training for {num_epochs} epochs")
        
        for epoch in range(num_epochs):
            logger.info(f"Epoch {epoch + 1}/{num_epochs}")
            
            # Train
            train_loss, train_metrics = self.train_epoch()
            
            # Validate
            val_loss, val_metrics = self.validate()
            
            # Store history
            training_history['train_losses'].append(train_loss)
            training_history['val_losses'].append(val_loss)
            
            for char in train_metrics:
                training_history['train_metrics'][char].append(train_metrics[char])
                training_history['val_metrics'][char].append(val_metrics[char])
            
            # Log progress
            logger.info(f"Epoch {epoch + 1}: Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
            logger.info(f"Train MAE: {np.mean(list(train_metrics.values())):.4f}")
            logger.info(f"Val MAE: {np.mean(list(val_metrics.values())):.4f}")
            
            # Save best model
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': self.optimizer.state_dict(),
                    'train_loss': train_loss,
                    'val_loss': val_loss,
                    'train_metrics': train_metrics,
                    'val_metrics': val_metrics
                }, save_path)
                logger.info(f"Saved best model with validation loss: {val_loss:.4f}")
        
        return training_history
    
    def plot_training_history(self, history: Dict, save_path: Path):
        """Plot training history"""
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # Loss plot
        axes[0, 0].plot(history['train_losses'], label='Train Loss')
        axes[0, 0].plot(history['val_losses'], label='Validation Loss')
        axes[0, 0].set_title('Training and Validation Loss')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Loss')
        axes[0, 0].legend()
        axes[0, 0].grid(True)
        
        # Overall MAE plot
        train_mae = [np.mean([history['train_metrics'][char][i] for char in ['nervousness', 'confidence', 'fluency', 'pace', 'tone']]) 
                    for i in range(len(history['train_losses']))]
        val_mae = [np.mean([history['val_metrics'][char][i] for char in ['nervousness', 'confidence', 'fluency', 'pace', 'tone']]) 
                  for i in range(len(history['val_losses']))]
        
        axes[0, 1].plot(train_mae, label='Train MAE')
        axes[0, 1].plot(val_mae, label='Validation MAE')
        axes[0, 1].set_title('Training and Validation MAE')
        axes[0, 1].set_xlabel('Epoch')
        axes[0, 1].set_ylabel('MAE')
        axes[0, 1].legend()
        axes[0, 1].grid(True)
        
        # Individual characteristics MAE
        for i, char in enumerate(['nervousness', 'confidence', 'fluency', 'pace', 'tone']):
            row = 1
            col = i % 2
            if i >= 2:
                row = 1
                col = i - 2
            
            axes[row, col].plot(history['train_metrics'][char], label=f'Train {char}')
            axes[row, col].plot(history['val_metrics'][char], label=f'Val {char}')
            axes[row, col].set_title(f'{char.capitalize()} MAE')
            axes[row, col].set_xlabel('Epoch')
            axes[row, col].set_ylabel('MAE')
            axes[row, col].legend()
            axes[row, col].grid(True)
        
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()
        logger.info(f"Training history plot saved to {save_path}")


def load_annotations(annotations_dir: Path) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """Load train/val/test annotations"""
    try:
        # Try JSON format first
        train_path = annotations_dir / "train_annotations.json"
        val_path = annotations_dir / "val_annotations.json"
        test_path = annotations_dir / "test_annotations.json"
        
        if train_path.exists() and val_path.exists() and test_path.exists():
            with open(train_path, 'r') as f:
                train_annotations = json.load(f)
            with open(val_path, 'r') as f:
                val_annotations = json.load(f)
            with open(test_path, 'r') as f:
                test_annotations = json.load(f)
        else:
            # Try CSV format
            csv_path = DATA_DIR / "labels.csv"
            if csv_path.exists():
                df = pd.read_csv(csv_path)
                annotations = df.to_dict('records')
                
                # Split into train/val/test
                train_annotations, temp_annotations = train_test_split(
                    annotations, test_size=0.3, random_state=42
                )
                val_annotations, test_annotations = train_test_split(
                    temp_annotations, test_size=0.5, random_state=42
                )
            else:
                raise FileNotFoundError("No annotation files found")
        
        logger.info(f"Loaded {len(train_annotations)} train, {len(val_annotations)} val, {len(test_annotations)} test annotations")
        return train_annotations, val_annotations, test_annotations
        
    except Exception as e:
        logger.error(f"Error loading annotations: {e}")
        raise


def main():
    """Main training function"""
    parser = argparse.ArgumentParser(description="Train Speech Analysis Model")
    parser.add_argument("--data_dir", type=str, default=str(DATA_DIR), help="Data directory")
    parser.add_argument("--batch_size", type=int, default=BATCH_SIZE, help="Batch size")
    parser.add_argument("--learning_rate", type=float, default=LEARNING_RATE, help="Learning rate")
    parser.add_argument("--num_epochs", type=int, default=NUM_EPOCHS, help="Number of epochs")
    parser.add_argument("--device", type=str, default=("cuda" if torch.cuda.is_available() else "cpu"), help="Device to use")
    parser.add_argument("--save_dir", type=str, default=str(MODELS_DIR), help="Directory to save model")
    
    args = parser.parse_args()
    
    # Setup paths
    data_dir = Path(args.data_dir)
    annotations_dir = data_dir / "annotations"
    audio_dir = data_dir / "raw_audio" / "ravdess"  # Look in ravdess subdirectory
    save_dir = Path(args.save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if data exists
    if not annotations_dir.exists():
        raise FileNotFoundError(f"Annotations directory not found: {annotations_dir}")
    if not audio_dir.exists():
        raise FileNotFoundError(f"Audio directory not found: {audio_dir}")
    
    logger.info(f"Using audio directory: {audio_dir}")
    logger.info(f"Using annotations directory: {annotations_dir}")
    
    logger.info("Loading annotations...")
    train_annotations, val_annotations, test_annotations = load_annotations(annotations_dir)
    
    # Initialize components
    logger.info("Initializing components...")
    audio_processor = create_audio_processor()
    feature_extractor = create_feature_extractor(device=args.device)
    
    # Create datasets
    logger.info("Creating datasets...")
    train_dataset = SpeechDataset(train_annotations, audio_dir, feature_extractor, audio_processor)
    val_dataset = SpeechDataset(val_annotations, audio_dir, feature_extractor, audio_processor)
    
    # Check if we have enough samples
    if len(train_dataset) == 0:
        raise ValueError("No valid training samples found. Please check your audio files.")
    if len(val_dataset) == 0:
        raise ValueError("No valid validation samples found. Please check your audio files.")
    
    logger.info(f"Training dataset: {len(train_dataset)} samples")
    logger.info(f"Validation dataset: {len(val_dataset)} samples")
    
    # Create data loaders
    num_workers = os.cpu_count()
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    
    # Determine input dimension from first batch
    sample_features, _ = train_dataset[0]
    input_dim = sample_features.shape[0]
    logger.info(f"Input dimension: {input_dim}")
    
    # Create model
    logger.info("Creating model...")
    model = create_speech_analysis_model(
        input_dim=input_dim,
        hidden_size=HIDDEN_SIZE,
        num_layers=NUM_LAYERS,
        dropout_rate=DROPOUT_RATE,
        num_attention_heads=NUM_ATTENTION_HEADS
    )
    
    # Create trainer
    trainer = SpeechTrainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        device=args.device,
        learning_rate=args.learning_rate
    )
    
    # Train model
    logger.info("Starting training...")
    model_save_path = save_dir / "trained_speech_analysis_model.pth"
    history = trainer.train(args.num_epochs, model_save_path)
    
    # Plot training history
    plot_save_path = save_dir / "training_history.png"
    trainer.plot_training_history(history, plot_save_path)
    
    # Save training history
    history_save_path = save_dir / "training_history.json"
    with open(history_save_path, 'w') as f:
        json.dump(history, f, indent=2)
    
    logger.info("Training completed!")
    logger.info(f"Model saved to: {model_save_path}")
    logger.info(f"Training history saved to: {history_save_path}")
    logger.info(f"Training plots saved to: {plot_save_path}")


if __name__ == "__main__":
    main() 