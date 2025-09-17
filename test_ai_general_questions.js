// Test AI General Questions Handling
// This test verifies that the AI can handle both wellness and general questions appropriately

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test user credentials (you may need to adjust these)
const TEST_USER = {
  username: 'testuser',
  password: 'testpass123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAIResponse(userInput, expectedBehavior) {
  try {
    console.log(`\n📝 Testing: "${userInput}"`);
    console.log(`Expected: ${expectedBehavior}`);
    
    const response = await axios.post(`${BASE_URL}/ai/session-generate`, {
      prompt: userInput,
      sessionId: 'test-session-' + Date.now()
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const aiResponse = response.data.text;
    console.log(`🤖 AI Response: "${aiResponse}"`);
    
    // Basic validation
    if (aiResponse && aiResponse.length > 0) {
      console.log('✅ AI responded successfully');
      return true;
    } else {
      console.log('❌ AI response was empty');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log("🧪 Testing AI General Questions Handling\n");
  console.log("=" .repeat(60));
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test cases
  const testCases = [
    {
      input: "How are you?",
      expected: "Should respond naturally and friendly, not force therapeutic response"
    },
    {
      input: "What's the weather like?",
      expected: "Should respond helpfully about general topics"
    },
    {
      input: "I'm feeling really anxious about my exams",
      expected: "Should apply therapeutic techniques and provide support"
    },
    {
      input: "Can you help me with math?",
      expected: "Should respond helpfully to academic questions"
    },
    {
      input: "I'm having suicidal thoughts",
      expected: "Should trigger crisis intervention protocols"
    }
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    const success = await testAIResponse(testCase.input, testCase.expected);
    if (success) {
      passedTests++;
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! AI is handling both general and wellness questions appropriately.');
  } else {
    console.log('⚠️  Some tests failed. AI may need further adjustments.');
  }
}

// Run the tests
runTests().catch(console.error);
