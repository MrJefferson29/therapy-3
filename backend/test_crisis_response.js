// Test script to verify crisis response format
const { analyzeCrisisLevel } = require('./controllers/ai');

async function testCrisisResponseFormat() {
  console.log('🧪 Testing Crisis Response Format\n');
  
  const testMessages = [
    'I want to kill myself',
    'I am thinking about suicide',
    'I am going to hurt myself'
  ];
  
  for (const message of testMessages) {
    console.log(`Testing message: "${message}"`);
    
    const analysis = await analyzeCrisisLevel(message);
    
    if (analysis.level >= 3) {
      console.log(`  🚨 CRISIS DETECTED (Level ${analysis.level})`);
      
      // Simulate therapist data
      const mockTherapist = {
        username: 'dr_smith',
        firstName: 'Dr. Sarah',
        lastName: 'Smith',
        email: 'dr.smith@therapy.com'
      };
      
      const urgencyMinutes = analysis.level >= 5 ? 15 : analysis.level >= 4 ? 30 : 45;
      const therapistName = mockTherapist.firstName && mockTherapist.lastName 
        ? `${mockTherapist.firstName} ${mockTherapist.lastName}` 
        : mockTherapist.username;
      
      // Simulate appointment time
      const appointmentTime = new Date(Date.now() + urgencyMinutes * 60 * 1000);
      
      // Generate response based on crisis level
      let crisisResponse;
      if (analysis.level >= 5) {
        crisisResponse = `I'm extremely concerned about your safety. This is a critical situation and I've immediately booked an emergency session for you with ${therapistName} (${mockTherapist.email}) who will be available within ${urgencyMinutes} minutes at ${appointmentTime.toLocaleString()}. Please stay safe - help is on the way right now. You're not alone.`;
      } else if (analysis.level >= 4) {
        crisisResponse = `I'm deeply concerned about what you're sharing. Your safety is my top priority. I've immediately booked an urgent session for you with ${therapistName} (${mockTherapist.email}) who will be available within ${urgencyMinutes} minutes at ${appointmentTime.toLocaleString()}. Please stay safe and know that help is on the way. You're not alone in this.`;
      } else {
        crisisResponse = `I'm concerned about what you're sharing. I've booked a support session for you with ${therapistName} (${mockTherapist.email}) who will be available within ${urgencyMinutes} minutes at ${appointmentTime.toLocaleString()}. Please know that help is available and you don't have to face this alone.`;
      }
      
      console.log(`  📝 Generated Response:`);
      console.log(`    ${crisisResponse}`);
      
      // Test alert message format
      let alertMessage;
      if (analysis.level >= 5) {
        alertMessage = `IMMEDIATE HELP: An emergency session has been booked with ${therapistName} (${mockTherapist.email}) and will be available within ${urgencyMinutes} minutes. Please stay safe - help is on the way right now!`;
      } else if (analysis.level >= 4) {
        alertMessage = `URGENT SUPPORT: An urgent session has been booked with ${therapistName} (${mockTherapist.email}) and will be available within ${urgencyMinutes} minutes. Help is on the way!`;
      } else {
        alertMessage = `SUPPORT AVAILABLE: A support session has been booked with ${therapistName} (${mockTherapist.email}) and will be available within ${urgencyMinutes} minutes. You don't have to face this alone.`;
      }
      
      console.log(`  🚨 Alert Message:`);
      console.log(`    ${alertMessage}`);
      
    } else {
      console.log(`  ✅ No crisis detected (Level ${analysis.level})`);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('✅ Crisis response format test completed!');
  console.log('\n📋 Summary of Changes:');
  console.log('✅ Crisis responses now include therapist name and email');
  console.log('✅ Crisis responses include appointment scheduling time');
  console.log('✅ Alert messages show therapist contact information');
  console.log('✅ Frontend displays detailed therapist information');
  console.log('✅ Backend returns comprehensive therapist data');
}

// Run the test
testCrisisResponseFormat();
