#!/usr/bin/env python3
"""
Upload your fine-tuned TinyLlama model to Hugging Face Hub
This makes it available for free hosting and easy deployment
"""

import os
from huggingface_hub import HfApi, login
from pathlib import Path

def upload_model():
    # Configuration
    MODEL_DIR = "therapy-ai-tinyllama-clean"
    
    # Get username from user input
    print("🔐 Hugging Face Setup")
    print("=" * 30)
    HF_USERNAME = input("Enter your Hugging Face username: ").strip()
    if not HF_USERNAME:
        print("❌ Username cannot be empty")
        return False
    
    MODEL_NAME = "therapy-ai-tinyllama"  # Your model name
    
    # Full model ID
    model_id = f"{HF_USERNAME}/{MODEL_NAME}"
    
    print("🚀 Uploading TinyLlama Model to Hugging Face Hub")
    print("=" * 50)
    print(f"📁 Model directory: {MODEL_DIR}")
    print(f"🏷️ Model ID: {model_id}")
    
    # Check if model directory exists
    if not os.path.exists(MODEL_DIR):
        print(f"❌ Model directory not found: {MODEL_DIR}")
        print("💡 Make sure you're running this from the project root")
        return False
    
    # Check required files
    required_files = [
        "config.json",
        "model.safetensors", 
        "tokenizer.json",
        "tokenizer_config.json",
        "generation_config.json"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(os.path.join(MODEL_DIR, file)):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        return False
    
    print("✅ All required files found")
    
    try:
        # Initialize HF API
        api = HfApi()
        
        # Login (you'll need to enter your HF token)
        print("\n🔐 Please login to Hugging Face...")
        login()
        
        # Create repository
        print(f"\n📦 Creating repository: {model_id}")
        api.create_repo(
            repo_id=model_id,
            repo_type="model",
            private=False,  # Set to True if you want private
            exist_ok=True
        )
        
        # Upload files
        print(f"\n📤 Uploading model files...")
        api.upload_folder(
            folder_path=MODEL_DIR,
            repo_id=model_id,
            repo_type="model",
            commit_message="Upload fine-tuned therapy AI model"
        )
        
        print(f"\n🎉 Model uploaded successfully!")
        print(f"🌐 View your model at: https://huggingface.co/{model_id}")
        print(f"📋 Model ID for deployment: {model_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return False

if __name__ == "__main__":
    upload_model()
