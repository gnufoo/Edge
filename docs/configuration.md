# Configuration Guide

## Overview
Agent Core uses a JSON-based configuration system managed by the ConfigManager. This guide explains how to configure different aspects of the system.

## Configuration Files Structure
```
config/
└── modules/
    ├── vision.json
    ├── audio.json
    ├── action.json
    └── text.json
```

## Module Configuration

### Vision Module
```json
{
  "enabled": true,
  "modelPath": "./models/vision",
  "supportedFormats": ["jpg", "png", "webp"],
  "maxResolution": {
    "width": 1920,
    "height": 1080
  },
  "preprocessing": {
    "normalize": true,
    "resize": true
  }
}
```

### Audio Module
```json
{
  "enabled": true,
  "sampleRate": 44100,
  "channels": 2,
  "encoding": "wav",
  "bufferSize": 4096,
  "supportedFormats": ["wav", "mp3", "ogg"]
}
```

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```bash
NODE_ENV=development
LOG_LEVEL=info
API_PORT=3000
MEMORY_STORAGE_PATH=./data/memory
```

## Advanced Configuration
- Custom module configurations
- Performance tuning
- Development vs Production settings 