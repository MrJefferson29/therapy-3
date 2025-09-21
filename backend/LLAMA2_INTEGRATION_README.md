# Llama 2 AI Integration Guide

This guide provides step-by-step instructions for training a custom Llama 2 model and integrating it into your therapy platform as the primary AI model.

## Overview

Your system now uses a **three-tier model hierarchy**:
1. **Primary**: Custom trained Llama 2 model (specialized for therapy)
2. **Fallback 1**: Google Gemini 1.5 Flash
3. **Fallback 2**: DeepSeek Chat

## Prerequisites

1. **Hugging Face Account**: [Sign up here](https://huggingface.co)
2. **Llama 2 Access**: Request access to Meta's Llama 2 models
3. **GPU Access**: Free T4 GPUs available on Hugging Face Spaces
4. **API Keys**: Hugging Face token for model inference

## Step 1: Prepare Training Data

✅ **Already completed** - Your training data is ready in `backend/training_data/therapy_training_data.jsonl`

The data includes:
- Intent-based conversations from `intents.json`
- Knowledge from `university_student_knowledge.json`
- Formatted for Llama 2 instruction tuning

## Step 2: Train Your Model on Hugging Face

### 2.1 Create Hugging Face Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Create new Space:
   - **Name**: `therapy-llama2-training`
   - **SDK**: Gradio
   - **Hardware**: CPU (upgrade later)

### 2.2 Upload Training Files

Upload these files to your Space:
- `therapy_training_data.jsonl`
- `app.py` (training script)
- `requirements.txt`

### 2.3 Configure and Train

1. Update `app.py` with your model choice (7B or 13B)
2. Change hardware to **T4 x2** (free GPU tier)
3. Add your Hugging Face token to Space secrets
4. Click "Restart Space" and start training

Training takes 4-8 hours depending on model size.

## Step 3: Configure Environment Variables

Update your `backend/.env` file:

```env
# Add these lines
HUGGINGFACE_API_KEY=your_huggingface_token_here
LLAMA2_MODEL_URL=your-username/therapy-llama2-7b
```

Replace `your-username` with your Hugging Face username and the model name you chose.

## Step 4: Test Integration

Run the integration test:

```bash
cd backend
node test_llama2_integration.js
```

This will test:
1. Llama 2 model (if configured)
2. Automatic fallback to Gemini
3. Response generation

## Step 5: Deploy and Monitor

### 5.1 Start Your Backend

```bash
cd backend
npm start
```

### 5.2 Monitor Logs

Check for:
- Successful model initialization
- Fallback usage (if Llama 2 fails)
- Response generation times

### 5.3 Update Model URL

Once training completes, update `LLAMA2_MODEL_URL` in your `.env` file with the actual model repository name from Hugging Face.

## Architecture Overview

```
User Request
    ↓
Llama 2 Model (Primary)
    ↓ (if fails)
Google Gemini (Fallback 1)
    ↓ (if fails)
DeepSeek Chat (Fallback 2)
    ↓
Response to User
```

## Model Selection Logic

- **Default**: Llama 2 (custom trained for therapy)
- **Fallback**: Gemini (reliable, fast)
- **Last Resort**: DeepSeek (always available)

## Performance Expectations

- **Llama 2**: 2-5 seconds response time (Hugging Face inference)
- **Gemini**: 1-3 seconds (Google API)
- **DeepSeek**: 2-4 seconds (DeepSeek API)

## Troubleshooting

### Common Issues

1. **"Model loading" error**: Wait for model to load on Hugging Face (can take 2-3 minutes)
2. **Rate limiting**: Free tier has limits; upgrade to paid plan if needed
3. **Authentication failed**: Check your Hugging Face token
4. **Out of memory**: Use 7B model instead of 13B

### Debug Steps

1. Test each model individually using the test script
2. Check Hugging Face Space logs for training issues
3. Verify environment variables are set correctly
4. Monitor API rate limits and usage

## Cost Optimization

- **Free Tier**: 30 hours/month GPU time on Hugging Face
- **Paid Plans**: $0.0005/second for GPU usage
- **Fallback Models**: Use API credits efficiently

## Security Considerations

- Store API keys securely in environment variables
- Never commit keys to version control
- Use HTTPS for all API communications
- Implement rate limiting on your endpoints

## Next Steps

1. **Monitor Performance**: Track response times and fallback usage
2. **Gather Feedback**: Collect user feedback on response quality
3. **Iterate Training**: Use real conversation data to improve the model
4. **Scale Up**: Consider dedicated GPU instances for production

## Files Modified/Created

### New Files
- `backend/services/llama2AI.js` - Llama 2 service integration
- `backend/test_llama2_integration.js` - Integration testing
- `backend/training_data/llama2_training_guide.md` - Training guide
- `backend/training_data/prepare_training_data.py` - Data preparation
- `backend/training_data/therapy_training_data.jsonl` - Training data

### Modified Files
- `backend/controllers/ai.js` - Added Llama 2 support and fallback logic
- `backend/models/ai.js` - Updated schema for Llama 2
- `backend/.env` - Added Hugging Face configuration

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Hugging Face documentation
3. Test individual components
4. Check logs for detailed error messages

Your therapy platform now has a specialized AI model trained specifically for mental health conversations! 🎉