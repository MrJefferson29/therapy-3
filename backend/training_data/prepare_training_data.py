import json
import pandas as pd
import os

def convert_intents_to_training_data(intents_file):
    """Convert intents.json to instruction-response format"""
    with open(intents_file, 'r') as f:
        data = json.load(f)

    training_data = []

    system_prompt = """You are Zensui AI, a compassionate therapy assistant designed to provide supportive, evidence-based therapeutic conversations. You specialize in cognitive behavioral therapy (CBT) to university students, trauma-informed care, and mindfulness-based interventions.

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