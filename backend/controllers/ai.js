const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const DeepseekAI = require("../services/deepseekAI");
const Ai = require("../models/ai");
const Session = require("../models/session");
const intents = require('../intents.json');
const User = require("../models/user");
const Appointment = require("../models/appointment");
const sendEmail = require("../utils/sendEmail");

// Load university student training data
let universityStudentKnowledge = {};
try {
  const trainingDataPath = path.join(__dirname, '..', 'training_data', 'university_student_knowledge.json');
  console.log('Looking for training data at:', trainingDataPath);
  if (fs.existsSync(trainingDataPath)) {
    universityStudentKnowledge = JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));
    console.log('✅ University student training data loaded successfully');
    console.log('Training data keys:', Object.keys(universityStudentKnowledge));
  } else {
    console.log('⚠️ University student training data file not found at:', trainingDataPath);
    // Fallback: try to load from current directory
    const fallbackPath = path.join(__dirname, 'training_data', 'university_student_knowledge.json');
    console.log('Trying fallback path:', fallbackPath);
    if (fs.existsSync(fallbackPath)) {
      universityStudentKnowledge = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      console.log('✅ University student training data loaded from fallback path');
    } else {
      console.log('❌ Training data not found in fallback path either');
    }
  }
} catch (error) {
  console.log('❌ Error loading university student training data:', error.message);
  console.log('Error stack:', error.stack);
}

// Initialize AI models
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAn0cFp4NCF9MGzRXT_hJUk62lycLdyrBY");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const deepseekModel = new DeepseekAI(process.env.DEEPSEEK_API_KEY);

// Model selection strategy
const AI_MODELS = {
  GEMINI: 'gemini',
  DEEPSEEK: 'deepseek'
};

function selectModel() {
  // You can implement different selection strategies:
  // 1. Random selection
  // 2. Round-robin
  // 3. Based on load/performance
  // 4. Based on specific use cases
  
  // For now, using random selection
  return Math.random() < 0.5 ? AI_MODELS.GEMINI : AI_MODELS.DEEPSEEK;
}

async function generateWithModel(model, prompt) {
  try {
    let result;
    switch (model) {
      case AI_MODELS.GEMINI:
        result = await geminiModel.generateContent(prompt);
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
    // If one model fails, try the other one
    const backupModel = model === AI_MODELS.GEMINI ? AI_MODELS.DEEPSEEK : AI_MODELS.GEMINI;
    console.log(`Trying backup model: ${backupModel}`);
    return generateWithModel(backupModel, prompt);
  }
}

// Enhanced therapist system prompt with specialized therapeutic training
const THERAPIST_SYSTEM_PROMPT = `
You are Zensui AI, a compassionate therapy assistant designed to provide supportive, evidence-based therapeutic conversations. You specialize in cognitive behavioral therapy (CBT), trauma-informed care, and mindfulness-based interventions.

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

CONVERSATION GUIDELINES:
- Practice active listening and reflective responses
- Use "I hear you" and "It sounds like" to validate feelings
- Provide analytical insights and observations rather than asking multiple questions
- Help clients identify cognitive distortions (all-or-nothing thinking, catastrophizing, etc.)
- Guide clients toward self-compassion and self-acceptance
- Use the "5-4-3-2-1" grounding technique for anxiety/panic
- Apply the "STOP" technique (Stop, Take a breath, Observe, Proceed mindfully)

ANALYTICAL RESPONSE STYLE:
- Offer thoughtful analysis of what the client is experiencing
- Provide insights about patterns, emotions, and underlying themes
- Share observations about their situation rather than asking for more information
- Give practical coping strategies and tools
- Use reflective statements that help clients see their situation from new angles
- Limit questions to one per response, and only when truly necessary for deeper understanding

SPECIALIZED INTERVENTIONS:
- For anxiety: Progressive muscle relaxation, breathing exercises, thought challenging
- For depression: Behavioral activation, cognitive restructuring, self-care planning
- For trauma: Psychoeducation, grounding techniques, safety planning
- For relationships: Communication skills, boundary setting, attachment theory insights
- For self-esteem: Self-compassion exercises, positive self-talk, achievement recognition

UNIVERSITY STUDENT-SPECIFIC INTERVENTIONS:
- For academic pressures: Time management strategies, study techniques, stress reduction, realistic goal-setting
- For CGPA anxiety: Academic counseling referrals, grade perspective, learning from setbacks
- For family expectations: Boundary setting, communication strategies, cultural sensitivity
- For financial stress: Budgeting guidance, resource finding, financial aid information
- For social challenges: Social skills development, peer support groups, campus integration
- For religious/spiritual needs: Faith-based coping, spiritual community connections, prayer/meditation
- For first-generation students: Academic support, cultural navigation, family communication
- For final year project stress: Project management, supervisor communication, realistic timelines

RESPONSE STYLE:
- Warm, professional, and non-judgmental tone
- Use therapeutic language that normalizes experiences
- Provide specific, actionable coping strategies
- Balance validation with gentle challenge of unhelpful patterns
- Keep responses conversational but clinically informed
- Be analytical and insightful rather than interrogative

SAFETY PROTOCOLS:
- If someone appears to be in crisis, suicidal, or homicidal, respond with:
  "I'm very concerned about your safety and well-being. I'm immediately connecting you with a qualified therapist on our platform who can provide the urgent support you need. You can access our therapists through the 'My Therapist' section of the app, or I can help you book an emergency session right now."
- For domestic violence: Provide safety planning and direct to platform therapists
- For substance abuse: Offer harm reduction strategies and direct to platform therapists
- Never provide medical diagnosis or medication advice
- Always maintain professional boundaries
- CRITICAL: When crisis is detected, the system will automatically book an emergency session with an available therapist

CONVERSATION FLOW:
- Build therapeutic alliance through consistent, caring responses
- Use the conversation history to track progress and patterns
- Provide analytical insights and observations rather than repetitive questioning
- Help clients move from problem-focused to solution-focused thinking
- Encourage self-reflection and personal growth through thoughtful analysis
- When clients need specialized help, direct them to therapists on the platform

THERAPIST REFERRAL GUIDELINES:
- When clients need professional help beyond AI support, direct them to therapists on the platform
- Explain how to access therapists: "You can find qualified therapists in the 'My Therapist' section of the app"
- Offer to help book sessions: "I can help you book a session with one of our professional therapists"
- Emphasize the benefits of human therapeutic support for complex issues
- Never refer to external resources - always use platform therapists

EVIDENCE-BASED TECHNIQUES:
- Socratic questioning for cognitive restructuring (use sparingly, focus on insights)
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
  console.log(`[INTENT DEBUG] Matching intent for: "${userInput}" -> normalized: "${normalizedInput}"`);
  
  // First, check for exact matches (prioritize these)
  for (const intent of intents.intents) {
    for (const pattern of intent.patterns) {
      const normalizedPattern = normalize(pattern);
      
      // Check for exact match first
      if (normalizedInput === normalizedPattern) {
        const responses = intent.responses || intent.resonses;
        if (responses && responses.length > 0) {
          console.log(`[INTENT DEBUG] Exact match found for intent: ${intent.tag}`);
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
        const responses = intent.responses || intent.resonses;
        if (responses && responses.length > 0) {
          console.log(`Phrase match found for intent: ${intent.tag}`);
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
        const responses = intent.responses || intent.resonses;
        if (responses && responses.length > 0) {
          console.log(`Word match found for intent: ${intent.tag}`);
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }
  }
  
  // Check for multi-word patterns that might match user input
  for (const intent of intents.intents) {
    for (const pattern of intent.patterns) {
      const normalizedPattern = normalize(pattern);
      const patternWords = normalizedPattern.split(' ');
      const inputWords = normalizedInput.split(' ');
      
      // Check if most words from the pattern are present in the input
      if (patternWords.length > 1) {
        const matchingWords = patternWords.filter(word => inputWords.includes(word));
        if (matchingWords.length >= Math.ceil(patternWords.length * 0.6)) { // At least 60% of words match
          const responses = intent.responses || intent.resonses;
          if (responses && responses.length > 0) {
            console.log(`Multi-word match found for intent: ${intent.tag} (${matchingWords.length}/${patternWords.length} words matched)`);
            return responses[Math.floor(Math.random() * responses.length)];
          }
        }
      }
    }
  }
  
  console.log('[INTENT DEBUG] No intent match found');
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

// Assessment scoring functions
function calculatePHQ9Score(responses) {
  if (!responses || responses.length < 9) return 0;
  return responses.reduce((sum, response) => sum + (parseInt(response) || 0), 0);
}

function calculateGAD7Score(responses) {
  if (!responses || responses.length < 7) return 0;
  return responses.reduce((sum, response) => sum + (parseInt(response) || 0), 0);
}

function determineSupportPlan(phq9Score, gad7Score, hasSuicideIdeation, initialMood = 5) {
  if (hasSuicideIdeation) {
    return 'crisis_escalation';
  } else if (phq9Score >= 15 || gad7Score >= 15) {
    return 'severe_scores';
  } else if (phq9Score >= 5 || gad7Score >= 5) {
    return 'moderate_scores';
  } else if (initialMood <= 3) {
    // Even with low assessment scores, low initial mood suggests need for support
    return 'moderate_scores';
  } else {
    return 'low_scores';
  }
}

function buildContextualPrompt(historyPrompt, userPrompt, isVague = false, assessmentState = null) {
  let contextPrompt = THERAPIST_SYSTEM_PROMPT;
  
  // Add conversation flow guidance
  contextPrompt += `

CONVERSATION ANALYSIS GUIDELINES:
- First, determine if this is a wellness/therapeutic conversation or a general question
- For general questions (greetings, casual conversation, non-wellness topics): Respond naturally and helpfully
- For wellness/therapeutic topics: Analyze the user's emotional state and underlying themes
- Provide insights about patterns you notice in their communication (only for wellness topics)
- Offer practical coping strategies based on what they've shared (only for wellness topics)
- Use reflective statements to help them gain perspective (only for wellness topics)
- Avoid asking multiple questions - focus on providing value through analysis
- If you must ask a question, make it meaningful and purposeful
- Direct users to platform therapists when they need specialized professional help`;

  // Add assessment flow guidelines only if assessmentState is available
  if (assessmentState && assessmentState.initialMood !== undefined) {
    contextPrompt += `

ASSESSMENT FLOW GUIDELINES:
- User started session with mood rating: ${assessmentState.initialMood}/10
- If user gives consent, begin with PHQ9 assessment questions
- Follow structured assessment flow: PHQ9 → GAD7 → Suicide Risk → Contextual Stressors → Support Plan
- Track assessment responses and calculate scores appropriately
- Consider initial mood when providing support recommendations
- Escalate to crisis intervention if suicide ideation is present
- Provide appropriate support plan based on assessment scores and initial mood`;
  }

  contextPrompt += `

RESPONSE STRUCTURE:
1. Acknowledge and validate their experience
2. Provide analytical insights about their situation
3. Offer practical coping strategies or tools
4. Include one thoughtful question only if it adds significant value
5. If appropriate, suggest connecting with a platform therapist for deeper support`;
  
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
  
  // University student-specific guidance
  contextPrompt += `\n\nUNIVERSITY STUDENT GUIDANCE:`;
  contextPrompt += `\n- If the user mentions academic pressure/CGPA: Help with realistic goal-setting and study strategies`;
  contextPrompt += `\n- If the user mentions financial stress: Offer budgeting tips and resource finding`;
  contextPrompt += `\n- If the user mentions family expectations: Help with boundary setting and cultural communication`;
  contextPrompt += `\n- If the user mentions social challenges: Guide toward campus integration and peer support`;
  contextPrompt += `\n- If the user mentions religious/spiritual needs: Support faith-based coping and spiritual community`;
  contextPrompt += `\n- If the user mentions first-generation struggles: Provide academic support and cultural navigation`;
  contextPrompt += `\n- If the user mentions final year project stress: Help with project management and supervisor communication`;
  contextPrompt += `\n- If the user mentions lecturer issues: Guide toward professional communication and advocacy`;
  
  // Add conversation flow guidance
  contextPrompt += `\n\nCONVERSATION FLOW:`;
  contextPrompt += `\n- If this is a follow-up to a previous question, build on that context`;
  contextPrompt += `\n- If the user seems stuck or overwhelmed, offer support and help them break things down`;
  contextPrompt += `\n- If they're sharing something difficult, validate their feelings and offer gentle encouragement`;
  contextPrompt += `\n- Keep responses conversational but clinically informed`;
  contextPrompt += `\n- If the user seems frustrated or stuck, offer practical coping strategies or validation`;
  contextPrompt += `\n- Use Socratic questioning to help them arrive at their own insights`;
  contextPrompt += `\n- Balance validation with gentle challenge of unhelpful patterns`;
  
  // Inject relevant university student knowledge based on user input
  const relevantKnowledge = injectUniversityStudentKnowledge(userPrompt);
  if (relevantKnowledge) {
    contextPrompt += relevantKnowledge;
  }
  
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
    /killed (yesterday|today|last week|this morning)/i,
    
    // Academic harmless expressions
    /killed (the exam|the test|the assignment|the presentation)/i,
    /died (during|in|at) (exam|test|presentation)/i,
    /killed (it|them) (in|at|during) (class|lecture|tutorial)/i,
    /died (of|from) (boredom|embarrassment) (in|at|during) (class|lecture)/i,
    
    // Financial harmless expressions
    /killed (my budget|my savings|my wallet)/i,
    /died (of|from) (shock|embarrassment) (when|after) (seeing|checking) (bill|price)/i,
    /killed (it|them) (at|in) (work|job|business)/i
  ];
  
  // Check for harmless patterns first
  for (const pattern of harmlessPatterns) {
    if (pattern.test(normalized)) {
      return false; // This is harmless usage
    }
  }
  
  // Enhanced semantic crisis detection patterns
  const crisisPatterns = [
    // Suicidal ideation - various expressions with semantic understanding
    /i (want|wish|need|desire) to (die|end my life|kill myself|commit suicide|end it all)/i,
    /i (want|wish|need|desire) to (end myself|take my life|end my existence)/i,
    /i (want|wish|need|desire) to (stop existing|not be here|disappear|not wake up)/i,
    /i (want|wish|need|desire) to (end this|end everything|end it|end the pain)/i,
    /i (want|wish|need|desire) to (go away|leave this world|not be alive)/i,
    /i (want|wish|need|desire) to (end my suffering|stop living|not live)/i,
    /i (want|wish|need|desire) to (end my pain|stop existing|not be alive)/i,
    /i (want|wish|need|desire) to (end the suffering|stop the hurt|end the hurt)/i,
    /i (want|wish|need|desire) to (end my misery|stop my pain|end my agony)/i,
    /i (want|wish|need|desire) to (end my torment|stop my suffering|end my distress)/i,
    
    // Direct suicidal statements
    /i'm (suicidal|feeling suicidal|having suicidal thoughts)/i,
    /i am (suicidal|feeling suicidal|having suicidal thoughts)/i,
    /i feel (suicidal|like killing myself|like ending it all)/i,
    /i have (suicidal thoughts|thoughts of suicide|thoughts of killing myself)/i,
    
    // Future tense suicidal ideation
    /i'm going to (die|kill myself|end my life|commit suicide|end it all)/i,
    /i'm going to (end myself|take my life|end my existence)/i,
    /i'm going to (stop existing|not be here|disappear|not wake up)/i,
    /i'm going to (end this|end everything|end it|end the pain)/i,
    /i'm going to (go away|leave this world|not be alive)/i,
    /i'm going to (end my suffering|stop living|not live)/i,
    /i'm going to (end my pain|stop existing|not be alive)/i,
    
    // Planning and intent
    /i (plan|intend|am planning|am intending) to (die|kill myself|end my life|commit suicide)/i,
    /i (plan|intend|am planning|am intending) to (end myself|take my life|end my existence)/i,
    /i (plan|intend|am planning|am intending) to (stop existing|not be here|disappear)/i,
    /i (plan|intend|am planning|am intending) to (end this|end everything|end it)/i,
    /i (plan|intend|am planning|am intending) to (go away|leave this world|not be alive)/i,
    
    // Means and methods
    /i (have|know|found) (a way|the means|how) to (die|kill myself|end my life|commit suicide)/i,
    /i (have|know|found) (a way|the means|how) to (end myself|take my life|end my existence)/i,
    /i (have|know|found) (a way|the means|how) to (stop existing|not be here|disappear)/i,
    /i (have|know|found) (a way|the means|how) to (end this|end everything|end it)/i,
    
    // Hopelessness and worthlessness
    /i'm (better off|worse off) (dead|not alive|not existing)/i,
    /everyone would be (better off|worse off) (without me|if i wasn't here|if i was gone)/i,
    /no one would (miss me|care if i was gone|notice if i was gone)/i,
    /i have (no reason|no purpose|nothing) to (live|be alive|exist)/i,
    /life is (pointless|meaningless|worthless|hopeless)/i,
    /i'm (worthless|useless|hopeless|helpless)/i,
    /i'm (better off|worse off) (dead|not alive|not existing)/i,
    
    // Overwhelming distress
    /i can't (take|bear|stand|endure|handle) (this|it|anymore|this pain|this suffering)/i,
    /i can't (cope|deal|manage|handle) (this|it|anymore|this pain|this suffering)/i,
    /i (give up|am giving up|have given up) (on life|on everything|on trying)/i,
    /i (want|need) (this|it|everything) to (stop|end|be over|be done)/i,
    /i (want|need) to (give up|quit|stop trying|stop fighting)/i,
    /i'm (giving up|quitting|stopping) (on life|on everything|on trying)/i,
    /i'm (at|hitting) (rock bottom|my breaking point|my limit)/i,
    /i (can't|don't) (go on|continue|keep going|keep fighting)/i,
    
    // Self-harm - enhanced semantic patterns
    /i (want|wish|need|desire) to (hurt|cut|harm|injure|damage|wound) (myself|my body)/i,
    /i (want|wish|need|desire) to (punish|hurt|cut|harm|injure|damage|wound) (myself|my body)/i,
    /i (want|wish|need|desire) to (hurt|cut|harm|injure|damage|wound) (my|the) (body|skin|arms|legs)/i,
    /i (want|wish|need|desire) to (punish|hurt|cut|harm|injure|damage|wound) (my|the) (body|skin|arms|legs)/i,
    /i'm going to (hurt|cut|harm|injure|damage|wound) (myself|my body)/i,
    /i'm going to (punish|hurt|cut|harm|injure|damage|wound) (myself|my body)/i,
    /i'm going to (hurt|cut|harm|injure|damage|wound) (my|the) (body|skin|arms|legs)/i,
    /i (plan|intend|am planning|am intending) to (hurt|cut|harm|injure|damage|wound) (myself|my body)/i,
    /i (plan|intend|am planning|am intending) to (punish|hurt|cut|harm|injure|damage|wound) (myself|my body)/i,
    /i (plan|intend|am planning|am intending) to (hurt|cut|harm|injure|damage|wound) (my|the) (body|skin|arms|legs)/i,
    
    // Homicidal ideation - enhanced semantic patterns
    /i (want|wish|need|desire) to (kill|hurt|harm|injure|attack|assault) (someone|people|them)/i,
    /i (want|wish|need|desire) to (kill|hurt|harm|injure|attack|assault) (him|her|them|that person)/i,
    /i (want|wish|need|desire) to (kill|hurt|harm|injure|attack|assault) (my|the) (partner|spouse|family|friend|boss|teacher)/i,
    /i (want|wish|need|desire) to (kill|hurt|harm|injure|attack|assault) (my|the) (boyfriend|girlfriend|husband|wife)/i,
    /i'm going to (kill|hurt|harm|injure|attack|assault) (someone|people|them)/i,
    /i'm going to (kill|hurt|harm|injure|attack|assault) (him|her|them|that person)/i,
    /i'm going to (kill|hurt|harm|injure|attack|assault) (my|the) (partner|spouse|family|friend|boss|teacher)/i,
    /i'm going to (kill|hurt|harm|injure|attack|assault) (my|the) (boyfriend|girlfriend|husband|wife)/i,
    /i (plan|intend|am planning|am intending) to (kill|hurt|harm|injure|attack|assault) (someone|people|them)/i,
    /i (plan|intend|am planning|am intending) to (kill|hurt|harm|injure|attack|assault) (him|her|them|that person)/i,
    /i (plan|intend|am planning|am intending) to (kill|hurt|harm|injure|attack|assault) (my|the) (partner|spouse|family|friend|boss|teacher)/i,
    /i (plan|intend|am planning|am intending) to (kill|hurt|harm|injure|attack|assault) (my|the) (boyfriend|girlfriend|husband|wife)/i,
    
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
    /i'm depressed to death/i,
    
    // Academic crisis patterns
    /i'm going to fail my degree/i,
    /i'm going to fail my final year/i,
    /i can't handle my studies anymore/i,
    /i want to drop out/i,
    /i'm going to drop out/i,
    /i can't face my lecturers anymore/i,
    /i'm going to fail my project/i,
    /i can't complete my final year project/i,
    /my cgpa is ruined/i,
    /my grades are destroyed/i,
    /i'm going to disappoint my family/i,
    /my family will disown me/i,
    /i can't meet my family's expectations/i,
    
    // Financial crisis patterns
    /i can't afford to study anymore/i,
    /i'm going to be homeless/i,
    /i can't pay my fees/i,
    /i can't afford food/i,
    /i'm starving/i,
    /i can't pay my rent/i,
    /i'm going to be evicted/i,
    /my family can't support me anymore/i,
    /i'm in debt/i,
    /i can't pay my loans/i,
    
    // Social crisis patterns
    /i have no friends/i,
    /everyone hates me/i,
    /i don't fit in anywhere/i,
    /i'm completely alone/i,
    /no one understands me/i,
    /i'm being bullied/i,
    /i'm being excluded/i,
    /social media is destroying me/i,
    /i can't handle the pressure/i,
    /i'm a failure compared to others/i
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

// Function to inject relevant university student knowledge based on user input
function injectUniversityStudentKnowledge(userInput) {
  let relevantKnowledge = '';
  
  // Check for academic pressure patterns
  if (userInput.toLowerCase().match(/(cgpa|grade|academic|study|exam|test|assignment|project|lecturer|professor|coursework)/)) {
    if (universityStudentKnowledge.university_student_knowledge?.academic_pressures) {
      relevantKnowledge += '\n\nACADEMIC EXPERTISE:';
      if (universityStudentKnowledge.university_student_knowledge.academic_pressures.cgpa_anxiety) {
        relevantKnowledge += `\n- CGPA Anxiety: ${universityStudentKnowledge.university_student_knowledge.academic_pressures.cgpa_anxiety.understanding}`;
        relevantKnowledge += `\n- Interventions: ${universityStudentKnowledge.university_student_knowledge.academic_pressures.cgpa_anxiety.interventions.join(', ')}`;
      }
      if (universityStudentKnowledge.university_student_knowledge.academic_pressures.procrastination) {
        relevantKnowledge += `\n- Procrastination: ${universityStudentKnowledge.university_student_knowledge.academic_pressures.procrastination.understanding}`;
        relevantKnowledge += `\n- Interventions: ${universityStudentKnowledge.university_student_knowledge.academic_pressures.procrastination.interventions.join(', ')}`;
      }
      if (universityStudentKnowledge.university_student_knowledge.academic_pressures.exam_anxiety) {
        relevantKnowledge += `\n- Exam Anxiety: ${universityStudentKnowledge.university_student_knowledge.academic_pressures.exam_anxiety.understanding}`;
        relevantKnowledge += `\n- Interventions: ${universityStudentKnowledge.university_student_knowledge.academic_pressures.exam_anxiety.interventions.join(', ')}`;
      }
    }
  }
  
  // Check for financial stress patterns
  if (userInput.toLowerCase().match(/(money|financial|budget|cost|tuition|fee|loan|debt|expensive|afford|funding|scholarship)/)) {
    if (universityStudentKnowledge.university_student_knowledge?.financial_stress) {
      relevantKnowledge += '\n\nFINANCIAL EXPERTISE:';
      if (universityStudentKnowledge.university_student_knowledge.financial_stress.self_funding_education) {
        relevantKnowledge += `\n- Self-Funding: ${universityStudentKnowledge.university_student_knowledge.financial_stress.self_funding_education.understanding}`;
        relevantKnowledge += `\n- Resources: ${universityStudentKnowledge.university_student_knowledge.financial_stress.self_funding_education.resources.join(', ')}`;
        relevantKnowledge += `\n- Coping: ${universityStudentKnowledge.university_student_knowledge.financial_stress.self_funding_education.coping_strategies.join(', ')}`;
      }
    }
  }
  
  // Check for social challenges patterns
  if (userInput.toLowerCase().match(/(friend|social|lonely|isolated|peer|group|roommate|bully|harassment|fit in|belong)/)) {
    if (universityStudentKnowledge.university_student_knowledge?.social_challenges) {
      relevantKnowledge += '\n\nSOCIAL EXPERTISE:';
      if (universityStudentKnowledge.university_student_knowledge.social_challenges.social_isolation) {
        relevantKnowledge += `\n- Social Isolation: ${universityStudentKnowledge.university_student_knowledge.social_challenges.social_isolation.understanding}`;
        relevantKnowledge += `\n- Interventions: ${universityStudentKnowledge.university_student_knowledge.social_challenges.social_isolation.interventions.join(', ')}`;
      }
    }
  }
  
  // Check for family expectations patterns
  if (userInput.toLowerCase().match(/(family|parent|expectation|pressure|first generation|cultural|tradition|obligation)/)) {
    if (universityStudentKnowledge.university_student_knowledge?.family_expectations) {
      relevantKnowledge += '\n\nFAMILY EXPERTISE:';
      if (universityStudentKnowledge.university_student_knowledge.family_expectations.first_generation_students) {
        relevantKnowledge += `\n- First-Generation: ${universityStudentKnowledge.university_student_knowledge.family_expectations.first_generation_students.understanding}`;
        relevantKnowledge += `\n- Support: ${universityStudentKnowledge.university_student_knowledge.family_expectations.first_generation_students.support_strategies.join(', ')}`;
      }
    }
  }
  
  // Check for religious/spiritual patterns
  if (userInput.toLowerCase().match(/(religion|spiritual|faith|prayer|god|belief|church|mosque|temple|meditation|soul)/)) {
    if (universityStudentKnowledge.university_student_knowledge?.religious_spiritual) {
      relevantKnowledge += '\n\nSPIRITUAL EXPERTISE:';
      if (universityStudentKnowledge.university_student_knowledge.religious_spiritual.faith_based_coping) {
        relevantKnowledge += `\n- Faith-Based Coping: ${universityStudentKnowledge.university_student_knowledge.religious_spiritual.faith_based_coping.understanding}`;
        relevantKnowledge += `\n- Support: ${universityStudentKnowledge.university_student_knowledge.religious_spiritual.faith_based_coping.support_strategies.join(', ')}`;
      }
    }
  }
  
  // Check for mental health patterns
  if (userInput.toLowerCase().match(/(imposter|perfection|anxiety|depression|stress|burnout|overwhelm|worthless|failure)/)) {
    if (universityStudentKnowledge.university_student_knowledge?.mental_health) {
      relevantKnowledge += '\n\nMENTAL HEALTH EXPERTISE:';
      if (universityStudentKnowledge.university_student_knowledge.mental_health.imposter_syndrome) {
        relevantKnowledge += `\n- Imposter Syndrome: ${universityStudentKnowledge.university_student_knowledge.mental_health.imposter_syndrome.understanding}`;
        relevantKnowledge += `\n- Interventions: ${universityStudentKnowledge.university_student_knowledge.mental_health.imposter_syndrome.interventions.join(', ')}`;
      }
      if (universityStudentKnowledge.university_student_knowledge.mental_health.perfectionism) {
        relevantKnowledge += `\n- Perfectionism: ${universityStudentKnowledge.university_student_knowledge.mental_health.perfectionism.understanding}`;
        relevantKnowledge += `\n- Interventions: ${universityStudentKnowledge.university_student_knowledge.mental_health.perfectionism.interventions.join(', ')}`;
      }
    }
  }
  
  // Add practical resources
  if (universityStudentKnowledge.university_student_knowledge?.practical_resources) {
    relevantKnowledge += '\n\nPRACTICAL RESOURCES:';
    relevantKnowledge += `\n- Campus Services: ${universityStudentKnowledge.university_student_knowledge.practical_resources.campus_services.join(', ')}`;
    relevantKnowledge += `\n- Crisis Resources: ${universityStudentKnowledge.university_student_knowledge.practical_resources.crisis_resources.join(', ')}`;
  }
  
  // Add evidence-based techniques
  if (universityStudentKnowledge.university_student_knowledge?.evidence_based_techniques) {
    relevantKnowledge += '\n\nEVIDENCE-BASED TECHNIQUES:';
    relevantKnowledge += `\n- Stress Management: ${universityStudentKnowledge.university_student_knowledge.evidence_based_techniques.stress_management.join(', ')}`;
    relevantKnowledge += `\n- Cognitive Techniques: ${universityStudentKnowledge.university_student_knowledge.evidence_based_techniques.cognitive_techniques.join(', ')}`;
    relevantKnowledge += `\n- Academic Support: ${universityStudentKnowledge.university_student_knowledge.evidence_based_techniques.academic_support.join(', ')}`;
  }
  
  return relevantKnowledge;
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

    // Track assessment progress
    let assessmentState = {
      phq9Responses: [],
      gad7Responses: [],
      suicideRiskResponses: [],
      currentPhase: 'intake', // intake, phq9, gad7, suicide_risk, contextual_stressors, support_plan
      hasSuicideIdeation: false,
      initialMood: session.mood || 5 // Include initial mood in assessment state
    };

    // Extract assessment responses from conversation history
    const assessmentResponses = previousMessages.filter(msg => 
      /^[0-3]$/.test(msg.prompt.trim())
    );
    
    if (assessmentResponses.length > 0) {
      // Determine current phase based on number of responses
      if (assessmentResponses.length <= 9) {
        assessmentState.currentPhase = 'phq9';
        assessmentState.phq9Responses = assessmentResponses.slice(0, 9).map(msg => msg.prompt.trim());
      } else if (assessmentResponses.length <= 16) {
        assessmentState.currentPhase = 'gad7';
        assessmentState.phq9Responses = assessmentResponses.slice(0, 9).map(msg => msg.prompt.trim());
        assessmentState.gad7Responses = assessmentResponses.slice(9, 16).map(msg => msg.prompt.trim());
      } else {
        assessmentState.currentPhase = 'suicide_risk';
        assessmentState.phq9Responses = assessmentResponses.slice(0, 9).map(msg => msg.prompt.trim());
        assessmentState.gad7Responses = assessmentResponses.slice(9, 16).map(msg => msg.prompt.trim());
        assessmentState.suicideRiskResponses = assessmentResponses.slice(16).map(msg => msg.prompt.trim());
      }
    } else {
      // Check if this is the first assessment question (from presenting problem)
      const hasPresentingProblem = previousMessages.some(msg => 
        msg.response && msg.response.includes('little interest or pleasure in doing things')
      );
      if (hasPresentingProblem) {
        assessmentState.currentPhase = 'phq9';
      }
    }

    // Check for severe instability first
    if (isSeverelyUnstable(prompt)) {
      const crisisResponse = `I'm very concerned about your safety and well-being. What you're experiencing sounds incredibly difficult, and I want you to know that you're not alone in this.

**I'm immediately connecting you with a qualified therapist on our platform** who can provide the urgent support you need. You don't have to face this alone.

**What's happening right now:**
1. I'm automatically booking you an emergency session with an available therapist on our platform
2. You'll be redirected to connect with them immediately through the app
3. You can also access our therapists anytime through the 'My Therapist' section
4. If you're in immediate danger, please call emergency services (112) right now
5. Remember: these feelings are temporary and help is available

**You matter, and your life has value.** A professional therapist from our platform will be with you shortly to provide the support you need. Our therapists are specially trained to help with crisis situations and can provide immediate, personalized support.

**How to access our therapists:**
- Go to the 'My Therapist' section in the app
- Browse available therapists and their specializations
- Book a session or start a chat immediately
- All our therapists are qualified professionals ready to help

Please don't hesitate to reach out - you're taking an important step by seeking help, and our platform is here to support you.`;
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

    // Handle assessment flow
    if (/^[0-3]$/.test(prompt.trim())) {
      // This is an assessment response - add it to the appropriate array
      if (assessmentState.currentPhase === 'phq9' && assessmentState.phq9Responses.length < 9) {
        assessmentState.phq9Responses.push(prompt.trim());
      } else if (assessmentState.currentPhase === 'gad7' && assessmentState.gad7Responses.length < 7) {
        assessmentState.gad7Responses.push(prompt.trim());
      }
      
      // Recalculate scores with updated responses
      const phq9Score = calculatePHQ9Score(assessmentState.phq9Responses);
      const gad7Score = calculateGAD7Score(assessmentState.gad7Responses);
      
      // Check for suicide ideation in PHQ9 question 9
      if (assessmentState.phq9Responses.length >= 9 && parseInt(assessmentState.phq9Responses[8]) > 0) {
        assessmentState.hasSuicideIdeation = true;
      }
      
      // Determine next step based on current phase
      if (assessmentState.currentPhase === 'phq9' && assessmentState.phq9Responses.length < 9) {
        // Continue PHQ9 questions
        const nextQuestion = assessmentState.phq9Responses.length;
        const phq9Questions = [
          "Thank you. Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by trouble falling asleep, staying asleep, or sleeping too much? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by poor appetite or overeating? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by feeling bad about yourself or that you are a failure? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by trouble concentrating on things like reading or watching TV? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that others notice, or the opposite—being fidgety/restless? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead or of hurting yourself? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)"
        ];
        
        let response;
        if (nextQuestion < phq9Questions.length) {
          response = phq9Questions[nextQuestion];
        } else {
          // PHQ9 complete, transition to GAD7
          assessmentState.currentPhase = 'gad7';
          response = "Thank you. Now let me ask about anxiety. Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)";
        }
        
        const newAiEntry = new Ai({
          prompt: prompt,
          response: response,
          session: sessionId,
        });
        await newAiEntry.save();
        return res.json({ text: response, sessionId });
      } else if (assessmentState.currentPhase === 'gad7' && assessmentState.gad7Responses.length < 7) {
        // Continue GAD7 questions
        const nextQuestion = assessmentState.gad7Responses.length;
        const gad7Questions = [
          "Thank you. Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by worrying too much about different things? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by trouble relaxing? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by being so restless that it is hard to sit still? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)",
          "Thank you. Over the last 2 weeks, how often have you been bothered by feeling afraid as if something awful might happen? (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)"
        ];
        
        let response;
        if (nextQuestion < gad7Questions.length) {
          response = gad7Questions[nextQuestion];
        } else {
          // GAD7 complete, transition to suicide risk assessment
          assessmentState.currentPhase = 'suicide_risk';
          response = "Thank you for completing the assessment. I'd like to ask you a few more important questions about your safety. Have you wished you were dead or wished you could go to sleep and not wake up?";
        }
        
        const newAiEntry = new Ai({
          prompt: prompt,
          response: response,
          session: sessionId,
        });
        await newAiEntry.save();
        return res.json({ text: response, sessionId });
      }
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
      console.log('Attempting intent matching for non-vague response...');
      const matchedResponse = matchIntent(prompt);
      if (matchedResponse) {
        console.log('Intent match found! Using intent response instead of AI generation.');
        const newAiEntry = new Ai({
          prompt: prompt,
          response: matchedResponse,
          session: sessionId,
        });
        await newAiEntry.save();
        return res.json({ text: matchedResponse, sessionId });
      } else {
        console.log('No intent match found, falling back to AI generation...');
      }
    } else {
      console.log('Input marked as vague, skipping general intent matching...');
    }

    // Build the contextual prompt
    const fullPrompt = buildContextualPrompt(historyPrompt, prompt, isVague, assessmentState);

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
  selfCareHomeContent, 
  isSeverelyUnstable, 
  injectUniversityStudentKnowledge,
  calculatePHQ9Score,
  calculateGAD7Score,
  determineSupportPlan
};