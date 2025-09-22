require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ENHANCED_THERAPIST_SYSTEM_PROMPT = require("./training_data/enhanced_therapist_prompt");

// Initialize Gemini with enhanced therapist prompt
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAn0cFp4NCF9MGzRXT_hJUk62lycLdyrBY");
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: ENHANCED_THERAPIST_SYSTEM_PROMPT
});

// Test prompts covering different categories
const testPrompts = {
  mental_health: [
    "I'm feeling really anxious about my upcoming exams. My heart races and I can't sleep.",
    "I've been feeling depressed for weeks. Nothing interests me anymore and I just want to stay in bed.",
    "I think I have social anxiety. I'm terrified of talking to new people and avoid social situations.",
    "I'm having panic attacks. My chest hurts, I can't breathe, and I feel like I'm dying.",
    "I feel worthless and like I'm not good enough for anything. I hate myself.",
    "I'm struggling with self-harm urges. I know it's not healthy but it helps me feel something."
  ],

  financial: [
    "I'm broke and can't afford my textbooks or food. I'm working part-time but it's not enough.",
    "How do I create a budget as a student? I keep overspending on unnecessary things.",
    "I'm in debt from student loans. How do I manage this stress?",
    "I need to find scholarships or financial aid. Where should I start looking?",
    "My parents can't help me financially anymore. How do I become independent?"
  ],

  academic: [
    "I'm failing my courses and don't know what to do. I study but nothing sticks.",
    "I have so much coursework I feel overwhelmed. How do I manage my time better?",
    "My CGPA is dropping and my parents will be disappointed. I'm scared.",
    "I can't focus on studying. My mind wanders and I get distracted easily.",
    "I'm struggling with a particular subject. Should I drop it or keep trying?",
    "I have writer's block for my assignments. How do I overcome this?"
  ],

  vague: [
    "I don't know what's wrong with me. I just feel off.",
    "Everything feels hard right now. I don't know why.",
    "I'm not sure what I need help with. Things just feel wrong.",
    "I feel lost and confused about everything.",
    "Something's bothering me but I can't explain it.",
    "I just need someone to talk to. I feel alone."
  ]
};

async function testGeminiWithPrompt(prompt, category, index) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST ${index + 1}: ${category.toUpperCase()} - ${prompt.substring(0, 50)}...`);
    console.log(`${'='.repeat(60)}`);

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response.text();

    console.log(`\n🤖 GEMINI RESPONSE:`);
    console.log(`${'-'.repeat(40)}`);
    console.log(response);
    console.log(`${'-'.repeat(40)}`);

    return { success: true, response, category, prompt };

  } catch (error) {
    console.error(`❌ Error testing prompt: ${error.message}`);
    return { success: false, error: error.message, category, prompt };
  }
}

async function runComprehensiveTest() {
  console.log(`🚀 TESTING ENHANCED GEMINI MODEL WITH THERAPIST TRAINING`);
  console.log(`📋 System Prompt: ${ENHANCED_THERAPIST_SYSTEM_PROMPT.length} characters`);
  console.log(`🎯 Model: Gemini 1.5 Flash with Enhanced Therapist Training`);
  console.log(`\n${'='.repeat(80)}`);

  const results = {
    mental_health: [],
    financial: [],
    academic: [],
    vague: []
  };

  let totalTests = 0;
  let successfulTests = 0;

  // Test each category
  for (const [category, prompts] of Object.entries(testPrompts)) {
    console.log(`\n📂 TESTING CATEGORY: ${category.toUpperCase()}`);
    console.log(`${'='.repeat(50)}`);

    for (let i = 0; i < prompts.length; i++) {
      const result = await testGeminiWithPrompt(prompts[i], category, i);
      results[category].push(result);

      totalTests++;
      if (result.success) successfulTests++;

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Successful: ${successfulTests}`);
  console.log(`Failed: ${totalTests - successfulTests}`);
  console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);

  console.log(`\n📈 RESULTS BY CATEGORY:`);
  for (const [category, categoryResults] of Object.entries(results)) {
    const successCount = categoryResults.filter(r => r.success).length;
    console.log(`  ${category}: ${successCount}/${categoryResults.length} successful`);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ ENHANCED GEMINI TESTING COMPLETE`);
  console.log(`${'='.repeat(80)}`);

  return results;
}

// Run test if called directly
if (require.main === module) {
  runComprehensiveTest()
    .then(() => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTest, testGeminiWithPrompt };