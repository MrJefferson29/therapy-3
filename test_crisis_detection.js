// Test file for context-aware crisis detection
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

// Test cases
const testCases = [
  // Harmless cases (should return false)
  { input: "I died when my friend told me this joke", expected: false, description: "Harmless laughter expression" },
  { input: "I'm dying of boredom", expected: false, description: "Harmless exaggeration" },
  { input: "I killed it at the gym today", expected: false, description: "Success expression" },
  { input: "My phone died yesterday", expected: false, description: "Metaphorical usage" },
  { input: "I almost died when I saw that", expected: false, description: "Harmless exaggeration" },
  { input: "I died laughing at that video", expected: false, description: "Laughter expression" },
  { input: "I want to die of embarrassment", expected: false, description: "Harmless hyperbole" },
  { input: "I killed the presentation", expected: false, description: "Success expression" },
  { input: "I'm dying for some pizza", expected: false, description: "Food craving" },
  { input: "My battery died", expected: false, description: "Device metaphor" },
  
  // Crisis cases (should return true)
  { input: "I want to die", expected: true, description: "Suicidal ideation" },
  { input: "I want to kill myself", expected: true, description: "Suicidal ideation" },
  { input: "I want to end my life", expected: true, description: "Suicidal ideation" },
  { input: "I wish I was dead", expected: true, description: "Suicidal ideation" },
  { input: "I'm going to kill myself", expected: true, description: "Suicidal ideation" },
  { input: "I plan to end my life", expected: true, description: "Suicidal ideation" },
  { input: "I want to hurt myself", expected: true, description: "Self-harm" },
  { input: "I want to cut myself", expected: true, description: "Self-harm" },
  { input: "I want to kill someone", expected: true, description: "Homicidal ideation" },
  { input: "My partner hits me", expected: true, description: "Domestic violence" },
  { input: "I can't stop drinking", expected: true, description: "Substance abuse" },
  { input: "I'm hearing voices", expected: true, description: "Mental health crisis" },
  { input: "I'm having a panic attack", expected: true, description: "Acute anxiety" },
  { input: "I haven't eaten in days", expected: true, description: "Eating disorder" },
  { input: "I was raped", expected: true, description: "Trauma" },
  { input: "I'm in crisis", expected: true, description: "Crisis declaration" },
  { input: "I need immediate help", expected: true, description: "Emergency" },
  { input: "I can't take it anymore", expected: true, description: "Crisis" },
  { input: "I give up on life", expected: true, description: "Suicidal ideation" },
  { input: "Life is pointless", expected: true, description: "Suicidal ideation" },
  { input: "I'm better off dead", expected: true, description: "Suicidal ideation" },
  { input: "No one would miss me", expected: true, description: "Suicidal ideation" },
  { input: "I have a plan to kill myself", expected: true, description: "Suicidal ideation with plan" },
  { input: "I know how I would do it", expected: true, description: "Suicidal ideation with means" }
];

console.log("Testing Context-Aware Crisis Detection\n");
console.log("=" .repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = isSeverelyUnstable(testCase.input);
  const status = result === testCase.expected ? "✅ PASS" : "❌ FAIL";
  const expectedText = testCase.expected ? "CRISIS" : "HARMLESS";
  const resultText = result ? "CRISIS" : "HARMLESS";
  
  console.log(`${index + 1}. ${status}`);
  console.log(`   Input: "${testCase.input}"`);
  console.log(`   Expected: ${expectedText}, Got: ${resultText}`);
  console.log(`   Description: ${testCase.description}`);
  console.log("");
  
  if (result === testCase.expected) {
    passed++;
  } else {
    failed++;
  }
});

console.log("=" .repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log("🎉 All tests passed! The context-aware crisis detection is working correctly.");
} else {
  console.log("⚠️  Some tests failed. Please review the crisis detection logic.");
} 