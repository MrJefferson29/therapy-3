#!/usr/bin/env python3
"""
Simple script to upload your model to Hugging Face
Run this and follow the prompts
"""

import os
from huggingface_hub import HfApi, login

def main():
    print("🚀 Hugging Face Model Upload")
    print("=" * 40)
    
    # Get user input
    username = input("Enter your Hugging Face username: ").strip()
    if not username:
        print("❌ Username is required")
        return
    
    model_name = "therapy-ai-tinyllama"
    model_id = f"{username}/{model_name}"
    
    print(f"\n📦 Model will be uploaded as: {model_id}")
    print(f"🌐 View at: https://huggingface.co/{model_id}")
    
    confirm = input("\nProceed with upload? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ Upload cancelled")
        return
    
    try:
        # Login
        print("\n🔐 Please login to Hugging Face...")
        print("You'll need to paste your access token from:")
        print("https://huggingface.co/settings/tokens")
        login()
        
        # Initialize API
        api = HfApi()
        
        # Create repository
        print(f"\n📦 Creating repository: {model_id}")
        api.create_repo(
            repo_id=model_id,
            repo_type="model",
            private=False,
            exist_ok=True
        )
        
        # Upload files
        print(f"\n📤 Uploading model files...")
        api.upload_folder(
            folder_path="therapy-ai-tinyllama-clean",
            repo_id=model_id,
            repo_type="model",
            commit_message="Upload fine-tuned therapy AI model"
        )
        
        print(f"\n🎉 SUCCESS!")
        print(f"✅ Model uploaded: {model_id}")
        print(f"🌐 View at: https://huggingface.co/{model_id}")
        print(f"\n📋 Use this model ID in your code: {model_id}")
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        print("💡 Make sure you have the correct username and token")

if __name__ == "__main__":
    main()
