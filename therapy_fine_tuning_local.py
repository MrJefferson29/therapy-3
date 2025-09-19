#!/usr/bin/env python3
"""
Local Therapy AI Fine-Tuning Script
Optimized for running on your local machine
"""

import torch
import json
import os
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, PeftModel
from trl import SFTTrainer
import warnings
warnings.filterwarnings("ignore")

def main():
    print("🧠 Therapy AI Fine-Tuning - Local Version")
    print("=" * 50)
    
    # Check GPU availability
    print(f"🚀 CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"📱 GPU: {torch.cuda.get_device_name(0)}")
        print(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    else:
        print("⚠️ No GPU detected - training will be slower on CPU")
    
    # 1. Load and prepare dataset
    print("\n📊 Loading dataset...")
    dataset_path = 'therapy_fine_tuning_dataset.jsonl'
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset file not found: {dataset_path}")
        print("📁 Please make sure 'therapy_fine_tuning_dataset.jsonl' is in the same directory")
        return
    
    dataset = load_dataset('json', data_files=dataset_path, split='train')
    print(f"📊 Loaded dataset: {len(dataset)} conversations")
    
    # Format conversations for training (TinyLlama chat format)
    def format_conversation(example):
        """Convert messages format to text format for training"""
        messages = example['messages']
        text = ""
        for message in messages:
            if message['role'] == 'user':
                text += f"<|user|>\n{message['content']}\n"
            elif message['role'] == 'model':
                text += f"<|assistant|>\n{message['content']}\n"
        return {"text": text}
    
    dataset = dataset.map(format_conversation)
    print("✅ Dataset formatted for training!")
    
    # 2. Configure model and tokenizer
    print("\n🔄 Loading model and tokenizer...")
    
    # Using TinyLlama - perfect for fine-tuning!
    model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    new_model_name = "therapy-ai-tinyllama-local"
    
    print(f"🎯 Selected model: {model_name}")
    print(f"💾 Output name: {new_model_name}")
    print("🚀 TinyLlama is perfect for fine-tuning - small, fast, and open!")
    
    # Skip quantization for standard fine-tuning
    print("🔄 Loading model without quantization...")
    
    # Load model without device_map to avoid accelerate conflicts
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
    )
    model.config.use_cache = False
    
    # Move model to device manually
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    print(f"✅ Model loaded and moved to: {device}")
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"
    
    print("✅ Model and tokenizer loaded successfully!")
    
    # 3. Configure LoRA
    print("\n🎯 Configuring LoRA...")
    
    # Get the actual model architecture to determine correct target modules
    print(f"🔍 Model type: {type(model).__name__}")
    print(f"🔍 Model config: {model.config.model_type}")
    
    # Define target modules based on model type
    if "dialogpt" in model_name.lower():
        # DialoGPT uses different module names
        target_modules = ["c_attn", "c_proj", "c_fc"]
        print("🎯 Using DialoGPT target modules")
    elif "gpt2" in model_name.lower():
        # GPT-2 uses similar modules to DialoGPT
        target_modules = ["c_attn", "c_proj", "c_fc"]
        print("🎯 Using GPT-2 target modules")
    elif "blenderbot" in model_name.lower():
        # BlenderBot uses different modules
        target_modules = ["q_proj", "v_proj", "k_proj", "out_proj", "fc1", "fc2"]
        print("🎯 Using BlenderBot target modules")
    else:
        # Default to common transformer modules
        target_modules = ["q_proj", "v_proj", "k_proj", "o_proj"]
        print("🎯 Using default target modules")
    
    peft_config = LoraConfig(
        lora_alpha=16,
        lora_dropout=0.1,
        r=64,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=target_modules
    )
    print("✅ LoRA configuration ready!")
    print(f"🎯 Target modules: {target_modules}")
    
    # 4. Configure training arguments
    print("\n⚙️ Configuring training...")
    training_args = TrainingArguments(
        output_dir="./therapy-ai-results",
        num_train_epochs=3,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        optim="adamw_torch",  # Changed from paged_adamw_32bit for better compatibility
        logging_steps=10,
        learning_rate=2e-4,
        fp16=False,  # Disabled for CPU compatibility
        bf16=False,  # Disabled for CPU/older GPU compatibility
        save_steps=100,
        save_total_limit=2,
        remove_unused_columns=False,
        warmup_steps=100,
        max_grad_norm=0.3,
        lr_scheduler_type="cosine",
        report_to="none",
        dataloader_pin_memory=False,
    )
    print("✅ Training arguments configured!")
    
    # 5. Initialize trainer
    print("\n🚀 Initializing trainer...")
    
    # Create a proper data collator for the quantized model
    def data_collator(batch):
        # Tokenize the text data
        texts = [item['text'] for item in batch]
        inputs = tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        )
        inputs['labels'] = inputs['input_ids'].clone()
        return inputs
    
    # Skip LoRA for now and use standard fine-tuning
    print("🔄 Skipping LoRA due to compatibility issues...")
    print("🔄 Using standard fine-tuning approach...")
    
    # Use standard Trainer without PEFT
    from transformers import Trainer
    trainer = Trainer(
        model=model,
        train_dataset=dataset,
        args=training_args,
        data_collator=data_collator,
    )
    print("✅ Using standard Trainer (no LoRA)")
    
    print("✅ Trainer initialized successfully!")
    
    # 6. Start training
    print("\n🏃 Starting fine-tuning...")
    print("⏱️ This may take several hours depending on your hardware")
    trainer.train()
    print("✅ Training completed successfully!")
    
    # 7. Save model
    print("\n💾 Saving model...")
    trainer.save_model(new_model_name)
    tokenizer.save_pretrained(new_model_name)
    print(f"✅ Model saved as: {new_model_name}")
    
    # 8. Test model
    print("\n🧪 Testing the fine-tuned model...")
    def test_model(prompt, max_length=200):
        # Format for TinyLlama
        formatted_prompt = f"<|user|>\n{prompt}\n<|assistant|>\n"
        inputs = tokenizer(formatted_prompt, return_tensors="pt").to(model.device)
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_length,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id
            )
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Extract just the assistant response
        ai_response = response.split("<|assistant|>")[-1].strip()
        return ai_response
    
    test_prompts = [
        "I'm feeling really stressed about my studies",
        "I'm having a panic attack right now",
        "I feel depressed and hopeless"
    ]
    
    for prompt in test_prompts:
        print(f"\n👤 User: {prompt}")
        response = test_model(prompt)
        print(f"🤖 AI: {response}")
        print("-" * 30)
    
    print("\n🎉 Fine-tuning and testing completed successfully!")

if __name__ == "__main__":
    main()
