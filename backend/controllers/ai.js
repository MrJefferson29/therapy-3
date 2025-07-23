const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Ai = require("../models/ai");
const Session = require("../models/session");
const intents = require('../intents.json');
const User = require("../models/user");
const Appointment = require("../models/appointment");
const sendEmail = require("../utils/sendEmail");

// Initialize the AI model
const genAI = new GoogleGenerativeAI("AIzaSyAn0cFp4NCF9MGzRXT_hJUk62lycLdyrBY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Enhanced therapist system prompt with better conversation handling
const THERAPIST_SYSTEM_PROMPT = `
You are a professional, licensed therapist AI assistant. Your role is to provide supportive, therapeutic conversations while maintaining appropriate boundaries.

CONVERSATION GUIDELINES:
- Be empathetic, supportive, and non-judgmental
- Ask thoughtful follow-up questions to understand the person better
- When someone gives vague answers (like "everything" or "I don't know"), help them explore more specifically
- Use active listening techniques and reflect back what you understand
- Provide practical coping strategies when appropriate
- Maintain professional boundaries - you are a therapeutic assistant, not a replacement for professional therapy

RESPONSE STYLE:
- Keep responses conversational and natural
- Ask one or two thoughtful questions at a time
- Avoid repetitive or generic responses
- When someone mentions stress, anxiety, or emotional difficulties, explore the specific causes and triggers
- Help people identify patterns in their thoughts and behaviors
- Offer validation and normalization of feelings

SAFETY PROTOCOLS:
- If someone appears to be in crisis, suicidal, or homicidal, respond with:
  "I'm very concerned about your safety. Please contact a crisis helpline immediately or speak with a mental health professional. You can call 988 (Suicide & Crisis Lifeline) or 911 for immediate help."
- Never provide medical, legal, or financial advice
- Always respond as a therapeutic assistant

CONVERSATION FLOW:
- Build on previous context when available
- Don't ask the same question repeatedly
- If someone gives a vague answer, help them be more specific
- Use the conversation history to provide more personalized responses`;

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:()\[\]{}"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchIntent(userInput) {
  const normalizedInput = normalize(userInput);
  
  // First, check for exact matches (prioritize these)
  for (const intent of intents.intents) {
    for (const pattern of intent.patterns) {
      const normalizedPattern = normalize(pattern);
      
      // Check for exact match first
      if (normalizedInput === normalizedPattern) {
        const responses = intent.resonses || intent.responses;
        if (responses && responses.length > 0) {
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }
  }
  
  // Then check for phrase matches
  for (const intent of intents.intents) {
    for (const pattern of intent.patterns) {
      const normalizedPattern = normalize(pattern);
      const phraseRegex = new RegExp(`\\b${normalizedPattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (phraseRegex.test(normalizedInput)) {
        const responses = intent.resonses || intent.responses;
        if (responses && responses.length > 0) {
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }
  }
  
  // Finally, check for word matches (but be more restrictive)
  for (const intent of intents.intents) {
    for (const pattern of intent.patterns) {
      const normalizedPattern = normalize(pattern);
      const words = normalizedPattern.split(' ');
      
      // Only match if the pattern is short (1-3 words) to avoid false matches
      if (words.length <= 3 && words.every(word => normalizedInput.includes(word))) {
        const responses = intent.resonses || intent.responses;
        if (responses && responses.length > 0) {
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }
  }
  
  return null;
}

function isVagueResponse(input) {
  const vagueWords = [
    'everything', 'nothing', 'i don\'t know', 'idk', 'not sure', 'maybe', 
    'sometimes', 'always', 'never', 'whatever', 'i guess', 'probably'
  ];
  const normalized = input.toLowerCase();
  return vagueWords.some(word => normalized.includes(word));
}

function detectRepetitiveQuestion(historyPrompt, currentPrompt) {
  if (!historyPrompt) return false;
  
  // Look for similar questions in the last few exchanges
  const recentExchanges = historyPrompt.split('\n').slice(-6); // Last 3 exchanges
  const currentLower = currentPrompt.toLowerCase();
  
  // Check if the current prompt is similar to recent AI responses
  for (let i = 0; i < recentExchanges.length; i += 2) {
    if (recentExchanges[i] && recentExchanges[i + 1]) {
      const aiResponse = recentExchanges[i + 1].toLowerCase();
      // Look for question patterns
      if (aiResponse.includes('what') && aiResponse.includes('causing') && currentLower.includes('everything')) {
        return true;
      }
      if (aiResponse.includes('why') && aiResponse.includes('feel') && currentLower.includes('i don\'t know')) {
        return true;
      }
    }
  }
  
  return false;
}

function buildContextualPrompt(historyPrompt, userPrompt, isVague = false) {
  let contextPrompt = THERAPIST_SYSTEM_PROMPT;
  
  if (historyPrompt) {
    contextPrompt += `\n\nCONVERSATION HISTORY:\n${historyPrompt}`;
  }
  
  if (isVague) {
    const isRepetitive = detectRepetitiveQuestion(historyPrompt, userPrompt);
    if (isRepetitive) {
      contextPrompt += `\n\nIMPORTANT: The user has given a vague response to a similar question before. Instead of asking the same question again, try a different approach. Offer support, validation, or ask about a different aspect of their situation. Help them feel heard and understood rather than interrogated.`;
    } else {
      contextPrompt += `\n\nIMPORTANT: The user just gave a vague response. Help them explore more specifically. Ask gentle, probing questions to understand their situation better. Don't repeat the same question they just answered vaguely. Instead, try a different approach to help them open up.`;
    }
  }
  
  // Add conversation flow guidance
  contextPrompt += `\n\nCONVERSATION GUIDANCE:`;
  contextPrompt += `\n- If this is a follow-up to a previous question, build on that context`;
  contextPrompt += `\n- If the user seems stuck or overwhelmed, offer support and help them break things down`;
  contextPrompt += `\n- If they're sharing something difficult, validate their feelings and offer gentle encouragement`;
  contextPrompt += `\n- Keep responses conversational and avoid being too clinical or robotic`;
  contextPrompt += `\n- If the user seems frustrated or stuck, offer practical coping strategies or validation`;
  
  contextPrompt += `\n\nUser: ${userPrompt}\nAI:`;
  
  return contextPrompt;
}

function isSeverelyUnstable(input) {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'hurt myself', 'self-harm', 
    "can't go on", 'want to die', 'homicide', 'kill someone', 'hurt others', 
    'take my life', 'ending it all', 'no reason to live', 'give up on life', 
    'ending my life', 'wish I was dead', 'wish to die', 'wish to end it all', 
    'overdose', 'cut myself', 'jump off', 'hang myself', 'shoot myself', 
    'stab myself', 'die', 'depressed to death', 'life is pointless', 
    'life is meaningless', 'worthless', 'hopeless', 'helpless', 'crisis', 
    'emergency', 'can\'t cope', 'can\'t handle', 'can\'t take it anymore'
  ];
  const normalized = input.toLowerCase();
  return crisisKeywords.some(word => normalized.includes(word));
}

const startSession = async (req, res) => {
  try {
    const { mood } = req.body;
    if (typeof mood !== 'number' || mood < 1 || mood > 10) {
      return res.status(400).json({ error: 'Mood (1-10) is required to start a session.' });
    }
    const newSession = new Session({ user: req.userId, mood });
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
    if (!sessionId) {
      const newSession = new Session({ user: req.userId });
      await newSession.save();
      sessionId = newSession._id;
    }

    // Check if session is terminated
    const session = await Session.findOne({ _id: sessionId, user: req.userId });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.terminated) return res.status(400).json({ error: "Session is terminated" });

    // Fetch all previous messages for this session, ordered by creation time
    const previousMessages = await Ai.find({ session: sessionId }).sort({ createdAt: 1 });

    // Build the conversation history as a prompt
    let historyPrompt = '';
    previousMessages.forEach(msg => {
      historyPrompt += `User: ${msg.prompt}\nAI: ${msg.response}\n`;
    });

    // Check for severe instability first
    if (isSeverelyUnstable(prompt)) {
      const crisisResponse = "I'm very concerned about your safety. Please contact a crisis helpline immediately or speak with a mental health professional. You can call 988 (Suicide & Crisis Lifeline) or 911 for immediate help.";
      const newAiEntry = new Ai({
        prompt: prompt,
        response: crisisResponse,
        session: sessionId,
      });
      await newAiEntry.save();

      // Find a therapist (first available)
      const therapist = await User.findOne({ role: 'therapist' });
      let appointment = null;
      let appointmentError = null;
      if (therapist) {
        try {
          // Book appointment for ASAP (next hour)
          const now = new Date();
          const soon = new Date(now.getTime() + 60 * 60 * 1000);
          appointment = new Appointment({
            title: 'Urgent Mental Health Support',
            description: 'Auto-booked due to detected crisis in chat. Please reach out to the user as soon as possible.',
            scheduledTime: soon,
            therapist: therapist._id,
            client: req.userId,
            status: 'pending',
          });
          await appointment.save();

          // Email notification to therapist
          if (therapist.email) {
            await sendEmail({
              to: therapist.email,
              subject: 'Urgent: Crisis Detected - Appointment Auto-Booked',
              text: `A user in crisis has been detected by the AI. An urgent appointment has been auto-booked. Please check the platform and reach out to the user as soon as possible.`,
            });
          }
        } catch (err) {
          appointmentError = err.message;
        }
      }

      // Optionally, notify admin as well (add admin email if desired)
      // await sendEmail({ ... });

      return res.json({
        text: crisisResponse,
        sessionId,
        danger: true,
        reason: 'crisis',
        appointment: appointment ? {
          id: appointment._id,
          therapist: therapist ? therapist._id : null,
          scheduledTime: appointment.scheduledTime,
        } : null,
        appointmentError,
      });
    }

    // Check if this is a vague response
    const isVague = isVagueResponse(prompt);
    console.log(`User input: "${prompt}", isVague: ${isVague}`);
    
    // For vague responses, prioritize the vague-response intent
    if (isVague) {
      // Look specifically for vague-response intent first
      const vagueIntent = intents.intents.find(intent => intent.tag === 'vague-responses');
      if (vagueIntent) {
        const normalizedInput = normalize(prompt);
        console.log(`Looking for vague response match. Normalized input: "${normalizedInput}"`);
        for (const pattern of vagueIntent.patterns) {
          const normalizedPattern = normalize(pattern);
          console.log(`Checking pattern: "${normalizedPattern}"`);
          if (normalizedInput === normalizedPattern) {
            console.log(`Found exact match for vague response!`);
            const responses = vagueIntent.resonses || vagueIntent.responses;
            if (responses && responses.length > 0) {
              const matchedResponse = responses[Math.floor(Math.random() * responses.length)];
              const newAiEntry = new Ai({
                prompt: prompt,
                response: matchedResponse,
                session: sessionId,
              });
              await newAiEntry.save();
              return res.json({ text: matchedResponse, sessionId });
            }
          }
        }
      }
    }
    
    // Try general intent matching for non-vague responses
    if (!isVague) {
      const matchedResponse = matchIntent(prompt);
      if (matchedResponse) {
        const newAiEntry = new Ai({
          prompt: prompt,
          response: matchedResponse,
          session: sessionId,
        });
        await newAiEntry.save();
        return res.json({ text: matchedResponse, sessionId });
      }
    }

    // Build the contextual prompt
    const fullPrompt = buildContextualPrompt(historyPrompt, prompt, isVague);

    // Generate the AI response using the enhanced prompt
    const result = await model.generateContent(fullPrompt);
    const generatedText = await result.response.text();

    if (generatedText) {
      const newAiEntry = new Ai({
        prompt: prompt,
        response: generatedText,
        session: sessionId,
      });

      await newAiEntry.save();
      res.json({ text: generatedText, sessionId });
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

    const result = await model.generateContent(prompt);
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

module.exports = { generateContent, startSession, endSession, selfCareHomeContent };