# 🚀 Render Deployment Configuration

## Update Your Render Build Command

### 1. Go to Render Dashboard
1. Login to [Render](https://render.com)
2. Go to your therapy-3 service
3. Click "Settings"

### 2. Update Build Command
Replace your current build command with:
```bash
npm install && node backend/scripts/download_model.js
```

### 3. Environment Variables
Make sure these are set in Render:
```
USE_TINYLLAMA=true
GEMINI_API_KEY=your_gemini_key
DEEPSEEK_API_KEY=your_deepseek_key
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### 4. Deploy
Click "Manual Deploy" → "Deploy latest commit"

## What Happens During Deployment:

1. **Install Dependencies**: `npm install`
2. **Download Model Files**: `node backend/scripts/download_model.js`
3. **Start Server**: Your app starts with TinyLlama ready

## Expected Logs:
```
🚀 TinyLlama Model Download Script
==================================
📁 Model directory exists: /opt/render/project/src/backend/therapy-ai-tinyllama-clean
📥 Starting model file downloads...
📥 Downloading config.json...
✅ Downloaded config.json (0.00 MB)
📥 Downloading model.safetensors...
✅ Downloaded model.safetensors (100.37 MB)
📥 Downloading tokenizer.json...
✅ Downloaded tokenizer.json (2.00 MB)
📥 Downloading tokenizer_config.json...
✅ Downloaded tokenizer_config.json (0.00 MB)
📥 Downloading generation_config.json...
✅ Downloaded generation_config.json (0.00 MB)
✅ All model files downloaded successfully!
🔍 Verifying downloaded files...
✅ config.json (0.00 MB)
✅ model.safetensors (100.37 MB)
✅ tokenizer.json (2.00 MB)
✅ tokenizer_config.json (0.00 MB)
✅ generation_config.json (0.00 MB)
✅ All model files verified!
🎉 TinyLlama model setup complete!
```

## Troubleshooting:

### If Download Fails:
- Check Google Drive URLs are correct
- Verify files are public
- Check Render logs for specific errors

### If Model Initialization Fails:
- Check file sizes match expected
- Verify all files downloaded
- Check server disk space

### Fallback:
If TinyLlama fails, your app will automatically use Gemini/DeepSeek models.
