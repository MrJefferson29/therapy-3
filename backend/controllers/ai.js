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

// Enhanced therapist system prompt with specialized therapeutic training
const THERAPIST_SYSTEM_PROMPT = `
You are Zensui AI, a compassionate therapy assistant designed to provide supportive, evidence-based therapeutic conversations. You specialize in cognitive behavioral therapy (CBT), trauma-informed care, and mindfulness-based interventions.

THERAPEUTIC APPROACH:
- Use Cognitive Behavioral Therapy (CBT) techniques to help identify thought patterns
- Apply trauma-informed principles with sensitivity and care
- Incorporate mindfulness and grounding techniques when appropriate
- Use solution-focused brief therapy for practical problem-solving
- Apply dialectical behavior therapy (DBT) skills for emotional regulation

CONVERSATION GUIDELINES:
- Practice active listening and reflective responses
- Use "I hear you" and "It sounds like" to validate feelings
- Ask open-ended questions that encourage self-reflection
- Help clients identify cognitive distortions (all-or-nothing thinking, catastrophizing, etc.)
- Guide clients toward self-compassion and self-acceptance
- Use the "5-4-3-2-1" grounding technique for anxiety/panic
- Apply the "STOP" technique (Stop, Take a breath, Observe, Proceed mindfully)

SPECIALIZED INTERVENTIONS:
- For anxiety: Progressive muscle relaxation, breathing exercises, thought challenging
- For depression: Behavioral activation, cognitive restructuring, self-care planning
- For trauma: Psychoeducation, grounding techniques, safety planning
- For relationships: Communication skills, boundary setting, attachment theory insights
- For self-esteem: Self-compassion exercises, positive self-talk, achievement recognition

RESPONSE STYLE:
- Warm, professional, and non-judgmental tone
- Use therapeutic language that normalizes experiences
- Provide specific, actionable coping strategies
- Balance validation with gentle challenge of unhelpful patterns
- Keep responses conversational but clinically informed

SAFETY PROTOCOLS:
- If someone appears to be in crisis, suicidal, or homicidal, respond with:
  "I'm very concerned about your safety. Please contact a crisis therapist immediately or speak with a mental health professional. You can call 0800 800 2000 (Suicide & Crisis Lifeline) or 112 for immediate help."
- For domestic violence: Provide safety planning and local resources
- For substance abuse: Offer harm reduction strategies and treatment referrals
- Never provide medical diagnosis or medication advice
- Always maintain professional boundaries

CONVERSATION FLOW:
- Build therapeutic alliance through consistent, caring responses
- Use the conversation history to track progress and patterns
- Don't ask the same question repeatedly - adapt based on previous responses
- Help clients move from problem-focused to solution-focused thinking
- Encourage self-reflection and personal growth

EVIDENCE-BASED TECHNIQUES:
- Socratic questioning for cognitive restructuring
- Behavioral experiments for testing assumptions
- Mindfulness exercises for present-moment awareness
- Gratitude practices for positive psychology
- Values clarification for meaningful goal-setting`;

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
  
  // Add therapeutic intervention guidance based on conversation context
  contextPrompt += `\n\nTHERAPEUTIC INTERVENTION GUIDANCE:`;
  contextPrompt += `\n- If the user mentions anxiety: Offer grounding techniques (5-4-3-2-1, deep breathing)`;
  contextPrompt += `\n- If the user mentions depression: Focus on behavioral activation and self-care`;
  contextPrompt += `\n- If the user mentions relationship issues: Help with communication skills and boundary setting`;
  contextPrompt += `\n- If the user mentions trauma: Use trauma-informed language and grounding techniques`;
  contextPrompt += `\n- If the user mentions self-esteem: Guide toward self-compassion and positive self-talk`;
  contextPrompt += `\n- If the user mentions stress: Offer stress management and coping strategies`;
  contextPrompt += `\n- If the user mentions anger: Help with anger management and emotional regulation`;
  contextPrompt += `\n- If the user mentions grief: Provide grief support and normalization`;
  
  // Add conversation flow guidance
  contextPrompt += `\n\nCONVERSATION FLOW:`;
  contextPrompt += `\n- If this is a follow-up to a previous question, build on that context`;
  contextPrompt += `\n- If the user seems stuck or overwhelmed, offer support and help them break things down`;
  contextPrompt += `\n- If they're sharing something difficult, validate their feelings and offer gentle encouragement`;
  contextPrompt += `\n- Keep responses conversational but clinically informed`;
  contextPrompt += `\n- If the user seems frustrated or stuck, offer practical coping strategies or validation`;
  contextPrompt += `\n- Use Socratic questioning to help them arrive at their own insights`;
  contextPrompt += `\n- Balance validation with gentle challenge of unhelpful patterns`;
  
  contextPrompt += `\n\nUser: ${userPrompt}\nAI:`;
  
  return contextPrompt;
}

function isSeverelyUnstable(input) {
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
  
  // Define high-risk crisis patterns with context
  const crisisPatterns = [
    // Suicidal ideation - specific and direct
    /i want to die/i,
    /i want to kill myself/i,
    /i want to end my life/i,
    /i want to end it all/i,
    /i wish i was dead/i,
    /i wish to die/i,
    /i wish to end it all/i,
    /i'm going to kill myself/i,
    /i'm going to end my life/i,
    /i'm going to end it all/i,
    /i plan to kill myself/i,
    /i plan to end my life/i,
    /i have a plan to kill myself/i,
    /i have a plan to end my life/i,
    /i know how i would do it/i,
    /i have the means to kill myself/i,
    /i have the means to end my life/i,
    /i'm better off dead/i,
    /everyone would be better off without me/i,
    /no one would miss me/i,
    /i have no reason to live/i,
    /life is pointless/i,
    /life is meaningless/i,
    /i can't take it anymore/i,
    /i can't handle this anymore/i,
    /i give up on life/i,
    /i'm giving up/i,
    
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
    
    // Homicidal ideation - specific and direct
    /i want to kill someone/i,
    /i want to hurt someone/i,
    /i want to harm someone/i,
    /i want to attack someone/i,
    /i'm going to kill someone/i,
    /i'm going to hurt someone/i,
    /i'm going to harm someone/i,
    /i'm going to attack someone/i,
    /i plan to kill someone/i,
    /i plan to hurt someone/i,
    /i plan to harm someone/i,
    /i plan to attack someone/i,
    
    // Domestic violence - specific and direct
    /my partner hits me/i,
    /my partner hurts me/i,
    /my partner threatens me/i,
    /my partner controls me/i,
    /my partner isolates me/i,
    /my partner stalks me/i,
    /my partner sexually assaults me/i,
    /my partner rapes me/i,
    /my boyfriend hits me/i,
    /my girlfriend hits me/i,
    /my husband hits me/i,
    /my wife hits me/i,
    /my spouse hits me/i,
    /my significant other hits me/i,
    
    // Substance abuse - specific and direct
    /i can't stop drinking/i,
    /i can't stop using drugs/i,
    /i can't stop using/i,
    /i need help with drugs/i,
    /i need help with alcohol/i,
    /i'm addicted to drugs/i,
    /i'm addicted to alcohol/i,
    /i can't quit drugs/i,
    /i can't quit alcohol/i,
    /i can't quit drinking/i,
    /i'm overdosing/i,
    /i'm going to overdose/i,
    /i plan to overdose/i,
    
    // Acute mental health crisis - specific and direct
    /i'm hearing voices/i,
    /i'm seeing things/i,
    /i'm paranoid/i,
    /i'm delusional/i,
    /i'm having a manic episode/i,
    /i'm severely depressed/i,
    /i'm catatonic/i,
    /i'm dissociative/i,
    /i have multiple personalities/i,
    /i have split personality/i,
    /i'm having a borderline episode/i,
    /i'm psychotic/i,
    
    // Acute anxiety and panic - specific and direct
    /i'm having a panic attack/i,
    /i'm having an anxiety attack/i,
    /i can't breathe/i,
    /i feel like i'm having a heart attack/i,
    /i can't calm down/i,
    /i'm hyperventilating/i,
    /i feel like i'm dying/i,
    /i'm going crazy/i,
    /i'm losing control/i,
    
    // Eating disorders - specific and direct
    /i haven't eaten in days/i,
    /i can't stop eating/i,
    /i make myself throw up/i,
    /i'm obsessed with my weight/i,
    /i hate my body/i,
    /i want to disappear/i,
    /i'm anorexic/i,
    /i'm bulimic/i,
    /i'm binge eating/i,
    /i'm purging/i,
    /i'm restricting food/i,
    
    // Trauma and PTSD - specific and direct
    /i was raped/i,
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
      const crisisResponse = `I'm very concerned about your safety and I want you to know that you're not alone. What you're experiencing sounds incredibly difficult, and it's important that you get immediate support from a mental health professional.

Immediate Crisis Resources:
Crisis Helpline: 0800 800 2000 (24/7)
• Emergency Services: 112 (immediate help)
• Text Crisis Support: Text HOME to 741741

**What to do right now:**
1. If you're having thoughts of harming yourself or others, please call 112 immediately
2. Reach out to someone you trust - a friend, family member, or mental health professional
3. If you're in immediate danger, go to your nearest emergency room
4. Remember: these feelings are temporary and help is available

**You matter, and your life has value.** Professional help can make a real difference in how you're feeling. Would you be willing to reach out to one of these resources right now?`;
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