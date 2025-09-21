# Complete Guide: Training Llama 2 for Therapy AI on Hugging Face

This guide will walk you through training a custom Llama 2 model for your therapy platform using Hugging Face's free platform resources.

## Prerequisites

1. **Hugging Face Account**: Sign up at [huggingface.co](https://huggingface.co)
2. **Access to Llama 2**: Request access to Meta's Llama 2 models at [https://huggingface.co/meta-llama](https://huggingface.co/meta-llama)
3. **Training Data**: Your `intents.json` and `university_student_knowledge.json` files

## Step 1: Prepare Training Data

### 1.1 Create Data Preparation Script

Create a new file called `prepare_training_data.py` in your `backend/training_data/` folder:

```python
import json
import pandas as pd
import os

def convert_intents_to_training_data(intents_file):
    """Convert intents.json to instruction-response format"""
    with open(intents_file, 'r') as f:
        data = json.load(f)

    training_data = []

    system_prompt = """You are Zensui AI, a compassionate therapy assistant designed to provide supportive, evidence-based therapeutic conversations. You specialize in cognitive behavioral therapy (CBT), trauma-informed care, and mindfulness-based interventions.

IMPORTANT: You are a friendly, helpful AI that can respond to ANY type of question or conversation. While you specialize in therapeutic support, you should:
- Respond warmly and naturally to casual greetings and general questions
- Be conversational and approachable in all interactions
- When users ask non-wellness questions, answer them helpfully while maintaining your caring personality
- Only apply therapeutic techniques when users are discussing emotional, mental health, or wellness topics
- For general questions, be informative and friendly without forcing therapeutic responses

THERAPEUTIC APPROACH:
- Use Cognitive Behavioral Therapy (CBT) techniques to help identify thought patterns
- Apply trauma-informed principles with sensitivity and care
- Incorporate mindfulness and grounding techniques when appropriate
- Use solution-focused brief therapy for practical problem-solving
- Apply dialectical behavior therapy (DBT) skills for emotional regulation

SAFETY PROTOCOLS:
- If someone appears to be in crisis, suicidal, or homicidal, respond with: "I'm very concerned about your safety and well-being. I'm immediately connecting you with a qualified therapist on our platform who can provide the urgent support you need. You can access our therapists through the 'My Therapist' section of the app, or I can help you book an emergency session right now."
- For domestic violence: Provide safety planning and direct to platform therapists
- For substance abuse: Offer harm reduction strategies and direct to platform therapists
- Never provide medical diagnosis or medication advice
- Always maintain professional boundaries"""

    for intent in data['intents']:
        for pattern in intent['patterns']:
            for response in intent['responses']:
                training_data.append({
                    "instruction": system_prompt,
                    "input": pattern,
                    "output": response
                })

    return training_data

def convert_knowledge_to_training_data(knowledge_file):
    """Convert university_student_knowledge.json to Q&A format"""
    with open(knowledge_file, 'r') as f:
        knowledge = json.load(f)

    qa_pairs = []

    system_prompt = "You are Zensui AI, a therapy assistant specializing in university student mental health. Provide compassionate, evidence-based information about mental health challenges faced by university students."

    for category, subcategories in knowledge['university_student_knowledge'].items():
        for subcategory, content in subcategories.items():
            if isinstance(content, dict):
                # Understanding explanations
                if 'understanding' in content:
                    qa_pairs.append({
                        "instruction": system_prompt,
                        "input": f"What is {subcategory.replace('_', ' ')} and how does it affect university students?",
                        "output": content['understanding']
                    })

                # Intervention recommendations
                if 'interventions' in content:
                    qa_pairs.append({
                        "instruction": system_prompt,
                        "input": f"What can help a university student dealing with {subcategory.replace('_', ' ')}?",
                        "output": f"Here are some evidence-based interventions that can help: {', '.join(content['interventions'])}"
                    })

                # Causes and risk factors
                if 'causes' in content:
                    qa_pairs.append({
                        "instruction": system_prompt,
                        "input": f"What causes {subcategory.replace('_', ' ')} in university students?",
                        "output": f"Common causes and risk factors include: {', '.join(content['causes'])}"
                    })

                # Resources
                if 'resources' in content:
                    qa_pairs.append({
                        "instruction": system_prompt,
                        "input": f"What resources are available for university students struggling with {subcategory.replace('_', ' ')}?",
                        "output": f"Here are some helpful resources: {', '.join(content['resources'])}"
                    })

    return qa_pairs

def main():
    # Convert data
    intents_data = convert_intents_to_training_data('intents.json')
    knowledge_data = convert_knowledge_to_training_data('university_student_knowledge.json')

    # Combine all training data
    all_training_data = intents_data + knowledge_data

    # Convert to DataFrame and save as JSONL
    df = pd.DataFrame(all_training_data)
    df.to_json('therapy_training_data.jsonl', orient='records', lines=True)

    print(f"Training data prepared: {len(all_training_data)} examples")
    print(f"- Intent examples: {len(intents_data)}")
    print(f"- Knowledge examples: {len(knowledge_data)}")

if __name__ == "__main__":
    main()
```

### 1.2 Run Data Preparation

```bash
cd backend/training_data
python prepare_training_data.py
```

This will create `therapy_training_data.jsonl` with your training data.

## Step 2: Set Up Hugging Face Space for Training

### 2.1 Create a New Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click "Create new Space"
3. Choose:
   - **Space name**: `therapy-llama2-training`
   - **License**: Apache-2.0
   - **SDK**: Gradio
   - **Hardware**: CPU (we'll change this later)

### 2.2 Upload Training Files

1. In your space, go to "Files" tab
2. Upload these 3 files:
   - `therapy_training_data.jsonl` (your training data)
   - `app.py` (the training script - already created)
   - `requirements.txt` (dependencies - already created)
3. Also upload your `intents.json` and `university_student_knowledge.json` (for reference)

## Step 3: Create Training Script

### 3.1 Create the Training App

In your Hugging Face Space, create a new file called `app.py`:

```python
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
            device_map="auto",
            trust_remote_code=True
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
            per_device_train_batch_size=2,
            per_device_eval_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_steps=100,
            max_steps=1000,  # Limit steps for free tier
            weight_decay=0.01,
            logging_dir="./logs",
            logging_steps=10,
            save_steps=500,
            evaluation_strategy="steps",
            eval_steps=500,
            save_strategy="steps",
            load_best_model_at_end=True,
            metric_for_best_model="loss",
            greater_is_better=False,
            fp16=True,
            push_to_hub=True,
            hub_model_id=f"your-username/therapy-llama2-{model_size}",
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
```

### 3.2 Set Up Requirements

The `requirements.txt` file has been created with updated versions for compatibility:

```
torch>=2.1.0
transformers>=4.35.0
accelerate>=0.24.0
peft>=0.6.0
bitsandbytes>=0.41.0
datasets>=2.14.0
gradio>=4.0.0
scipy
```

## Step 4: Configure Space Settings

### 4.1 Update Space Configuration

1. Go to your Space settings
2. **CRITICAL**: Change hardware to a GPU option - This is required for training!
   - **Recommended**: **ZeroGPU** (Dynamic resources with NVIDIA H200) - Best for AI training
   - **Alternative**: **T4 x2** (Consistent GPU access, 30 hours/month free)
3. Set visibility to private (for now)
4. Add environment variables:
   - `HF_TOKEN`: Your Hugging Face token (get from Settings → Access Tokens)
   - `HF_USERNAME`: Your Hugging Face username

### 4.2 Environment Variables

Make sure to set these environment variables in the Space settings:
- `HF_TOKEN`: Your Hugging Face API token (get from Settings → Access Tokens)
- `HF_USERNAME`: Your Hugging Face username

## Step 5: Run Training

1. Click "Restart this space" to apply changes
2. Once loaded, you'll see the training interface
3. Select model size (start with 7B for free tier)
4. Click "Start Training"

The training will take several hours. Monitor the logs for progress.

## Step 6: Download Trained Model

After training completes:

1. Go to your Hugging Face profile
2. Find the new model repository (e.g., `your-username/therapy-llama2-7b`)
3. Download the model files or use the inference API

## Alternative: Use Google Colab (Free GPU)

Since GPU access on Hugging Face Spaces requires Pro subscription, use Google Colab for free GPU training:

### Colab Setup:
1. Go to [Google Colab](https://colab.research.google.com)
2. Create new notebook or upload `llama2_colab_training.ipynb`
3. **Important**: Change runtime to GPU (Runtime → Change runtime type → T4 GPU)
4. Upload your training data files
5. Login to Hugging Face in the notebook
6. Run cells sequentially

### Colab Advantages:
- ✅ **Free T4 GPU** (up to 12 hours continuous use)
- ✅ **No subscription required**
- ✅ **Easy file upload/download**
- ✅ **Same training code** as Spaces version

### Training Steps in Colab:
1. Upload `therapy_training_data.jsonl`
2. Run installation cells
3. Login to Hugging Face
4. Execute training cells
5. Download trained model
6. Update your backend configuration

## Alternative: Use AutoTrain

For easier training, you can use Hugging Face's AutoTrain:

1. Go to [AutoTrain](https://huggingface.co/autotrain)
2. Create a new project
3. Upload your `therapy_training_data.jsonl`
4. Configure training parameters
5. Start training

## Troubleshooting

### "Found no NVIDIA driver" Error
- **Cause**: Space is running on CPU instead of GPU
- **Solution 1**: Upgrade to Pro for ZeroGPU/T4 x2 access
- **Solution 2**: Use Google Colab (free T4 GPU, no subscription needed)
- **Note**: Colab provides free GPU access for up to 12 hours continuous use

### "CUDA GPU is not available" Error
- **Cause**: Hardware not properly configured or GPU not allocated
- **Solution**: For Spaces - restart after changing hardware. For Colab - ensure runtime is set to GPU (Runtime → Change runtime type → T4 GPU)

### Model Loading Issues
- **Cause**: Model too large for available memory
- **Solution**: Use 7B model instead of 13B, or reduce batch size

### Authentication Errors
- **Cause**: Missing or invalid HF_TOKEN
- **Solution**: Check token in Space secrets and ensure it has write permissions

## Next Steps

Once your model is trained, proceed to integrate it into your backend system following the integration guide.