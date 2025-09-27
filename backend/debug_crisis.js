// Debug script to test crisis detection without API calls
const { analyzeCrisisLevel } = require('./controllers/ai');

async function debugCrisisDetection() {
  console.log('🔍 Debugging Crisis Detection System\n');
  
  // Test the exact messages that should trigger crisis detection
  const testMessages = [
    'I want to kill myself',
    'I am thinking about suicide', 
    'I am going to hurt myself',
    'I feel hopeless and want to die',
    'I want to end my life',
    'I am going to kill myself right now'
  ];
  
  console.log('Testing crisis detection patterns:\n');
  
  for (const message of testMessages) {
    console.log(`Message: "${message}"`);
    
    try {
      const analysis = await analyzeCrisisLevel(message);
      
      console.log(`  Analysis Result:`);
      console.log(`    Level: ${analysis.level}`);
      console.log(`    Type: ${analysis.type}`);
      console.log(`    Confidence: ${analysis.confidence}`);
      console.log(`    Score: ${analysis.score}`);
      console.log(`    Crisis Detected (Level >= 3): ${analysis.level >= 3 ? 'YES' : 'NO'}`);
      
      if (analysis.level >= 3) {
        console.log(`    🚨 CRISIS DETECTED - Should trigger auto-booking`);
        console.log(`    Urgency Minutes: ${analysis.level >= 5 ? 15 : analysis.level >= 4 ? 30 : 45}`);
      } else {
        console.log(`    ✅ No crisis - Normal response`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('🔍 Debug Summary:');
  console.log('- If crisis detection is working, messages like "I want to kill myself" should show Level 4+');
  console.log('- If auto-booking is working, Level 3+ should trigger therapist search and appointment creation');
  console.log('- Check server logs for crisis detection messages when testing via frontend');
}

// Run the debug
debugCrisisDetection();
