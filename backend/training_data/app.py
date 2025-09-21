import gradio as gr
import os
import json
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    BitsAndBytesConfig
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import torch

def format_instruction(example):
    """Format data for Llama 2 instruction tuning"""
    if example["input"]:
        return f"<s>[INST] {example['instruction']}\n\n{example['input']} [/INST] {example['output']}</s>"
    else:
        return f"<s>[INST] {example['instruction']} [/INST] {example['output']}</s>"

def train_model(model_size="7b"):
    """Train the Llama 2 model"""

    # Check for required environment variables
    if not os.getenv("HF_TOKEN"):
        return "Error: HF_TOKEN environment variable not set. Please add your Hugging Face token to the Space secrets."

    if not os.getenv("HF_USERNAME"):
        return "Error: HF_USERNAME environment variable not set. Please add your Hugging Face username to the Space secrets."

    try:
        # Load dataset
        dataset = load_dataset("json", data_files="therapy_training_data.jsonl", split="train")

        # Format dataset
        dataset = dataset.map(lambda x: {"text": format_instruction(x)})

        # Load tokenizer
        model_name = f"meta-llama/Llama-2-{model_size}-chat-hf"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.pad_token = tokenizer.eos_token

        # Tokenize dataset
        def tokenize_function(examples):
            return tokenizer(examples["text"], truncation=True, padding="max_length", max_length=2048)

        tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=["text"])

        # Split dataset
        train_test_split = tokenized_dataset.train_test_split(test_size=0.1)
        train_dataset = train_test_split["train"]
        eval_dataset = train_test_split["test"]

        # Check if CUDA is available
        if not torch.cuda.is_available():
            return "Error: CUDA GPU is not available. Please ensure your Hugging Face Space is configured with GPU hardware. Recommended options: T4 x2 (consistent) or ZeroGPU (dynamic). Go to Space Settings → Hardware and select a GPU option."

        # Load model with quantization
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True
        )

        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map={"": 0},  # Use GPU 0
            trust_remote_code=True,
            torch_dtype=torch.float16
        )

        # Prepare for training
        model = prepare_model_for_kbit_training(model)

        # LoRA configuration
        lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM"
        )

        model = get_peft_model(model, lora_config)

        # Training arguments
        training_args = TrainingArguments(
            output_dir="./results",
            num_train_epochs=3,
            per_device_train_batch_size=2,  # Adjust based on GPU memory
            per_device_eval_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_steps=100,
            max_steps=1000,  # Limit steps for free tier
            weight_decay=0.01,
            logging_dir="./logs",
            logging_steps=10,
            save_steps=500,
            eval_strategy="steps",
            eval_steps=500,
            save_strategy="steps",
            load_best_model_at_end=True,
            metric_for_best_model="loss",
            greater_is_better=False,
            fp16=True,
            push_to_hub=True,
            hub_model_id=f"{os.getenv('HF_USERNAME', 'your-username')}/therapy-llama2-{model_size}",
            hub_token=os.getenv("HF_TOKEN")
        )

        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False
        )

        # Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=data_collator,
        )

        # Train
        trainer.train()

        # Save model
        trainer.save_model(f"./therapy-llama2-{model_size}")
        tokenizer.save_pretrained(f"./therapy-llama2-{model_size}")

        return f"Training completed! Model saved as therapy-llama2-{model_size}"

    except Exception as e:
        return f"Error during training: {str(e)}"

# Gradio interface
def create_interface():
    with gr.Blocks() as demo:
        gr.Markdown("# Llama 2 Therapy AI Training")
        gr.Markdown("Train a custom Llama 2 model for therapeutic conversations")

        model_size = gr.Radio(["7b", "13b"], label="Model Size", value="7b")

        train_btn = gr.Button("Start Training")
        output = gr.Textbox(label="Training Status", lines=10)

        train_btn.click(train_model, inputs=model_size, outputs=output)

    return demo

if __name__ == "__main__":
    demo = create_interface()
    demo.launch()