require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Import the enhanced functions
const { getIntentGuidance, buildEnhancedGeminiPrompt, THERAPIST_SYSTEM_PROMPT } = require('./controllers/ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Enhanced Gemini function with dynamic intent guidance
async function generateWithEnhancedGemini(prompt, intentContext = null) {
  try {
    // Extract user input from the full prompt
    const userInputMatch = prompt.match(/User: ([\s\S]*?)(?=AI:|$)/);
    const userInput = userInputMatch ? userInputMatch[1].trim() : prompt;

    // Get dynamic intent guidance (not exact matches)
    const guidance = getIntentGuidance(userInput);

    // Build enhanced prompt with guidance
    const enhancedPrompt = buildEnhancedGeminiPrompt(prompt, guidance);

    const result = await geminiModel.generateContent(enhancedPrompt);
    return result;
  } catch (error) {
    console.error('Enhanced Gemini error:', error);
    // Fallback to regular Gemini
    return await geminiModel.generateContent(prompt);
  }
}

async function testEnhancedGemini() {
  console.log('🧪 Testing Enhanced Gemini AI with Dynamic Intent Guidance\n');
  console.log('=' .repeat(70));

  // Test prompts covering different scenarios
  const testPrompts = [
    // Therapy-related for university students
    {
      category: "🎓 Academic Stress",
      prompt: "I'm feeling overwhelmed with my CGPA and upcoming exams. I can't sleep at night worrying about failing."
    },
    {
      category: "👨‍👩‍👧‍👦 Family Pressure",
      prompt: "My parents expect me to get straight A's but I'm struggling. I feel like I'm disappointing everyone."
    },
    {
      category: "😰 Anxiety & Depression",
      prompt: "I feel worthless and like nothing I do matters. I'm having trouble getting out of bed."
    },
    {
      category: "🤝 Social Isolation",
      prompt: "I don't have any friends at university. Everyone seems to have their groups but I feel left out."
    },

    // Study-related
    {
      category: "📚 Study Techniques",
      prompt: "How can I study more effectively? I read my notes but forget everything during exams."
    },
    {
      category: "⏰ Time Management",
      prompt: "I have so many assignments due but I keep procrastinating. How can I manage my time better?"
    },
    {
      category: "💰 Financial Stress",
      prompt: "I'm working part-time while studying but still can't afford my textbooks and food."
    },

    // Completely irrelevant topics
    {
      category: "🍕 Random - Food",
      prompt: "What's the best pizza topping combination?"
    },
    {
      category: "⚽ Random - Sports",
      prompt: "Who do you think will win the next World Cup?"
    },
    {
      category: "🎬 Random - Entertainment",
      prompt: "Can you recommend some good movies about artificial intelligence?"
    },
    {
      category: "🛠️ Random - Technical",
      prompt: "How do I fix a leaky faucet?"
    }
  ];

  for (let i = 0; i < testPrompts.length; i++) {
    const testCase = testPrompts[i];
    console.log(`\n${i + 1}. ${testCase.category}`);
    console.log(`Prompt: "${testCase.prompt}"`);

    try {
      // Get intent guidance for this prompt
      const guidance = getIntentGuidance(testCase.prompt);
      console.log(`Intent Context: ${guidance.context}`);
      console.log(`Therapeutic Focus: ${guidance.therapeuticFocus}`);

      // Format as therapy prompt
      const therapyPrompt = `${THERAPIST_SYSTEM_PROMPT}\n\nUser: ${testCase.prompt}\nAI:`;

      // Generate response
      const result = await generateWithEnhancedGemini(therapyPrompt);
      const response = await result.response.text();

      console.log(`Response: ${response.substring(0, 200)}...`);
      console.log('-'.repeat(50));

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Error with prompt ${i + 1}:`, error.message);
    }
  }

  console.log('\n🎉 Enhanced Gemini Testing Complete!');
  console.log('\n📊 Analysis:');
  console.log('- Therapy prompts should show contextual understanding and therapeutic guidance');
  console.log('- Study prompts should provide practical advice with emotional support');
  console.log('- Irrelevant prompts should receive friendly, helpful responses');
  console.log('- Responses should vary even for similar topics (no exact duplicates)');
}

testEnhancedGemini().catch(console.error);