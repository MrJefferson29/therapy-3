# 🔗 How to Get Google Drive Direct Download URLs

## Step-by-Step Instructions:

### 1. Upload Files to Google Drive
1. Go to [Google Drive](https://drive.google.com)
2. Create folder: `therapy-ai-model`
3. Upload these files:
   - `config.json`
   - `model.safetensors`
   - `tokenizer.json`
   - `tokenizer_config.json`
   - `generation_config.json`

### 2. Make Folder Public
1. Right-click on `therapy-ai-model` folder
2. Click "Share"
3. Click "Change to anyone with the link"
4. Set permission to "Viewer"
5. Click "Done"

### 3. Get File IDs
For each file:
1. Right-click → "Get link"
2. Copy the link (looks like):
   ```
   https://drive.google.com/file/d/1ABC123DEF456GHI789JKL/view?usp=sharing
   ```
3. Extract the FILE_ID (the part between `/d/` and `/view`):
   ```
   FILE_ID = 1ABC123DEF456GHI789JKL
   ```

### 4. Convert to Direct Download URLs
Replace each FILE_ID in this format:
```
https://drive.google.com/uc?export=download&id=FILE_ID
```

### 5. Example URLs
```
'config.json': 'https://drive.google.com/uc?export=download&id=1ABC123DEF456GHI789JKL',
'model.safetensors': 'https://drive.google.com/uc?export=download&id=1XYZ789UVW012RST345MNO',
'tokenizer.json': 'https://drive.google.com/uc?export=download&id=1PQR456STU789VWX012YZA',
'tokenizer_config.json': 'https://drive.google.com/uc?export=download&id=1BCD234EFG567HIJ890KLM',
'generation_config.json': 'https://drive.google.com/uc?export=download&id=1CDE345FGH678IJK901LMN'
```

### 6. Test URLs
Test each URL in your browser - it should download the file directly.

### 7. Update Script
Replace the URLs in `backend/scripts/download_model.js` with your actual URLs.
