#!/usr/bin/env node

/**
 * Test script to check environment variables and TinyLlama configuration
 */

console.log('🧪 Testing Environment Configuration');
console.log('===================================');
console.log('');

// Check environment variables
console.log('🔄 Checking environment variables...');
console.log(`USE_TINYLLAMA: ${process.env.USE_TINYLLAMA}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not set'}`);
console.log(`DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? 'Set' : 'Not set'}`);

// Check if TinyLlama service can be loaded
console.log('\n🔄 Testing TinyLlama service loading...');
try {
    const TinyLlamaAI = require('./backend/services/tinyLlamaAI');
    console.log('✅ TinyLlama service loaded successfully');
    
    // Test creating an instance
    const tinyLlama = new TinyLlamaAI();
    console.log('✅ TinyLlama instance created successfully');
    console.log(`📁 Model ID: ${tinyLlama.modelId}`);
    console.log(`📁 Is Initialized: ${tinyLlama.isInitialized}`);
    console.log(`📁 Is Ready: ${tinyLlama.isReady()}`);
    
} catch (error) {
    console.log('❌ TinyLlama service failed to load:', error.message);
}

// Check if @xenova/transformers is available
console.log('\n🔄 Testing @xenova/transformers...');
try {
    const { pipeline } = require('@xenova/transformers');
    console.log('✅ @xenova/transformers loaded successfully');
} catch (error) {
    console.log('❌ @xenova/transformers failed to load:', error.message);
}

console.log('\n🎉 Environment Test Complete!');
console.log('=============================');
