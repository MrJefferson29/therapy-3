const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const DeepseekAI = require("../services/deepseekAI");
const Llama2AI = require("../services/llama2AI");
const Ai = require("../models/ai");
const Session = require("../models/session");
const intents = require('../intents.json');
const User = require("../models/user");
const Appointment = require("../models/appointment");
const sendEmail = require("../utils/sendEmail");
const ENHANCED_THERAPIST_SYSTEM_PROMPT = require("../training_data/enhanced_therapist_prompt");

// Use the enhanced therapist system prompt for more directive, advice-giving responses
const THERAPIST_SYSTEM_PROMPT = ENHANCED_THERAPIST_SYSTEM_PROMPT;

// Initialize AI models
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAn0cFp4NCF9MGzRXT_hJUk62lycLdyrBY");
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 150, // Limit response length to ~100-150 words
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  },
});
const deepseekModel = new DeepseekAI(process.env.DEEPSEEK_API_KEY);

// Initialize Llama 2 model (primary model)
const llama2Model = new Llama2AI(
  process.env.HUGGINGFACE_API_KEY,
  process.env.LLAMA2_MODEL_URL || "your-username/therapy-llama2-7b" // Replace with your trained model
);

// Model selection strategy - Gemini is primary with enhanced therapist training, Llama 2 is fallback
const AI_MODELS = {
  GEMINI: 'gemini',  // Primary - enhanced therapist with directive responses
  LLAMA2: 'llama2',  // Fallback - custom trained model
  DEEPSEEK: 'deepseek'  // Last resort
};

function selectModel() {
  // Gemini is the primary model with enhanced therapist training
  return AI_MODELS.GEMINI;
}

async function generateWithModel(model, prompt) {
  try {
    let result;
    switch (model) {
      case AI_MODELS.GEMINI:
        result = await geminiModel.generateContent(prompt);
        break;
      case AI_MODELS.LLAMA2:
        result = await llama2Model.generateContent(prompt);
        break;
      case AI_MODELS.DEEPSEEK:
        result = await deepseekModel.generateContent(prompt);
        break;
      default:
        throw new Error('Invalid model selected');
    }
    return await result.response.text();
  } catch (error) {
    console.error(`Error with ${model}:`, error);

    // Fallback strategy: Gemini -> Llama2 -> DeepSeek
    if (model === AI_MODELS.GEMINI) {
      console.log('Trying backup model: Llama2');
      return generateWithModel(AI_MODELS.LLAMA2, prompt);
    } else if (model === AI_MODELS.LLAMA2) {
      console.log('Trying backup model: DeepSeek');
      return generateWithModel(AI_MODELS.DEEPSEEK, prompt);
    } else {
      // If DeepSeek also fails, throw the error
      throw error;
    }
  }
}

const startSession = async (req, res) => {
  try {
    const { mood } = req.body;
    if (typeof mood !== 'number' || mood < 1 || mood > 10) {
      return res.status(400).json({ error: 'Mood (1-10) is required to start a session.' });
    }
    const newSession = new Session({
      user: req.userId,
      mood,
      selectedModel: selectModel() // Store the selected model for the session
    });
    await newSession.save();
    res.json({ sessionId: newSession._id });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
};

const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findOne({ _id: sessionId, user: req.userId });
    if (!session) return res.status(404).json({ error: "Session not found" });
    session.terminated = true;
    await session.save();
    res.json({ message: "Session terminated" });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
};

const generateContent = async (req, res) => {
  try {
    const prompt = req.body.prompt;
    let { sessionId } = req.body;

    // If no sessionId, create a new session for the user
    let session;
    if (!sessionId) {
      session = new Session({
        user: req.userId,
        selectedModel: selectModel()
      });
      await session.save();
      sessionId = session._id;
    } else {
      session = await Session.findOne({ _id: sessionId, user: req.userId });
      if (!session) return res.status(404).json({ error: "Session not found" });
      if (session.terminated) return res.status(400).json({ error: "Session is terminated" });
    }

    // Check if session is terminated
    if (session.terminated) return res.status(400).json({ error: "Session is terminated" });

    // Fetch all previous messages for this session, ordered by creation time
    const previousMessages = await Ai.find({ session: sessionId }).sort({ createdAt: 1 });

    // Build the conversation history as a prompt
    let historyPrompt = '';
    previousMessages.forEach(msg => {
      historyPrompt += `User: ${msg.prompt}\nAI: ${msg.response}\n`;
    });

    // Build enhanced prompt with therapist system prompt
    const fullPrompt = `${THERAPIST_SYSTEM_PROMPT}

CONVERSATION HISTORY:
${historyPrompt}

User: ${prompt}

IMPORTANT: Keep your response CONCISE and INTERACTIVE. Aim for 2-4 sentences maximum. Focus on providing immediate comfort and one practical suggestion. Keep conversations flowing naturally by asking one thoughtful question at the end. Avoid long explanations - be direct and helpful.

AI:`;

    // Generate response using the selected model
    const selectedModel = session.selectedModel || selectModel();
    const generatedText = await generateWithModel(selectedModel, fullPrompt);

    if (generatedText) {
      const newAiEntry = new Ai({
        prompt: prompt,
        response: generatedText,
        session: sessionId,
        model: selectedModel // Store which model generated the response
      });
      await newAiEntry.save();
      res.json({
        text: generatedText,
        sessionId,
        model: selectedModel // Optionally inform the client which model was used
      });
    } else {
      res.status(500).json({ error: "AI response is empty" });
    }
  } catch (error) {
    console.error("Error generating AI content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
};

const selfCareHomeContent = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `
You are a wellness and self-care assistant for a mobile app. For the date ${today}, generate a JSON object with the following fields:

- quote: A short, original, motivational quote for the day (max 120 chars).
- focus: An object with:
    - tip: A single actionable self-care tip for today (1-2 sentences).
    - duration: The recommended time in seconds to spend on this focus (e.g. 300 for 5 minutes, 60 for 1 minute, etc.)
- article: An object with:
    - title: A catchy, positive article title (max 10 words)
    - summary: A 1-2 sentence summary of the article
    - icon: An appropriate Ionicons or MaterialCommunityIcons icon name (e.g. 'leaf-outline', 'book-outline', 'meditation', 'cloud-outline', etc.)
    - body: A 3-5 paragraph article body with practical advice and encouragement
    - links: An array of up to 3 relevant, reputable external links (with title and url)
    - related: An array of up to 3 related article titles (strings only)

Return ONLY the JSON object, no extra text or explanation.`;

    const result = await geminiModel.generateContent(prompt);
    const text = await result.response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        data = JSON.parse(match[0]);
      } else {
        throw new Error('AI did not return valid JSON');
      }
    }

    if (typeof data.focus === 'string') {
      data.focus = { tip: data.focus, duration: 300 };
    }
    if (!data.focus.duration) {
      data.focus.duration = 300;
    }
    res.json(data);
  } catch (error) {
    console.error('Error generating self-care home content:', error);
    res.status(500).json({ error: 'Failed to generate self-care home content' });
  }
};

module.exports = {
  generateContent,
  startSession,
  endSession,
  selfCareHomeContent
};