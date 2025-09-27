// Simple test for crisis detection without database
const { analyzeCrisisLevel } = require('./backend/controllers/ai');

async function testCrisisDetection() {
  console.log('🧪 Testing Crisis Detection Logic\n');

  const testMessages = [
    'I want to kill myself',
    'I am thinking about suicide',
    'I feel hopeless and want to die',
    'I am going to hurt myself',
    'I am having a great day today',
    'I died laughing at that joke',
    'I need help right now',
    'I\'m in crisis',
    'I want to end it all'
  ];

  for (const message of testMessages) {
    const analysis = await analyzeCrisisLevel(message);
    console.log(`Message: "${message}"`);
    console.log(`  Level: ${analysis.level}, Type: ${analysis.type}, Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    console.log(`  Crisis Detected: ${analysis.level >= 3 ? 'YES' : 'NO'}\n`);
  }

  console.log('✅ Crisis detection test completed!');
}

// Run the test
testCrisisDetection().catch(console.error);