# Speech Analysis for Interview Simulation Platform

An AI-powered speech analysis system designed to evaluate interview performance by analyzing speech characteristics such as nervousness, confidence, fluency, pace, and tone. This system provides structured, actionable feedback to help users improve their interview skills.

## Features

- **Real-time Speech Analysis**: Analyze audio input for speech characteristics
- **Multi-modal Feature Extraction**: Combines Wav2Vec2, HuBERT, and OpenSMILE features
- **Deep Learning Model**: PyTorch-based model with LSTM and attention mechanisms
- **Structured Feedback**: Generate actionable feedback with specific improvement suggestions
- **Interview-Specific Analysis**: Tailored feedback for different question types (technical, behavioral, situational)
- **REST API**: FastAPI-based API for easy integration
- **Batch Processing**: Support for analyzing multiple audio files
- **Comprehensive Evaluation**: Detailed metrics and visualization tools

## Architecture

### Core Components

1. **Audio Processor** (`src/core/audio_processor.py`)
   - Audio loading and preprocessing
   - Voice Activity Detection (VAD)
   - Speech segmentation
   - Filler word detection

2. **Feature Extractor** (`src/core/feature_extractor.py`)
   - Wav2Vec2 embeddings
   - HuBERT embeddings
   - OpenSMILE acoustic features
   - Mel spectrogram features
   - Prosodic features

3. **ML Model** (`src/core/ml_model.py`)
   - PyTorch deep learning model
   - LSTM with attention for temporal modeling
   - Multi-head outputs for different speech characteristics
   - Feature fusion layer

4. **Feedback Generator** (`src/utils/feedback_generator.py`)
   - Converts model predictions to structured feedback
   - Interview-specific recommendations
   - Actionable improvement suggestions

5. **API** (`src/api/main.py`)
   - FastAPI application
   - Real-time analysis endpoints
   - Batch processing support
   - Health checks and model info

## Speech Characteristics Analyzed

1. **Nervousness** (0-1, lower is better)
   - Detects signs of anxiety and stress in speech
   - Identifies voice tremors, rapid speech, and hesitations

2. **Confidence** (0-1, higher is better)
   - Measures self-assurance and conviction
   - Analyzes voice strength and assertiveness

3. **Fluency** (0-1, higher is better)
   - Evaluates speech smoothness and flow
   - Detects filler words and interruptions

4. **Pace** (0-1, higher is better)
   - Analyzes speaking speed and rhythm
   - Identifies appropriate pacing and consistency

5. **Tone** (0-1, higher is better)
   - Evaluates vocal variety and engagement
   - Measures enthusiasm and professional tone

## Installation

### Prerequisites

- Python 3.9+
- PyTorch 2.0+
- CUDA (optional, for GPU acceleration)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd speech-analysis-platform
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up directories**
   ```bash
   mkdir -p data/raw_audio data/annotations data/processed_features models
   ```

4. **Configure settings**
   - Update `src/config/settings.py` with your paths and preferences
   - Set `BASE_DIR` to your project directory

## Usage

### Training the Model

1. **Prepare your dataset**
   - Place audio files in `data/raw_audio/`
   - Create annotations in `data/annotations/` (see Dataset Format below)

2. **Train the model**
   ```bash
   python train.py --data_dir data --num_epochs 50 --batch_size 16
   ```

### Running the API

1. **Start the API server**
   ```bash
   python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000
   ```

2. **API Endpoints**
   - `POST /analyze/speech`: Analyze single audio file
   - `POST /analyze/batch`: Analyze multiple audio files
   - `GET /health`: Health check
   - `GET /model/info`: Model information

### Example API Usage

```python
import requests

# Analyze single audio file
with open('interview_audio.wav', 'rb') as f:
    files = {'audio_file': f}
    data = {'question_type': 'technical'}
    response = requests.post('http://localhost:8000/analyze/speech', files=files, data=data)
    results = response.json()
    print(results['feedback']['summary'])
```

### Evaluation

```bash
python evaluate.py --data_dir data --model_path models/trained_speech_analysis_model.pth
```

## Dataset Format

### Audio Files
- Supported formats: WAV, MP3, M4A, FLAC
- Recommended: 16kHz sample rate, mono channel
- Duration: 5-30 seconds per sample

### Annotations
Create JSON files with the following structure:

```json
[
  {
    "filename": "audio_file.wav",
    "nervousness": 0.3,
    "confidence": 0.8,
    "fluency": 0.7,
    "pace": 0.6,
    "tone": 0.9
  }
]
```

### RAVDESS Dataset Integration

The system includes support for the RAVDESS emotional speech dataset:

```bash
# Download and process RAVDESS dataset
python create_ravdess_annotations.py
```

## Model Architecture

### Feature Extraction Pipeline
1. **Audio Preprocessing**: Resampling, normalization, VAD
2. **Multi-modal Features**:
   - Wav2Vec2 embeddings (768 dimensions)
   - HuBERT embeddings (768 dimensions)
   - OpenSMILE features (variable dimensions)
   - Mel spectrogram features (7 dimensions)
   - Prosodic features (16 dimensions)
3. **Feature Fusion**: Attention-weighted combination

### Neural Network Architecture
- **Input Layer**: Feature fusion layer
- **LSTM Layers**: Bidirectional LSTM for temporal modeling
- **Attention Mechanism**: Multi-head self-attention
- **Output Heads**: Separate heads for each speech characteristic
- **Activation**: Sigmoid for 0-1 output range

## Performance Metrics

The model is evaluated using:
- **Regression Metrics**: MSE, MAE, R², Correlation
- **Classification Metrics**: Precision, Recall, F1-Score, Accuracy
- **Overall Score**: Weighted combination of all characteristics

## Integration with Interview Platform

### Tavus AI Integration
- Use the API endpoints to analyze candidate responses
- Integrate feedback into the interview simulation flow
- Provide real-time coaching based on speech analysis

### GPT-4o Mini Integration
- Combine speech analysis with content evaluation
- Provide comprehensive interview feedback
- Generate personalized improvement plans

### Bolt.new Deployment
- Containerized application ready for deployment
- Scalable API endpoints
- Health monitoring and logging

## Configuration

### Key Settings (`src/config/settings.py`)

```python
# Model Architecture
HIDDEN_SIZE = 256
NUM_LAYERS = 2
DROPOUT_RATE = 0.3
NUM_ATTENTION_HEADS = 8

# Training
BATCH_SIZE = 16
LEARNING_RATE = 1e-4
NUM_EPOCHS = 50

# Thresholds
CONFIDENCE_THRESHOLD = 0.7
NERVOUSNESS_THRESHOLD = 0.6
FLUENCY_THRESHOLD = 0.6
PACE_THRESHOLD = 0.5
TONE_THRESHOLD = 0.5
```

## Docker Deployment

```bash
# Build image
docker build -t speech-analysis .

# Run container
docker run -p 8000:8000 speech-analysis

# With volume mounts for data
docker run -p 8000:8000 -v $(pwd)/data:/app/data -v $(pwd)/models:/app/models speech-analysis
```

## Development

### Project Structure
```
├── src/
│   ├── api/
│   │   └── main.py              # FastAPI application
│   ├── core/
│   │   ├── audio_processor.py   # Audio processing
│   │   ├── feature_extractor.py # Feature extraction
│   │   └── ml_model.py          # Neural network model
│   ├── config/
│   │   └── settings.py          # Configuration
│   └── utils/
│       └── feedback_generator.py # Feedback generation
├── data/
│   ├── raw_audio/               # Audio files
│   ├── annotations/             # Labels
│   └── processed_features/      # Extracted features
├── models/                      # Trained models
├── tests/                       # Unit tests
├── train.py                     # Training script
├── evaluate.py                  # Evaluation script
├── requirements.txt             # Dependencies
└── Dockerfile                   # Container configuration
```

### Running Tests
```bash
pytest tests/
```

### Code Quality
```bash
# Format code
black src/ tests/

# Lint code
flake8 src/ tests/
```

## Troubleshooting

### Common Issues

1. **Audio Loading Errors**
   - Ensure audio files are in supported formats
   - Check file permissions
   - Verify audio file integrity

2. **Model Loading Errors**
   - Check model file path
   - Verify PyTorch version compatibility
   - Ensure sufficient memory

3. **Feature Extraction Errors**
   - Install OpenSMILE dependencies
   - Check internet connection for model downloads
   - Verify audio preprocessing

4. **API Errors**
   - Check port availability
   - Verify CORS settings
   - Monitor memory usage

### Performance Optimization

1. **GPU Acceleration**
   - Install CUDA-compatible PyTorch
   - Set device to 'cuda' in settings
   - Monitor GPU memory usage

2. **Batch Processing**
   - Adjust batch size based on memory
   - Use multiple workers for data loading
   - Implement caching for features

3. **API Optimization**
   - Enable response compression
   - Implement request queuing
   - Use async processing for long operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- RAVDESS dataset for emotional speech data
- Hugging Face for pre-trained models
- OpenSMILE for acoustic feature extraction
- PyTorch for deep learning framework

## Support

For questions and support:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide 