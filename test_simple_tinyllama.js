#!/usr/bin/env node

/**
 * Simple test to check TinyLlama initialization
 */

console.log('🧪 Simple TinyLlama Test');
console.log('========================');
console.log('');

async function testTinyLlama() {
    try {
        console.log('🔄 Loading TinyLlama service...');
        const TinyLlamaAI = require('./backend/services/tinyLlamaAI');
        console.log('✅ TinyLlama service loaded');
        
        console.log('🔄 Creating instance...');
        const tinyLlama = new TinyLlamaAI();
        console.log('✅ Instance created');
        
        console.log('🔄 Checking initialization status...');
        console.log(`Is Initialized: ${tinyLlama.isInitialized}`);
        console.log(`Is Ready: ${tinyLlama.isReady()}`);
        
        console.log('🔄 Attempting initialization...');
        const result = await tinyLlama.initialize();
        console.log(`Initialization result: ${result}`);
        console.log(`Is Ready after init: ${tinyLlama.isReady()}`);
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

testTinyLlama().then(() => {
    console.log('\n✅ Test complete');
});
