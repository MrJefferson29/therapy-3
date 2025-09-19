# Fine-Tuned Model Files

## 🚨 Important: Model Files Not in Repository

The fine-tuned AI model files are **NOT included** in this repository due to GitHub's file size limits (100MB max per file). The model files are too large to store in Git.

## 📁 Model Files Location

Your fine-tuned models should be placed in these directories:

### For Local Development:
```
therapy-ai-tinyllama-local/
├── config.json
├── model.safetensors
├── tokenizer.json
├── tokenizer_config.json
└── generation_config.json
```

### For Production:
```
therapy-ai-tinyllama-clean/
├── config.json
├── model.safetensors
├── tokenizer.json
├── tokenizer_config.json
└── generation_config.json
```

## 🔧 How to Get Your Model Files

### Option 1: Re-run Fine-Tuning
1. Use the provided scripts:
   - `therapy_fine_tuning_local.py` (for local training)
   - `therapy_fine_tuning_clean.ipynb` (for Kaggle/Colab)

2. The scripts will create the model directories automatically

### Option 2: Download from Cloud Storage
If you trained on Kaggle/Colab, download the model files and place them in the appropriate directory.

### Option 3: Use Pre-trained Model
The system will fallback to Gemini/DeepSeek if TinyLlama model files are not found.

## ⚙️ Configuration

To enable your fine-tuned model:

1. **Place model files** in the correct directory
2. **Set environment variable** in your `.env` file:
   ```
   USE_TINYLLAMA=true
   ```
3. **Restart your backend** server

## 🚀 Deployment

For production deployment:

1. **Upload model files** to your server
2. **Ensure proper permissions** for the Node.js process
3. **Set USE_TINYLLAMA=true** in production environment
4. **Test the integration** using the provided test scripts

## 📝 File Sizes

- `model.safetensors`: ~100MB (main model weights)
- `optimizer.pt`: ~200MB (training optimizer state)
- Other files: <1MB each

## 🔒 Security Note

Model files contain your custom training data. Keep them secure and don't share them publicly unless intended.

## 🆘 Troubleshooting

If you encounter issues:

1. **Check file paths** in `backend/services/tinyLlamaAI.js`
2. **Verify file permissions** on your server
3. **Check console logs** for initialization errors
4. **Test with fallback models** (Gemini/DeepSeek) first

## 📞 Support

If you need help with model deployment, check:
- `TINYLLAMA_INTEGRATION_GUIDE.md`
- `setup_tinyllama.js` script
- Backend logs for error messages
