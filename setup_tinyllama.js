#!/usr/bin/env node

/**
 * Setup script for TinyLlama integration
 * This script helps set up the environment for running TinyLlama locally
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up TinyLlama integration...');

// 1. Check if the fine-tuned model exists
const modelPath = './therapy-ai-tinyllama-clean';
if (!fs.existsSync(modelPath)) {
  console.log('❌ Fine-tuned model not found at:', modelPath);
  console.log('📁 Please make sure you have run the fine-tuning notebook and the model is saved.');
  console.log('💡 The model should be in the same directory as this script.');
  process.exit(1);
}

console.log('✅ Fine-tuned model found at:', modelPath);

// 2. Create .env file if it doesn't exist
const envPath = './.env';
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `# AI Model Configuration
USE_TINYLLAMA=true

# Existing API keys (keep your current values)
GEMINI_API_KEY=your_gemini_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Database and other existing configs
# ... (add your existing environment variables here)
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created');
} else {
  console.log('📝 .env file already exists');
  // Check if USE_TINYLLAMA is set
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('USE_TINYLLAMA')) {
    console.log('➕ Adding USE_TINYLLAMA=true to .env file...');
    fs.appendFileSync(envPath, '\n# TinyLlama Configuration\nUSE_TINYLLAMA=true\n');
    console.log('✅ USE_TINYLLAMA added to .env file');
  } else {
    console.log('✅ USE_TINYLLAMA already configured in .env file');
  }
}

// 3. Install required dependencies
console.log('📦 Installing required dependencies...');
const { execSync } = require('child_process');

try {
  // Install @xenova/transformers for running models in Node.js
  execSync('npm install @xenova/transformers', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.log('❌ Failed to install dependencies:', error.message);
  console.log('💡 Please run: npm install @xenova/transformers');
}

// 4. Create a test script
const testScript = `#!/usr/bin/env node

/**
 * Test script for TinyLlama integration
 */

const TinyLlamaAI = require('./backend/services/tinyLlamaAI');

async function testTinyLlama() {
  console.log('🧪 Testing TinyLlama integration...');
  
  const model = new TinyLlamaAI();
  
  try {
    await model.initialize();
    console.log('✅ Model initialized successfully');
    
    const testPrompts = [
      "I'm feeling really stressed about my studies",
      "I'm having a panic attack right now",
      "I feel depressed and hopeless"
    ];
    
    for (const prompt of testPrompts) {
      console.log(\`\\n👤 User: \${prompt}\`);
      const response = await model.generateContent(prompt);
      console.log(\`🤖 AI: \${response.response.text()}\`);
      console.log('-'.repeat(50));
    }
    
    console.log('\\n🎉 TinyLlama integration test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTinyLlama();
`;

fs.writeFileSync('test_tinyllama.js', testScript);
console.log('✅ Test script created: test_tinyllama.js');

console.log('\n🎉 Setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Make sure your .env file has the correct API keys');
console.log('2. Run: node test_tinyllama.js (to test the integration)');
console.log('3. Start your backend server');
console.log('4. The system will automatically use TinyLlama when available');
console.log('\n💡 Note: The first time you run TinyLlama, it may take a few minutes to download and initialize the model.');
