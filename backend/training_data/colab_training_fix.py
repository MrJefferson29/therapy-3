#!/usr/bin/env python3
"""
Quick fix for the wandb issue in Colab training.
Run this in Colab to disable wandb before training.
"""

import os
os.environ["WANDB_DISABLED"] = "true"

print("✅ Weights & Biases (wandb) disabled!")
print("Now you can run your training without API key issues.")
print("")
print("Copy and run this training code in a new cell:")
print("")
print("""
# Training code (run this in a new cell)
from transformers import TrainingArguments, Trainer, DataCollatorForLanguageModeling

training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=2,
    per_device_eval_batch_size=2,
    gradient_accumulation_steps=4,
    warmup_steps=100,
    max_steps=500,
    weight_decay=0.01,
    logging_dir="./logs",
    logging_steps=10,
    save_steps=250,
    eval_strategy="steps",
    eval_steps=250,
    save_strategy="steps",
    load_best_model_at_end=True,
    metric_for_best_model="loss",
    greater_is_better=False,
    fp16=True,
    push_to_hub=True,
    hub_model_id=f"your-username/therapy-llama2-{model_size}-colab",
    report_to="none"  # This disables wandb
)

data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    data_collator=data_collator,
)

print("Starting training...")
trainer.train()
print("Training completed!")
""")