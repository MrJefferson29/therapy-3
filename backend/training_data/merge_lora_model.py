#!/usr/bin/env python3
"""
Script to merge LoRA adapter with base model and upload as full model
Run this in Google Colab after training to create a usable model
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import os

def merge_and_upload_lora_model():
    print("🔄 Merging LoRA adapter with base model...")

    # Model paths
    base_model_name = "meta-llama/Llama-2-7b-chat-hf"
    lora_adapter_path = "./therapy-llama2-7b"  # Local LoRA adapter
    merged_model_path = "./therapy-llama2-7b-merged"  # Output path

    # Check if LoRA adapter exists
    if not os.path.exists(lora_adapter_path):
        print(f"❌ LoRA adapter not found at {lora_adapter_path}")
        print("Make sure you're running this in the same Colab session where training completed")
        return False

    try:
        print("📥 Loading base model...")
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16,
            device_map="auto"
        )

        print("🔧 Loading LoRA adapter...")
        model = PeftModel.from_pretrained(base_model, lora_adapter_path)

        print("⚡ Merging LoRA weights...")
        merged_model = model.merge_and_unload()

        print("💾 Saving merged model...")
        merged_model.save_pretrained(merged_model_path)

        # Load and save tokenizer
        tokenizer = AutoTokenizer.from_pretrained(base_model_name)
        tokenizer.save_pretrained(merged_model_path)

        print("✅ Model merged successfully!")
        print(f"📁 Merged model saved to: {merged_model_path}")

        # Upload to Hugging Face
        print("📤 Uploading merged model to Hugging Face...")
        from huggingface_hub import upload_folder

        upload_folder(
            folder_path=merged_model_path,
            repo_id="thejefferson29/therapy-llama2-7b-merged",
            commit_message="Upload merged therapy AI model (LoRA + base model)"
        )

        print("🎉 Success! Merged model uploaded to:")
        print("https://huggingface.co/thejefferson29/therapy-llama2-7b-merged")

        print("\n🔧 Update your backend .env file:")
        print("LLAMA2_MODEL_URL=thejefferson29/therapy-llama2-7b-merged")

        return True

    except Exception as e:
        print(f"❌ Error merging model: {e}")
        return False

if __name__ == "__main__":
    merge_and_upload_lora_model()