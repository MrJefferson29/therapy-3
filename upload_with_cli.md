# 🚀 Upload Model with Hugging Face CLI

## Step 1: Install CLI
```bash
pip install huggingface_hub[cli]
```

## Step 2: Login
```bash
huggingface-cli login
```
Enter your token when prompted.

## Step 3: Create Repository
```bash
huggingface-cli repo create therapy-ai-tinyllama --type model
```

## Step 4: Upload Files
```bash
huggingface-cli upload YOUR_USERNAME/therapy-ai-tinyllama ./therapy-ai-tinyllama-clean/ .
```

Replace `YOUR_USERNAME` with your actual Hugging Face username.

## Step 5: Verify Upload
Visit: https://huggingface.co/YOUR_USERNAME/therapy-ai-tinyllama
