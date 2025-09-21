#!/usr/bin/env python3
"""
Local Llama 2 inference script for LoRA models
Called from Node.js when Hugging Face API is unavailable
"""

import sys
import json
import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LocalLlamaInference:
    def __init__(self, model_url, api_key):
        self.model_url = model_url
        self.api_key = api_key
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")

    def load_model(self):
        """Load the LoRA model from Hugging Face"""
        try:
            logger.info(f"Loading model: {self.model_url}")

            # Set Hugging Face token
            os.environ["HUGGING_FACE_HUB_TOKEN"] = self.api_key

            # Load base model
            base_model_name = "meta-llama/Llama-2-7b-chat-hf"
            logger.info("Loading base model...")
            base_model = AutoModelForCausalLM.from_pretrained(
                base_model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
                low_cpu_mem_usage=True
            )

            # Load LoRA adapter
            logger.info("Loading LoRA adapter...")
            self.model = PeftModel.from_pretrained(base_model, self.model_url)

            # Load tokenizer
            logger.info("Loading tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(base_model_name)
            self.tokenizer.pad_token = self.tokenizer.eos_token

            logger.info("✅ Model loaded successfully!")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            return False

    def generate_response(self, prompt):
        """Generate response for the given prompt"""
        try:
            if not self.model or not self.tokenizer:
                if not self.load_model():
                    return None

            # Format prompt for Llama 2
            formatted_prompt = self.format_prompt_for_llama2(prompt)

            # Tokenize
            inputs = self.tokenizer(
                formatted_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=1024
            )

            if self.device == "cuda":
                inputs = {k: v.cuda() for k, v in inputs.items()}

            # Generate
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=500,
                    temperature=0.7,
                    top_p=0.9,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )

            # Decode response
            full_response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

            # Extract only the AI response (after the instruction)
            ai_response = self.extract_ai_response(full_response, formatted_prompt)

            return ai_response

        except Exception as e:
            logger.error(f"❌ Generation failed: {e}")
            return None

    def format_prompt_for_llama2(self, prompt):
        """Format prompt for Llama 2 chat template"""
        # Extract system prompt and user input
        system_match = prompt.match(r'You are Zensui AI[\s\S]*?SAFETY PROTOCOLS:[\s\S]*?User: ([\s\S]*)')
        if system_match:
            system_prompt = prompt[:prompt.index('User: ')].strip()
            user_input = system_match[1].strip()
        else:
            system_prompt = "You are Zensui AI, a compassionate therapy assistant."
            user_input = prompt

        # Format for Llama 2
        formatted = f"<s>[INST] {system_prompt}\n\n{user_input} [/INST]"
        return formatted

    def extract_ai_response(self, full_response, original_prompt):
        """Extract just the AI response from the full generated text"""
        # Remove the instruction part
        if "[/INST]" in full_response:
            response_part = full_response.split("[/INST]", 1)[1].strip()
            return response_part
        else:
            # Fallback: return everything after the prompt
            return full_response.replace(original_prompt, "").strip()

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 3:
        print("Usage: python llama2_local_inference.py <model_url> <api_key> <prompt>")
        sys.exit(1)

    model_url = sys.argv[1]
    api_key = sys.argv[2]
    prompt = " ".join(sys.argv[3:])

    # Initialize inference
    inference = LocalLlamaInference(model_url, api_key)

    # Generate response
    response = inference.generate_response(prompt)

    if response:
        # Output as JSON for Node.js to parse
        result = {"success": True, "response": response}
        print(json.dumps(result))
    else:
        result = {"success": False, "error": "Failed to generate response"}
        print(json.dumps(result))

if __name__ == "__main__":
    main()