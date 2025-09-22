#!/usr/bin/env python3
"""
Prepare training data for Llama 2 fine-tuning from intents.json
Converts the intent-based conversation data into instruction-response format
"""

import json
import random
from typing import List, Dict, Any

def load_intents(file_path: str) -> Dict[str, Any]:
    """Load intents from JSON file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_instruction_response_pairs(intents_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """Convert intents data to instruction-response pairs for Llama 2 training"""
    training_pairs = []

    for intent in intents_data['intents']:
        tag = intent['tag']
        patterns = intent['patterns']
        responses = intent['responses']

        # Create pairs for each pattern-response combination
        for pattern in patterns:
            for response in responses:
                # Format as instruction-response pair
                pair = {
                    "instruction": f"You are a compassionate therapy AI assistant. A user says: '{pattern}'. Provide a helpful, empathetic response as a mental health support chatbot.",
                    "input": pattern,
                    "output": response
                }
                training_pairs.append(pair)

    return training_pairs

def add_variety_to_data(pairs: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Add variety to training data by creating different instruction formats"""
    enhanced_pairs = []

    for pair in pairs:
        # Keep original format
        enhanced_pairs.append(pair)

        # Add conversational format
        conversational_pair = {
            "instruction": "Continue this therapy conversation empathetically and helpfully.",
            "input": f"User: {pair['input']}",
            "output": f"Therapist: {pair['output']}"
        }
        enhanced_pairs.append(conversational_pair)

        # Add crisis detection format for high-risk keywords
        if any(keyword in pair['input'].lower() for keyword in ['suicide', 'kill', 'die', 'death', 'crisis', 'emergency']):
            crisis_pair = {
                "instruction": "This appears to be a mental health crisis. Respond with empathy, assess safety, and encourage professional help.",
                "input": pair['input'],
                "output": pair['output']
            }
            enhanced_pairs.append(crisis_pair)

    return enhanced_pairs

def balance_dataset(pairs: List[Dict[str, str]], max_per_intent: int = 50) -> List[Dict[str, str]]:
    """Balance the dataset to prevent over-representation of certain intents"""
    # Group by intent (we'll infer from the instruction)
    intent_groups = {}
    for pair in pairs:
        # Extract intent from the instruction or input
        intent_key = "general"  # Default
        if "stressed" in pair['input'].lower() or "overwhelmed" in pair['input'].lower():
            intent_key = "stress"
        elif "anxious" in pair['input'].lower() or "anxiety" in pair['input'].lower():
            intent_key = "anxiety"
        elif "depressed" in pair['input'].lower() or "depression" in pair['input'].lower():
            intent_key = "depression"
        elif "sleep" in pair['input'].lower():
            intent_key = "sleep"
        elif "suicide" in pair['input'].lower() or "kill" in pair['input'].lower():
            intent_key = "crisis"

        if intent_key not in intent_groups:
            intent_groups[intent_key] = []
        intent_groups[intent_key].append(pair)

    # Balance by sampling
    balanced_pairs = []
    for intent, group_pairs in intent_groups.items():
        if len(group_pairs) > max_per_intent:
            # Randomly sample to balance
            sampled = random.sample(group_pairs, max_per_intent)
        else:
            sampled = group_pairs
        balanced_pairs.extend(sampled)

    return balanced_pairs

def save_to_jsonl(pairs: List[Dict[str, str]], output_file: str):
    """Save training pairs to JSONL format"""
    with open(output_file, 'w', encoding='utf-8') as f:
        for pair in pairs:
            json.dump(pair, f, ensure_ascii=False)
            f.write('\n')

    print(f"Saved {len(pairs)} training pairs to {output_file}")

def main():
    # File paths
    intents_file = "../intents.json"
    output_file = "therapy_training_data.jsonl"

    print("Loading intents data...")
    intents_data = load_intents(intents_file)

    print("Creating instruction-response pairs...")
    training_pairs = create_instruction_response_pairs(intents_data)

    print(f"Created {len(training_pairs)} initial pairs")

    print("Adding variety to training data...")
    enhanced_pairs = add_variety_to_data(training_pairs)

    print(f"Enhanced to {len(enhanced_pairs)} pairs")

    print("Balancing dataset...")
    balanced_pairs = balance_dataset(enhanced_pairs)

    print(f"Balanced to {len(balanced_pairs)} pairs")

    print("Saving to JSONL format...")
    save_to_jsonl(balanced_pairs, output_file)

    # Print some statistics
    print("\nDataset Statistics:")
    print(f"Total training examples: {len(balanced_pairs)}")

    # Count by instruction type
    instruction_counts = {}
    for pair in balanced_pairs:
        instr = pair['instruction'][:50] + "..." if len(pair['instruction']) > 50 else pair['instruction']
        instruction_counts[instr] = instruction_counts.get(instr, 0) + 1

    print("\nInstruction types:")
    for instr, count in sorted(instruction_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {instr}: {count}")

if __name__ == "__main__":
    main()