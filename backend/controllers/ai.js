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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_NEW_API_KEY_HERE");
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
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
  process.env.LLAMA2_MODEL_URL || "meta-llama/Llama-2-7b-chat-hf" // Use working Llama2 model
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

// Crisis detection function
const isSeverelyUnstable = (input) => {
  const normalized = input.toLowerCase();
  
  // Define context patterns that indicate harmless usage
  const harmlessPatterns = [
    // Laughter and humor
    /died (laughing|of laughter|when|from)/i,
    /dying (laughing|of laughter|from|when)/i,
    /killed (me|us|it)/i,
    /killing (me|us|it)/i,
    
    // Exaggeration and hyperbole
    /died (of|from) (boredom|embarrassment|shame|excitement)/i,
    /dying (of|from) (boredom|embarrassment|shame|excitement)/i,
    /want to die (of|from)/i,
    
    // Gaming and entertainment
    /died (in|at|during) (game|level|battle|fight)/i,
    /killed (in|at|during) (game|level|battle|fight)/i,
    
    // Physical activities
    /died (during|in|at) (workout|exercise|running|gym)/i,
    /killing (it|them) (at|in|during)/i,
    
    // Success and achievement
    /killed (it|them|that)/i,
    /killing (it|them|that)/i,
    
    // Food and eating
    /died (for|over) (food|pizza|chocolate)/i,
    /dying (for|over) (food|pizza|chocolate)/i,
    
    // Social media and internet
    /died (on|at|from) (social media|internet|tiktok)/i,
    /dying (on|at|from) (social media|internet|tiktok)/i,
    
    // Common harmless expressions
    /(almost|nearly) died/i,
    /(almost|nearly) killed/i,
    /thought i was going to die/i,
    /felt like i was dying/i,
    
    // Past tense harmless usage
    /i died (when|after|because)/i,
    /i killed (it|them|that)/i,
    
    // Metaphorical usage
    /(my|the) phone died/i,
    /(my|the) battery died/i,
    /(my|the) car died/i,
    /(my|the) wifi died/i,
    
    // Time expressions
    /died (yesterday|today|last week|this morning)/i,
    /killed (yesterday|today|last week|this morning)/i
  ];
  
  // Check for harmless patterns first
  for (const pattern of harmlessPatterns) {
    if (pattern.test(normalized)) {
      return false; // This is harmless usage
    }
  }

  const crisisPatterns = [
    // Suicidal ideation - specific and direct
    /i want to die/i,
    /i want to kill myself/i,
    /i want to end my life/i,
    /i want to commit suicide/i,
    /i'm going to kill myself/i,
    /i'm going to end it all/i,
    /i'm going to commit suicide/i,
    /i plan to kill myself/i,
    /i plan to end my life/i,
    /i'm thinking about suicide/i,
    /i'm thinking about killing myself/i,
    /i'm considering suicide/i,
    /i'm considering killing myself/i,
    /suicide is the only way/i,
    /killing myself is the only way/i,
    /ending my life is the only way/i,
    /i have no reason to live/i,
    /i don't want to live anymore/i,
    /i wish i was dead/i,
    /i wish i could die/i,
    /i hope i die/i,
    /i want to be dead/i,
    /i want to disappear/i,
    /i want to vanish/i,
    /i want to cease to exist/i,
    
    // Self-harm - specific and direct
    /i want to hurt myself/i,
    /i want to cut myself/i,
    /i want to harm myself/i,
    /i'm going to hurt myself/i,
    /i'm going to cut myself/i,
    /i'm going to harm myself/i,
    /i plan to hurt myself/i,
    /i plan to cut myself/i,
    /i plan to harm myself/i,
    /i'm thinking about hurting myself/i,
    /i'm thinking about cutting myself/i,
    /i'm thinking about harming myself/i,
    /i'm considering hurting myself/i,
    /i'm considering cutting myself/i,
    /i'm considering harming myself/i,
    /i need to hurt myself/i,
    /i need to cut myself/i,
    /i need to harm myself/i,
    /hurting myself is the only way/i,
    /cutting myself is the only way/i,
    /harming myself is the only way/i,
    
    // Overdose and substance abuse - specific and direct
    /i want to overdose/i,
    /i want to take too many pills/i,
    /i want to poison myself/i,
    /i'm going to overdose/i,
    /i'm going to take too many pills/i,
    /i'm going to poison myself/i,
    /i plan to overdose/i,
    /i plan to take too many pills/i,
    /i plan to poison myself/i,
    /i'm thinking about overdosing/i,
    /i'm thinking about taking too many pills/i,
    /i'm thinking about poisoning myself/i,
    /i'm considering overdosing/i,
    /i'm considering taking too many pills/i,
    /i'm considering poisoning myself/i,
    /i need to overdose/i,
    /i need to take too many pills/i,
    /i need to poison myself/i,
    /overdosing is the only way/i,
    /taking too many pills is the only way/i,
    /poisoning myself is the only way/i,
    
    // Trauma and abuse - specific and direct
    /i was raped/i,
    /i was sexually assaulted/i,
    /i was physically abused/i,
    /i was emotionally abused/i,
    /i was verbally abused/i,
    /i was psychologically abused/i,
    /i was molested/i,
    /i was assaulted/i,
    /i was molested/i,
    /i was abused/i,
    /i was in an accident/i,
    /i was in combat/i,
    /i was in a disaster/i,
    /i'm having flashbacks/i,
    /i'm having nightmares/i,
    /i have ptsd/i,
    /i have post traumatic stress/i,
    
    // Crisis and emergency - specific and direct
    /i'm in crisis/i,
    /i'm having an emergency/i,
    /i need immediate help/i,
    /i need urgent help/i,
    /i need help now/i,
    /i can't cope anymore/i,
    /i can't handle this anymore/i,
    /i'm helpless/i,
    /i'm hopeless/i,
    /i'm worthless/i,
    /i'm depressed to death/i
  ];
  
  // Check for crisis patterns
  for (const pattern of crisisPatterns) {
    if (pattern.test(normalized)) {
      return true; // This is a genuine crisis
    }
  }
  
  // Additional context check for ambiguous words
  const ambiguousWords = ['die', 'died', 'dying', 'kill', 'killed', 'killing', 'suicide', 'overdose'];
  const foundAmbiguous = ambiguousWords.filter(word => normalized.includes(word));
  
  if (foundAmbiguous.length > 0) {
    // Check if these words are used in a concerning context
    const concerningContexts = [
      /i (want|wish|plan|going to) (die|kill)/i,
      /i (want|wish|plan|going to) (myself|my life)/i,
      /(die|kill) (myself|my life)/i,
      /(suicide|overdose) (attempt|plan|thought)/i,
      /(attempt|plan|thought) (suicide|overdose)/i
    ];
    
    for (const context of concerningContexts) {
      if (context.test(normalized)) {
        return true; // This is concerning
      }
    }
  }
  
  return false; // No crisis detected
};

// Function to find available therapists without sessions in the next hour
const findAvailableTherapist = async () => {
  try {
    const User = require('../models/user');
    const Appointment = require('../models/appointment');
    
    // Get current time and one hour from now
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Find all therapists
    const therapists = await User.find({ role: 'therapist' });
    
    // Find therapists who don't have appointments in the next hour
    const availableTherapists = [];
    
    for (const therapist of therapists) {
      const hasUpcomingSession = await Appointment.findOne({
        therapist: therapist._id,
        status: { $in: ['pending', 'approved'] },
        scheduledTime: { $gte: now, $lte: oneHourFromNow }
      });
      
      if (!hasUpcomingSession) {
        availableTherapists.push(therapist);
      }
    }
    
    // Return the first available therapist, or null if none available
    return availableTherapists.length > 0 ? availableTherapists[0] : null;
  } catch (error) {
    console.error('Error finding available therapist:', error);
    return null;
  }
};

// Function to automatically book a crisis session
const bookCrisisSession = async (userId, therapistId) => {
  try {
    const Appointment = require('../models/appointment');
    const Chat = require('../models/chat');
    
    // Schedule the session for 30 minutes from now
    const scheduledTime = new Date(Date.now() + 30 * 60 * 1000);
    
    const appointment = new Appointment({
      title: 'Crisis Support Session',
      description: 'Automatically scheduled crisis support session. User is experiencing a mental health crisis and needs immediate professional support.',
      scheduledTime: scheduledTime,
      therapist: therapistId,
      client: userId,
      status: 'approved', // Auto-approve crisis sessions
      notes: 'Crisis session - automatically scheduled due to detected mental health crisis'
    });
    
    await appointment.save();
    
    // Create a chat message notification
    const roomId = [userId, therapistId].sort().join('_');
    const notificationMessage = `🚨 CRISIS ALERT: A crisis support session has been automatically scheduled for ${scheduledTime.toLocaleString()}. Please respond immediately.`;
    
    const chatMessage = new Chat({
      roomId,
      userId: therapistId,
      message: notificationMessage,
      timestamp: new Date(),
      isSystemMessage: true
    });
    
    await chatMessage.save();
    
    return appointment;
  } catch (error) {
    console.error('Error booking crisis session:', error);
    return null;
  }
};

const generateContent = async (req, res) => {
  try {
    const prompt = req.body.prompt;
    let { sessionId } = req.body;

    // Check for crisis in the user's message
    const isCrisis = isSeverelyUnstable(prompt);
    
    if (isCrisis) {
      console.log('🚨 CRISIS DETECTED:', prompt);
      
      // Find an available therapist
      const availableTherapist = await findAvailableTherapist();
      
      if (availableTherapist) {
        // Book a crisis session
        const crisisAppointment = await bookCrisisSession(req.userId, availableTherapist._id);
        
        if (crisisAppointment) {
          console.log('✅ Crisis session booked with therapist:', availableTherapist.username);
          
          // Return crisis response with session info
          const crisisResponse = `I'm deeply concerned about what you're sharing. Your safety is my top priority. I've immediately connected you with a professional therapist who will be available within 30 minutes. Please stay safe and know that help is on the way. You're not alone in this.`;
          
          // Save the crisis interaction
          const newAiEntry = new Ai({
            prompt: prompt,
            response: crisisResponse,
            session: sessionId,
            isCrisis: true
          });
          await newAiEntry.save();
          
          return res.json({ 
            text: crisisResponse,
            sessionId: sessionId,
            crisisDetected: true,
            therapistAssigned: availableTherapist.username,
            appointmentScheduled: crisisAppointment.scheduledTime
          });
        }
      }
      
      // If no therapist available, still provide crisis response
      const crisisResponse = `I'm deeply concerned about what you're sharing. Your safety is my top priority. Please reach out to a crisis helpline immediately: National Suicide Prevention Lifeline: 988. You're not alone, and help is available right now.`;
      
      const newAiEntry = new Ai({
        prompt: prompt,
        response: crisisResponse,
        session: sessionId,
        isCrisis: true
      });
      await newAiEntry.save();
      
      return res.json({ 
        text: crisisResponse,
        sessionId: sessionId,
        crisisDetected: true,
        therapistAssigned: null
      });
    }

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