#!/usr/bin/env node

// Test script for the working model
const { pipeline } = require('@xenova/transformers');

async function testModel() {
    try {
        console.log('🔄 Loading model...');
        const generator = await pipeline('text-generation', './therapy-ai-working');
        
        console.log('🔄 Testing generation...');
        const result = await generator('Hello, I need help with anxiety.', {
            max_new_tokens: 50,
            temperature: 0.7
        });
        
        console.log('✅ Model working!');
        console.log('Response:', result[0].generated_text);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testModel();
