const { analyzeCrisisLevel, generateFallbackResponse } = require('./controllers/ai');

async function testCrisisLocal() {
  console.log('🧪 Testing Crisis Detection and Fallback Locally\n');

  // Test crisis detection
  console.log('1. Testing Crisis Detection:');
  const testMessages = [
    'I am suicidal',
    'I want to kill myself',
    'I\'m going to kill myself right now',
    'I am feeling hopeless',
    'I am having a great day'
  ];

  for (const message of testMessages) {
    const analysis = analyzeCrisisLevel(message);
    console.log(`   "${message}" -> Level: ${analysis.level}, Type: ${analysis.type}, Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
  }

  console.log('\n2. Testing Fallback Responses:');

  // Test fallback responses
  const fallbackTests = [
    'I am suicidal and need help',
    'I am feeling anxious about my exams',
    'I want to hurt myself',
    'I am having trouble sleeping'
  ];

  for (const message of fallbackTests) {
    const response = generateFallbackResponse(message);
    console.log(`   "${message}" -> ${response.substring(0, 80)}...`);
  }

  console.log('\n✅ Local testing completed successfully!');
}

testCrisisLocal();