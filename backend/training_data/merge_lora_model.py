#!/usr/bin/env python3
"""
Merge LoRA weights with base Llama 2 model for inference
This script combines the fine-tuned LoRA adapter with the base model
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import argparse
import os

def merge_lora_model(
    base_model_path: str,
    lora_adapter_path: str,
    output_path: str,
    push_to_hub: bool = False,
    hub_model_name: str = None
):
    """
    Merge LoRA adapter with base model

    Args:
        base_model_path: Path or Hugging Face model ID for base model
        lora_adapter_path: Path to LoRA adapter weights
        output_path: Local path to save merged model
        push_to_hub: Whether to push to Hugging Face Hub
        hub_model_name: Model name for Hugging Face Hub
    """

    print("Loading base model...")
    # Load base model in FP16 for memory efficiency
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_path,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True
    )

    print("Loading LoRA adapter...")
    # Load LoRA adapter
    model = PeftModel.from_pretrained(
        base_model,
        lora_adapter_path,
        torch_dtype=torch.float16,
        device_map="auto"
    )

    print("Merging LoRA weights...")
    # Merge LoRA weights with base model
    merged_model = model.merge_and_unload()

    print("Loading tokenizer...")
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(lora_adapter_path)

    print(f"Saving merged model to {output_path}...")
    # Save merged model locally
    merged_model.save_pretrained(output_path)
    tokenizer.save_pretrained(output_path)

    if push_to_hub and hub_model_name:
        print(f"Pushing merged model to Hugging Face Hub as {hub_model_name}...")
        merged_model.push_to_hub(hub_model_name)
        tokenizer.push_to_hub(hub_model_name)
        print(f"Successfully pushed to https://huggingface.co/{hub_model_name}")

    print("Model merging completed!")
    return merged_model, tokenizer

def test_merged_model(model_path: str, test_prompts: list = None):
    """Test the merged model with sample prompts"""
    print("Testing merged model...")

    # Load merged model
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    tokenizer = AutoTokenizer.from_pretrained(model_path)

    # Default test prompts
    if test_prompts is None:
        test_prompts = [
            "### Instruction:\nI'm feeling anxious about my exams. Can you help me?\n\n### Response:\n",
            "### Instruction:\nI think I'm depressed. What should I do?\n\n### Response:\n",
            "### Instruction:\nI'm having trouble sleeping. Any advice?\n\n### Response:\n"
        ]

    print("\n" + "="*50)
    print("MODEL TEST RESULTS")
    print("="*50)

    for i, prompt in enumerate(test_prompts, 1):
        print(f"\nTest {i}:")
        print(f"Prompt: {prompt}")

        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.7,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id
            )

        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Remove the prompt from response
        response = response[len(prompt):].strip()

        print(f"Response: {response}")
        print("-" * 30)

def main():
    parser = argparse.ArgumentParser(description="Merge LoRA weights with base Llama 2 model")
    parser.add_argument("--base-model", type=str, default="meta-llama/Llama-2-7b-hf",
                       help="Base model path or Hugging Face model ID")
    parser.add_argument("--lora-path", type=str, required=True,
                       help="Path to LoRA adapter weights")
    parser.add_argument("--output-path", type=str, default="./merged_therapy_llama2",
                       help="Output path for merged model")
    parser.add_argument("--push-to-hub", action="store_true",
                       help="Push merged model to Hugging Face Hub")
    parser.add_argument("--hub-name", type=str,
                       help="Model name for Hugging Face Hub (required if push-to-hub is True)")
    parser.add_argument("--test", action="store_true",
                       help="Test the merged model after creation")

    args = parser.parse_args()

    if args.push_to_hub and not args.hub_name:
        parser.error("--hub-name is required when --push-to-hub is specified")

    # Create output directory if it doesn't exist
    os.makedirs(args.output_path, exist_ok=True)

    # Merge model
    merged_model, tokenizer = merge_lora_model(
        base_model_path=args.base_model,
        lora_adapter_path=args.lora_path,
        output_path=args.output_path,
        push_to_hub=args.push_to_hub,
        hub_model_name=args.hub_name
    )

    # Test model if requested
    if args.test:
        test_merged_model(args.output_path)

if __name__ == "__main__":
    main()