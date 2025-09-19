import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, PeftModel
from trl import SFTTrainer
import json

# 1. Define Model and Dataset
model_name = "meta-llama/Llama-2-7b-chat-hf"  # Will work once approved
dataset_path = "therapy_fine_tuning_dataset.jsonl"
new_model_name = "therapy-ai-llama-model"

# 2. Load and Process Dataset
print("Loading dataset...")
dataset = load_dataset('json', data_files=dataset_path, split='train')

# Convert the dataset to the format expected by SFTTrainer
def format_conversation(example):
    """Convert messages format to text format for training"""
    messages = example['messages']
    text = ""
    for message in messages:
        if message['role'] == 'user':
            text += f"<s>[INST] {message['content']} [/INST] "
        elif message['role'] == 'model':
            text += f"{message['content']} </s>"
    return {"text": text}

# Apply formatting to the dataset
print("Formatting dataset...")
dataset = dataset.map(format_conversation)

# 3. Configure 4-bit Quantization (QLoRA)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

# 4. Load the Base Model
print("Loading model...")
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True
)
model.config.use_cache = False
model.config.pretraining_tp = 1

# 5. Load the Tokenizer
print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

# 6. Configure LoRA
peft_config = LoraConfig(
    lora_alpha=16,
    lora_dropout=0.1,
    r=64,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
)

# 7. Configure Training Arguments
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    optim="paged_adamw_32bit",
    logging_steps=10,
    learning_rate=2e-4,
    fp16=False,
    bf16=True,
    save_steps=100,
    save_total_limit=2,
    remove_unused_columns=False,
    warmup_steps=100,
    max_grad_norm=0.3,
    lr_scheduler_type="cosine",
)

# 8. Set up the Supervised Fine-Tuning Trainer (SFTTrainer)
print("Setting up trainer...")
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    peft_config=peft_config,
    tokenizer=tokenizer,
    args=training_args,
    dataset_text_field="text",
    max_seq_length=512,
    packing=False,
)

# 9. Start Training
print("Starting training...")
trainer.train()

# 10. Save the Fine-Tuned Model
print("Saving model...")
trainer.save_model(new_model_name)

# 11. Test the model
print("Testing the fine-tuned model...")
def test_model(prompt, max_length=200):
    # Format the prompt for Llama-2
    formatted_prompt = f"<s>[INST] You are a compassionate therapy assistant. {prompt} [/INST]"
    
    # Tokenize
    inputs = tokenizer(formatted_prompt, return_tensors="pt").to(model.device)
    
    # Generate response
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_length,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id
        )
    
    # Decode response
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract just the AI response
    ai_response = response.split("[/INST]")[-1].strip()
    
    return ai_response

# Test with a few examples
test_prompts = [
    "I'm feeling really stressed about my studies",
    "I'm having a panic attack right now",
    "I feel depressed and hopeless"
]

print("\n" + "="*50)
print("TESTING FINE-TUNED LLAMA-2 MODEL")
print("="*50)

for prompt in test_prompts:
    print(f"\nUser: {prompt}")
    response = test_model(prompt)
    print(f"AI: {response}")
    print("-" * 30)

print("\nTraining completed successfully!")
print(f"Model saved as: {new_model_name}")
print("🎉 Your therapy AI is now fine-tuned with Llama-2!")
