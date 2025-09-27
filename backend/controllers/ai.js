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

// Advanced crisis detection with AI-powered analysis
const analyzeCrisisLevel = async (input, conversationHistory = []) => {
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
      return { level: 0, type: 'harmless', confidence: 0.95 };
    }
  }

  // Advanced crisis patterns with severity levels
  const crisisPatterns = [
    // CRITICAL LEVEL (Level 5) - Immediate danger
    { pattern: /i'm going to kill myself (right now|tonight|today)/i, level: 5, type: 'suicidal_immediate', confidence: 0.98 },
    { pattern: /i have a plan to kill myself/i, level: 5, type: 'suicidal_planned', confidence: 0.95 },
    { pattern: /i'm going to overdose (right now|tonight|today)/i, level: 5, type: 'overdose_immediate', confidence: 0.95 },
    { pattern: /i have pills ready to take/i, level: 5, type: 'overdose_planned', confidence: 0.90 },
    { pattern: /i'm cutting myself right now/i, level: 5, type: 'selfharm_active', confidence: 0.90 },
    { pattern: /i'm bleeding and won't stop/i, level: 5, type: 'selfharm_medical', confidence: 0.95 },
    
    // HIGH LEVEL (Level 4) - Serious risk
    { pattern: /i want to kill myself/i, level: 4, type: 'suicidal_ideation', confidence: 0.90 },
    { pattern: /i want to end my life/i, level: 4, type: 'suicidal_ideation', confidence: 0.90 },
    { pattern: /i want to commit suicide/i, level: 4, type: 'suicidal_ideation', confidence: 0.90 },
    { pattern: /i'm going to kill myself/i, level: 4, type: 'suicidal_intent', confidence: 0.85 },
    { pattern: /i'm going to end it all/i, level: 4, type: 'suicidal_intent', confidence: 0.85 },
    { pattern: /i plan to kill myself/i, level: 4, type: 'suicidal_planned', confidence: 0.85 },
    { pattern: /i plan to end my life/i, level: 4, type: 'suicidal_planned', confidence: 0.85 },
    { pattern: /suicide is the only way/i, level: 4, type: 'suicidal_desperate', confidence: 0.80 },
    { pattern: /killing myself is the only way/i, level: 4, type: 'suicidal_desperate', confidence: 0.80 },
    { pattern: /ending my life is the only way/i, level: 4, type: 'suicidal_desperate', confidence: 0.80 },
    { pattern: /i want to overdose/i, level: 4, type: 'overdose_intent', confidence: 0.85 },
    { pattern: /i want to take too many pills/i, level: 4, type: 'overdose_intent', confidence: 0.85 },
    { pattern: /i want to poison myself/i, level: 4, type: 'overdose_intent', confidence: 0.85 },
    { pattern: /i want to hurt myself/i, level: 4, type: 'selfharm_intent', confidence: 0.80 },
    { pattern: /i want to cut myself/i, level: 4, type: 'selfharm_intent', confidence: 0.80 },
    { pattern: /i want to harm myself/i, level: 4, type: 'selfharm_intent', confidence: 0.80 },
    
    // MODERATE-HIGH LEVEL (Level 3) - Concerning thoughts
    { pattern: /i'm thinking about suicide/i, level: 3, type: 'suicidal_thoughts', confidence: 0.75 },
    { pattern: /i'm thinking about killing myself/i, level: 3, type: 'suicidal_thoughts', confidence: 0.75 },
    { pattern: /i'm considering suicide/i, level: 3, type: 'suicidal_consideration', confidence: 0.70 },
    { pattern: /i'm considering killing myself/i, level: 3, type: 'suicidal_consideration', confidence: 0.70 },
    { pattern: /i have no reason to live/i, level: 3, type: 'hopelessness', confidence: 0.70 },
    { pattern: /i don't want to live anymore/i, level: 3, type: 'hopelessness', confidence: 0.70 },
    { pattern: /i wish i was dead/i, level: 3, type: 'death_wish', confidence: 0.65 },
    { pattern: /i wish i could die/i, level: 3, type: 'death_wish', confidence: 0.65 },
    { pattern: /i hope i die/i, level: 3, type: 'death_wish', confidence: 0.65 },
    { pattern: /i want to be dead/i, level: 3, type: 'death_wish', confidence: 0.65 },
    { pattern: /i want to disappear/i, level: 3, type: 'escape_fantasy', confidence: 0.60 },
    { pattern: /i want to vanish/i, level: 3, type: 'escape_fantasy', confidence: 0.60 },
    { pattern: /i want to cease to exist/i, level: 3, type: 'escape_fantasy', confidence: 0.60 },
    { pattern: /i'm thinking about hurting myself/i, level: 3, type: 'selfharm_thoughts', confidence: 0.70 },
    { pattern: /i'm thinking about cutting myself/i, level: 3, type: 'selfharm_thoughts', confidence: 0.70 },
    { pattern: /i'm thinking about harming myself/i, level: 3, type: 'selfharm_thoughts', confidence: 0.70 },
    { pattern: /i'm considering hurting myself/i, level: 3, type: 'selfharm_consideration', confidence: 0.65 },
    { pattern: /i'm considering cutting myself/i, level: 3, type: 'selfharm_consideration', confidence: 0.65 },
    { pattern: /i'm considering harming myself/i, level: 3, type: 'selfharm_consideration', confidence: 0.65 },
    { pattern: /i'm thinking about overdosing/i, level: 3, type: 'overdose_thoughts', confidence: 0.70 },
    { pattern: /i'm thinking about taking too many pills/i, level: 3, type: 'overdose_thoughts', confidence: 0.70 },
    { pattern: /i'm thinking about poisoning myself/i, level: 3, type: 'overdose_thoughts', confidence: 0.70 },
    
    // MODERATE LEVEL (Level 2) - Warning signs
    { pattern: /i'm helpless/i, level: 2, type: 'helplessness', confidence: 0.60 },
    { pattern: /i'm hopeless/i, level: 2, type: 'hopelessness', confidence: 0.60 },
    { pattern: /i'm worthless/i, level: 2, type: 'worthlessness', confidence: 0.60 },
    { pattern: /i can't cope anymore/i, level: 2, type: 'coping_failure', confidence: 0.65 },
    { pattern: /i can't handle this anymore/i, level: 2, type: 'overwhelmed', confidence: 0.65 },
    { pattern: /i'm in crisis/i, level: 2, type: 'crisis_declaration', confidence: 0.70 },
    { pattern: /i'm having an emergency/i, level: 2, type: 'emergency_declaration', confidence: 0.70 },
    { pattern: /i need immediate help/i, level: 2, type: 'urgent_help_request', confidence: 0.75 },
    { pattern: /i need urgent help/i, level: 2, type: 'urgent_help_request', confidence: 0.75 },
    { pattern: /i need help now/i, level: 2, type: 'urgent_help_request', confidence: 0.75 },
    { pattern: /i'm depressed to death/i, level: 2, type: 'severe_depression', confidence: 0.70 },
    
    // TRAUMA AND ABUSE (Level 3-4)
    { pattern: /i was raped/i, level: 4, type: 'sexual_assault', confidence: 0.90 },
    { pattern: /i was sexually assaulted/i, level: 4, type: 'sexual_assault', confidence: 0.90 },
    { pattern: /i was physically abused/i, level: 3, type: 'physical_abuse', confidence: 0.80 },
    { pattern: /i was emotionally abused/i, level: 3, type: 'emotional_abuse', confidence: 0.75 },
    { pattern: /i was verbally abused/i, level: 3, type: 'verbal_abuse', confidence: 0.75 },
    { pattern: /i was psychologically abused/i, level: 3, type: 'psychological_abuse', confidence: 0.75 },
    { pattern: /i was molested/i, level: 4, type: 'sexual_abuse', confidence: 0.90 },
    { pattern: /i was assaulted/i, level: 3, type: 'physical_assault', confidence: 0.80 },
    { pattern: /i was abused/i, level: 3, type: 'general_abuse', confidence: 0.75 },
    { pattern: /i'm having flashbacks/i, level: 3, type: 'ptsd_symptoms', confidence: 0.70 },
    { pattern: /i'm having nightmares/i, level: 2, type: 'ptsd_symptoms', confidence: 0.60 },
    { pattern: /i have ptsd/i, level: 2, type: 'ptsd_diagnosis', confidence: 0.65 },
    { pattern: /i have post traumatic stress/i, level: 2, type: 'ptsd_diagnosis', confidence: 0.65 }
  ];
  
  // Check for crisis patterns and calculate weighted score
  let maxLevel = 0;
  let crisisType = 'none';
  let confidence = 0;
  let matchedPatterns = [];
  
  for (const { pattern, level, type, confidence: patternConfidence } of crisisPatterns) {
    if (pattern.test(normalized)) {
      matchedPatterns.push({ level, type, confidence: patternConfidence });
      if (level > maxLevel) {
        maxLevel = level;
        crisisType = type;
        confidence = patternConfidence;
      }
    }
  }
  
  // Contextual analysis - check conversation history for escalation
  let escalationScore = 0;
  if (conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-5); // Last 5 messages
    const negativeEmotions = ['sad', 'depressed', 'anxious', 'angry', 'frustrated', 'hopeless', 'worthless'];
    const crisisWords = ['die', 'kill', 'hurt', 'end', 'suicide', 'overdose', 'crisis'];
    
    for (const msg of recentMessages) {
      const msgText = msg.toLowerCase();
      const negativeCount = negativeEmotions.filter(emotion => msgText.includes(emotion)).length;
      const crisisCount = crisisWords.filter(word => msgText.includes(word)).length;
      escalationScore += (negativeCount * 0.1) + (crisisCount * 0.2);
    }
  }
  
  // Sentiment analysis using keyword scoring
  const negativeKeywords = {
    'die': 0.8, 'death': 0.7, 'kill': 0.8, 'suicide': 0.9, 'overdose': 0.8,
    'hurt': 0.6, 'harm': 0.6, 'cut': 0.7, 'bleed': 0.8, 'pain': 0.5,
    'hopeless': 0.6, 'worthless': 0.6, 'helpless': 0.6, 'desperate': 0.7,
    'crisis': 0.7, 'emergency': 0.7, 'urgent': 0.6, 'immediate': 0.6,
    'end': 0.5, 'stop': 0.4, 'quit': 0.4, 'give up': 0.6
  };
  
  let sentimentScore = 0;
  for (const [keyword, weight] of Object.entries(negativeKeywords)) {
    if (normalized.includes(keyword)) {
      sentimentScore += weight;
    }
  }
  
  // Intensity indicators
  const intensityWords = ['really', 'so', 'very', 'extremely', 'completely', 'totally', 'absolutely'];
  let intensityMultiplier = 1;
  for (const word of intensityWords) {
    if (normalized.includes(word)) {
      intensityMultiplier += 0.2;
    }
  }
  
  // Time urgency indicators
  const urgencyWords = ['now', 'today', 'tonight', 'right now', 'immediately', 'asap'];
  let urgencyMultiplier = 1;
  for (const word of urgencyWords) {
    if (normalized.includes(word)) {
      urgencyMultiplier += 0.3;
    }
  }
  
  // Calculate final crisis score
  const baseScore = maxLevel;
  const contextualScore = escalationScore * 0.5;
  const sentimentScoreNormalized = Math.min(sentimentScore / 3, 2); // Cap at 2
  const finalScore = (baseScore + contextualScore + sentimentScoreNormalized) * intensityMultiplier * urgencyMultiplier;
  
  // Determine crisis level
  let crisisLevel = 0;
  if (finalScore >= 4.5) crisisLevel = 5; // Critical
  else if (finalScore >= 3.5) crisisLevel = 4; // High
  else if (finalScore >= 2.5) crisisLevel = 3; // Moderate-High
  else if (finalScore >= 1.5) crisisLevel = 2; // Moderate
  else if (finalScore >= 0.8) crisisLevel = 1; // Low
  
  return {
    level: crisisLevel,
    type: crisisType,
    confidence: Math.min(confidence + (finalScore * 0.1), 0.95),
    score: finalScore,
    escalationScore,
    sentimentScore,
    matchedPatterns,
    intensityMultiplier,
    urgencyMultiplier
  };
};

// Legacy function for backward compatibility
const isSeverelyUnstable = (input) => {
  const analysis = analyzeCrisisLevel(input);
  return analysis.level >= 3; // Moderate-High level or above
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
const bookCrisisSession = async (userId, therapistId, urgencyMinutes = 30, crisisAnalysis = null) => {
  try {
    const Appointment = require('../models/appointment');
    const Chat = require('../models/chat');
    
    // Schedule the session based on urgency
    const scheduledTime = new Date(Date.now() + urgencyMinutes * 60 * 1000);
    
    const appointment = new Appointment({
      title: 'Crisis Support Session',
      description: `Automatically scheduled crisis support session. User is experiencing a mental health crisis (Level ${crisisAnalysis?.level || 'Unknown'}) and needs immediate professional support.`,
      scheduledTime: scheduledTime,
      therapist: therapistId,
      client: userId,
      status: 'approved', // Auto-approve crisis sessions
      notes: `Crisis session - automatically scheduled due to detected mental health crisis. Level: ${crisisAnalysis?.level || 'Unknown'}, Type: ${crisisAnalysis?.type || 'Unknown'}, Confidence: ${crisisAnalysis?.confidence || 'Unknown'}`
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

// Function to send crisis email notification
const sendCrisisEmailNotification = async (therapist, userId, crisisAnalysis, appointment) => {
  try {
    const sendEmail = require('../utils/sendEmail');
    const User = require('../models/user');
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for crisis notification');
      return;
    }
    
    // Determine urgency level
    const urgencyLevel = crisisAnalysis.level >= 5 ? 'CRITICAL' : 
                        crisisAnalysis.level >= 4 ? 'HIGH' : 
                        crisisAnalysis.level >= 3 ? 'MODERATE' : 'LOW';
    
    // Create email content
    const subject = `🚨 ${urgencyLevel} CRISIS ALERT - Immediate Action Required`;
    const text = `
URGENT CRISIS NOTIFICATION

A user has been detected as experiencing a mental health crisis and has been automatically assigned to you for immediate support.

CRISIS DETAILS:
- Crisis Level: ${crisisAnalysis.level}/5 (${urgencyLevel})
- Crisis Type: ${crisisAnalysis.type}
- Confidence Score: ${Math.round(crisisAnalysis.confidence * 100)}%
- Detection Time: ${new Date().toLocaleString()}

USER INFORMATION:
- Username: ${user.username}
- Email: ${user.email}
- User ID: ${userId}

APPOINTMENT DETAILS:
- Scheduled Time: ${appointment.scheduledTime.toLocaleString()}
- Status: Auto-approved (Crisis Session)
- Meeting Link: [To be provided by therapist]

IMMEDIATE ACTION REQUIRED:
1. Respond to the user immediately via the chat system
2. Confirm your availability for the scheduled session
3. Provide appropriate crisis intervention support
4. Follow up with ongoing care as needed

This is an automated crisis detection system. Please prioritize this case immediately.

Best regards,
Zensui AI Crisis Detection System
    `;
    
    // Send email to therapist
    await sendEmail({
      to: therapist.email,
      subject: subject,
      text: text
    });
    
    console.log(`Crisis email notification sent to therapist: ${therapist.email}`);
    
    // Also send notification to admin (if configured)
    if (process.env.ADMIN_EMAIL) {
      const adminSubject = `🚨 CRISIS ALERT - User ${user.username} - Level ${crisisAnalysis.level}`;
      const adminText = `
ADMIN CRISIS NOTIFICATION

A crisis has been detected and a therapist has been automatically assigned.

CRISIS DETAILS:
- User: ${user.username} (${user.email})
- Crisis Level: ${crisisAnalysis.level}/5
- Crisis Type: ${crisisAnalysis.type}
- Therapist Assigned: ${therapist.username} (${therapist.email})
- Scheduled Time: ${appointment.scheduledTime.toLocaleString()}

Please monitor this situation and ensure appropriate follow-up.

Best regards,
Zensui AI Crisis Detection System
      `;
      
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: adminSubject,
        text: adminText
      });
      
      console.log(`Crisis email notification sent to admin: ${process.env.ADMIN_EMAIL}`);
    }
    
  } catch (error) {
    console.error('Error sending crisis email notification:', error);
  }
};

const generateContent = async (req, res) => {
  try {
    const prompt = req.body.prompt;
    let { sessionId } = req.body;

    // Advanced crisis detection with conversation history
    const crisisPreviousMessages = await Ai.find({ session: sessionId }).sort({ createdAt: 1 });
    const conversationHistory = crisisPreviousMessages.map(msg => msg.prompt);
    const crisisAnalysis = await analyzeCrisisLevel(prompt, conversationHistory);
    
    if (crisisAnalysis.level >= 3) { // Moderate-High level or above
      console.log('🚨 CRISIS DETECTED:', {
        level: crisisAnalysis.level,
        type: crisisAnalysis.type,
        confidence: crisisAnalysis.confidence,
        score: crisisAnalysis.score,
        prompt: prompt.substring(0, 100) + '...'
      });
      
      // Find an available therapist
      const availableTherapist = await findAvailableTherapist();
      
      if (availableTherapist) {
        // Book a crisis session with urgency based on crisis level
        const urgencyMinutes = crisisAnalysis.level >= 5 ? 15 : crisisAnalysis.level >= 4 ? 30 : 45;
        const crisisAppointment = await bookCrisisSession(req.userId, availableTherapist._id, urgencyMinutes, crisisAnalysis);
        
        if (crisisAppointment) {
          console.log('✅ Crisis session booked with therapist:', availableTherapist.username);
          
          // Generate crisis-specific response based on level and type
          let crisisResponse;
          if (crisisAnalysis.level >= 5) {
            crisisResponse = `I'm extremely concerned about your safety. This is a critical situation and I've immediately connected you with a professional therapist who will be available within ${urgencyMinutes} minutes. Please stay safe - help is on the way right now. You're not alone.`;
          } else if (crisisAnalysis.level >= 4) {
            crisisResponse = `I'm deeply concerned about what you're sharing. Your safety is my top priority. I've immediately connected you with a professional therapist who will be available within ${urgencyMinutes} minutes. Please stay safe and know that help is on the way. You're not alone in this.`;
          } else {
            crisisResponse = `I'm concerned about what you're sharing. I've connected you with a professional therapist who will be available within ${urgencyMinutes} minutes. Please know that help is available and you don't have to face this alone.`;
          }
          
          // Save the crisis interaction with detailed analysis
          const newAiEntry = new Ai({
            prompt: prompt,
            response: crisisResponse,
            session: sessionId,
            isCrisis: true,
            crisisLevel: crisisAnalysis.level,
            crisisType: crisisAnalysis.type,
            crisisConfidence: crisisAnalysis.confidence
          });
          await newAiEntry.save();
          
          // Send email notification to therapist
          await sendCrisisEmailNotification(availableTherapist, req.userId, crisisAnalysis, crisisAppointment);
          
          return res.json({ 
            text: crisisResponse,
            sessionId: sessionId,
            crisisDetected: true,
            crisisLevel: crisisAnalysis.level,
            crisisType: crisisAnalysis.type,
            crisisConfidence: crisisAnalysis.confidence,
            therapistAssigned: availableTherapist.username,
            appointmentScheduled: crisisAppointment.scheduledTime,
            urgencyMinutes: urgencyMinutes
          });
        }
      }
      
      // If no therapist available, still provide crisis response
      let crisisResponse;
      if (crisisAnalysis.level >= 5) {
        crisisResponse = `I'm extremely concerned about your safety. This is a critical situation. Please call emergency services (911) or the National Suicide Prevention Lifeline (988) immediately. You're not alone, and help is available right now.`;
      } else {
        crisisResponse = `I'm deeply concerned about what you're sharing. Your safety is my top priority. Please reach out to a crisis helpline immediately: National Suicide Prevention Lifeline: 988. You're not alone, and help is available right now.`;
      }
      
      const newAiEntry = new Ai({
        prompt: prompt,
        response: crisisResponse,
        session: sessionId,
        isCrisis: true,
        crisisLevel: crisisAnalysis.level,
        crisisType: crisisAnalysis.type,
        crisisConfidence: crisisAnalysis.confidence
      });
      await newAiEntry.save();
      
      return res.json({ 
        text: crisisResponse,
        sessionId: sessionId,
        crisisDetected: true,
        crisisLevel: crisisAnalysis.level,
        crisisType: crisisAnalysis.type,
        crisisConfidence: crisisAnalysis.confidence,
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
    const sessionPreviousMessages = await Ai.find({ session: sessionId }).sort({ createdAt: 1 });

    // Build the conversation history as a prompt
    let historyPrompt = '';
    sessionPreviousMessages.forEach(msg => {
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