// Test script for crisis detection logic (no database required)
const { analyzeCrisisLevel } = require('./controllers/ai');

async function testCrisisDetection() {
  console.log('🧪 Testing Crisis Detection Logic\n');
  
  const testCases = [
    // Critical Level 5
    { message: "I'm going to kill myself right now", expectedLevel: 5, description: "Immediate suicidal intent" },
    { message: "I have a plan to kill myself tonight", expectedLevel: 5, description: "Planned suicide" },
    { message: "I'm going to overdose right now", expectedLevel: 5, description: "Immediate overdose" },
    
    // High Level 4
    { message: "I want to kill myself", expectedLevel: 4, description: "Suicidal ideation" },
    { message: "I want to end my life", expectedLevel: 4, description: "Life ending desire" },
    { message: "I want to hurt myself", expectedLevel: 4, description: "Self-harm intent" },
    
    // Moderate-High Level 3
    { message: "I'm thinking about suicide", expectedLevel: 3, description: "Suicidal thoughts" },
    { message: "I wish I was dead", expectedLevel: 3, description: "Death wish" },
    { message: "I want to disappear", expectedLevel: 3, description: "Escape fantasy" },
    
    // Moderate Level 2
    { message: "I'm hopeless", expectedLevel: 2, description: "Hopelessness" },
    { message: "I can't cope anymore", expectedLevel: 2, description: "Coping failure" },
    { message: "I'm in crisis", expectedLevel: 2, description: "Crisis declaration" },
    
    // Harmless Level 0
    { message: "I died laughing at that joke", expectedLevel: 0, description: "Harmless humor" },
    { message: "I killed it at the presentation", expectedLevel: 0, description: "Success expression" },
    { message: "My phone died", expectedLevel: 0, description: "Metaphorical usage" },
    { message: "I'm having a great day", expectedLevel: 0, description: "Positive message" }
  ];
  
  let passed = 0;
  let failed = 0;
  
  console.log('Testing crisis detection patterns:\n');
  
  for (const testCase of testCases) {
    const analysis = await analyzeCrisisLevel(testCase.message);
    
    console.log(`Testing: "${testCase.message}"`);
    console.log(`Analysis result:`, analysis);
    
    if (!analysis || typeof analysis.level === 'undefined') {
      failed++;
      console.log(`❌ FAIL: Function returned undefined or invalid result`);
      console.log(`   Expected Level: ${testCase.expectedLevel}, Got: ${analysis?.level || 'undefined'}`);
    } else {
      const isCorrect = analysis.level === testCase.expectedLevel;
      
      if (isCorrect) {
        passed++;
        console.log(`✅ PASS: "${testCase.message}"`);
      } else {
        failed++;
        console.log(`❌ FAIL: "${testCase.message}"`);
        console.log(`   Expected Level: ${testCase.expectedLevel}, Got: ${analysis.level}`);
      }
      
      console.log(`   Description: ${testCase.description}`);
      console.log(`   Detected Level: ${analysis.level}, Type: ${analysis.type}, Confidence: ${analysis.confidence?.toFixed(2) || 'N/A'}`);
      console.log(`   Crisis Detected: ${analysis.level >= 3 ? 'YES' : 'NO'}\n`);
    }
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Crisis detection is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Crisis detection needs adjustment.');
  }
}

// Test intensity and urgency multipliers
async function testIntensityUrgency() {
  console.log('\n🧪 Testing Intensity and Urgency Multipliers\n');
  
  const baseMessage = "I want to die";
  const analysis = await analyzeCrisisLevel(baseMessage);
  console.log(`Base message: "${baseMessage}"`);
  console.log(`Base level: ${analysis.level}, Score: ${analysis.score.toFixed(2)}\n`);
  
  const intensityTests = [
    { message: "I really want to die", modifier: "really" },
    { message: "I so want to die", modifier: "so" },
    { message: "I very much want to die", modifier: "very" },
    { message: "I extremely want to die", modifier: "extremely" }
  ];
  
  for (const test of intensityTests) {
    const analysis = await analyzeCrisisLevel(test.message);
    console.log(`With "${test.modifier}": Level ${analysis.level}, Score: ${analysis.score.toFixed(2)}`);
  }
  
  console.log('\nUrgency tests:');
  const urgencyTests = [
    { message: "I want to die now", modifier: "now" },
    { message: "I want to die today", modifier: "today" },
    { message: "I want to die tonight", modifier: "tonight" },
    { message: "I want to die right now", modifier: "right now" }
  ];
  
  for (const test of urgencyTests) {
    const analysis = await analyzeCrisisLevel(test.message);
    console.log(`With "${test.modifier}": Level ${analysis.level}, Score: ${analysis.score.toFixed(2)}`);
  }
}

// Run the tests
async function runTests() {
  await testCrisisDetection();
  await testIntensityUrgency();
}

runTests();
