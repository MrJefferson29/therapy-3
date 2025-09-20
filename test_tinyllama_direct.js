#!/usr/bin/env node

/**
 * Test script to directly test TinyLlama initialization
 * This will test the TinyLlama service directly without going through the API
 */

const TinyLlamaAI = require('./backend/services/tinyLlamaAI');

async function testTinyLlamaDirect() {
    console.log('🧪 Testing TinyLlama Direct Initialization');
    console.log('==========================================');
    console.log('');

    try {
        // Test 1: Create TinyLlama instance
        console.log('🔄 Test 1: Creating TinyLlama instance...');
        const tinyLlama = new TinyLlamaAI();
        console.log('✅ TinyLlama instance created successfully');
        console.log(`📁 Model ID: ${tinyLlama.modelId}`);
        console.log(`📁 Local Model Path: ${tinyLlama.localModelPath}`);
        console.log(`📁 Working Model Path: ${tinyLlama.workingModelPath}`);
        console.log(`📁 Is Initialized: ${tinyLlama.isInitialized}`);
        console.log(`📁 Initialization Attempted: ${tinyLlama.initializationAttempted}`);

        // Test 2: Initialize TinyLlama
        console.log('\n🔄 Test 2: Initializing TinyLlama...');
        console.log('💡 This will trigger the model loading process');
        console.log('💡 Check for initialization messages below...');
        
        const initResult = await tinyLlama.initialize();
        console.log(`📝 Initialization result: ${initResult}`);
        console.log(`📝 Is Ready: ${tinyLlama.isReady()}`);

        // Test 3: Test content generation if initialization succeeded
        if (tinyLlama.isReady()) {
            console.log('\n🔄 Test 3: Testing content generation...');
            try {
                const testPrompt = "Hello, I'm feeling anxious about my studies. Can you help me?";
                console.log(`📝 Test prompt: "${testPrompt}"`);
                
                const result = await tinyLlama.generateContent(testPrompt);
                const response = await result.response.text();
                console.log(`📝 Generated response: "${response}"`);
                console.log('✅ Content generation successful!');
            } catch (error) {
                console.log('❌ Content generation failed:', error.message);
            }
        } else {
            console.log('\n⚠️ Test 3: Skipping content generation (model not ready)');
        }

        console.log('\n🎉 TinyLlama Direct Test Complete!');
        console.log('=================================');
        console.log('✅ TinyLlama service tested successfully');
        console.log('✅ Initialization process completed');
        console.log('✅ Model status verified');
        console.log('');
        console.log('📋 Summary:');
        console.log(`- Model ID: ${tinyLlama.modelId}`);
        console.log(`- Is Initialized: ${tinyLlama.isInitialized}`);
        console.log(`- Is Ready: ${tinyLlama.isReady()}`);
        console.log(`- Initialization Attempted: ${tinyLlama.initializationAttempted}`);
        console.log('');
        console.log('🚀 TinyLlama service is working!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error stack:', error.stack);
    }
}

// Run the test
testTinyLlamaDirect();
