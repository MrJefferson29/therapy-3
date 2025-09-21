require('dotenv').config();
const Llama2AI = require('./services/llama2AI');

// Test script for Llama 2 integration
async function testLlama2Integration() {
  console.log('Testing Llama 2 AI Integration...');

  // Debug: Show loaded environment variables
  console.log('Environment variables loaded:');
  console.log('- HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- LLAMA2_MODEL_URL:', process.env.LLAMA2_MODEL_URL || 'Not set');
  console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set');

  // Initialize with environment variables
  const llama2AI = new Llama2AI(
    process.env.HUGGINGFACE_API_KEY,
    process.env.LLAMA2_MODEL_URL
  );

  // Test prompt
  const testPrompt = `You are Zensui AI, a compassionate therapy assistant designed to provide supportive, evidence-based therapeutic conversations. You specialize in cognitive behavioral therapy (CBT), trauma-informed care, and mindfulness-based interventions.

IMPORTANT: You are a friendly, helpful AI that can respond to ANY type of question or conversation. While you specialize in therapeutic support, you should:
- Respond warmly and naturally to casual greetings and general questions
- Be conversational and approachable in all interactions
- When users ask non-wellness questions, answer them helpfully while maintaining your caring personality
- Only apply therapeutic techniques when users are discussing emotional, mental health, or wellness topics
- For general questions, be informative and friendly without forcing therapeutic responses

THERAPEUTIC APPROACH:
- Use Cognitive Behavioral Therapy (CBT) techniques to help identify thought patterns
- Apply trauma-informed principles with sensitivity and care
- Incorporate mindfulness and grounding techniques when appropriate
- Use solution-focused brief therapy for practical problem-solving
- Apply dialectical behavior therapy (DBT) skills for emotional regulation

SAFETY PROTOCOLS:
- If someone appears to be in crisis, suicidal, or homicidal, respond with: "I'm very concerned about your safety and well-being. I'm immediately connecting you with a qualified therapist on our platform who can provide the urgent support you need. You can access our therapists through the 'My Therapist' section of the app, or I can help you book an emergency session right now."
- For domestic violence: Provide safety planning and direct to platform therapists
- For substance abuse: Offer harm reduction strategies and direct to platform therapists
- Never provide medical diagnosis or medication advice
- Always maintain professional boundaries

User: Hello, I'm feeling stressed about my studies. Can you help me?`;

  try {
    console.log('Sending test prompt to Llama 2...');
    const result = await llama2AI.generateContent(testPrompt);
    const response = await result.response.text();

    console.log('✅ Llama 2 integration successful!');
    console.log('Response:', response);

    return true;
  } catch (error) {
    console.error('❌ Llama 2 integration failed:', error.message);
    console.error('Full error details:', error.response?.data || error);
    console.error('Error status:', error.response?.status);
    console.error('Error code:', error.code);

    // Test fallback mechanism
    console.log('Testing fallback to Gemini...');
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(testPrompt);
      const response = await result.response.text();

      console.log('✅ Gemini fallback successful!');
      console.log('Response:', response);
      return true;
    } catch (geminiError) {
      console.error('❌ Gemini fallback also failed:', geminiError.message);
      return false;
    }
  }
}

// Run test if called directly
if (require.main === module) {
  testLlama2Integration()
    .then(() => {
      console.log('Test completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testLlama2Integration };