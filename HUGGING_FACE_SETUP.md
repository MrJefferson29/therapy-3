# 🚀 Hugging Face Setup Guide

## Why Hugging Face is Better

✅ **Free hosting** for public models  
✅ **Reliable downloads** - no timeout issues  
✅ **Built-in CDN** - fast downloads worldwide  
✅ **Version control** - easy model updates  
✅ **Automatic caching** - `@xenova/transformers` handles this  
✅ **No Python dependencies** needed  
✅ **Professional deployment** standard  

## Step 1: Create Hugging Face Account

1. Go to [huggingface.co](https://huggingface.co)
2. Sign up for a free account
3. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
4. Create a new token with "Write" permissions
5. Copy the token (you'll need it later)

## Step 2: Upload Your Model

### Option A: Using Python Script (Recommended)

1. **Install dependencies:**
   ```bash
   pip install huggingface_hub
   ```

2. **Edit the upload script:**
   - Open `upload_to_huggingface.py`
   - Replace `your-username` with your actual Hugging Face username
   - Optionally change the model name

3. **Run the upload script:**
   ```bash
   python upload_to_huggingface.py
   ```

4. **Enter your token when prompted**

### Option B: Using Hugging Face CLI

1. **Install CLI:**
   ```bash
   pip install huggingface_hub[cli]
   ```

2. **Login:**
   ```bash
   huggingface-cli login
   ```

3. **Create repository:**
   ```bash
   huggingface-cli repo create therapy-ai-tinyllama --type model
   ```

4. **Upload files:**
   ```bash
   huggingface-cli upload your-username/therapy-ai-tinyllama ./therapy-ai-tinyllama-clean/ .
   ```

## Step 3: Update Your Code

1. **Update the model ID in `backend/services/tinyLlamaAI.js`:**
   ```javascript
   constructor(modelId = 'your-username/therapy-ai-tinyllama') {
   ```

2. **Replace `your-username` with your actual username**

## Step 4: Update Render Deployment

### Build Command:
```bash
npm install
```

### Start Command:
```bash
backend/yarn start
```

**That's it!** No more download scripts, Python dependencies, or file management.

## Step 5: Test Locally

1. **Start your backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Test the AI endpoint** - it should now load from Hugging Face automatically

## Benefits

- 🚀 **Faster deployments** - no download timeouts
- 🔄 **Automatic updates** - just push new model versions
- 📦 **No file management** - Hugging Face handles everything
- 🌍 **Global CDN** - fast downloads worldwide
- 💰 **Completely free** for public models
- 🛡️ **Reliable** - enterprise-grade infrastructure

## Troubleshooting

### Model not found error:
- Check your model ID is correct
- Ensure the model is public (not private)
- Verify the model was uploaded successfully

### Slow first load:
- This is normal - the model downloads on first use
- Subsequent loads will be fast due to caching

### Out of memory:
- The model will automatically use CPU
- Consider using a smaller model if needed
