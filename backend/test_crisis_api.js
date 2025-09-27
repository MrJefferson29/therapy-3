// Test script to simulate crisis detection via API call
const axios = require('axios');

async function testCrisisAPI() {
  try {
    console.log('🧪 Testing Crisis Detection via API\n');
    
    // Test crisis messages
    const crisisMessages = [
      'I want to kill myself',
      'I am thinking about suicide',
      'I am going to hurt myself',
      'I feel hopeless and want to die'
    ];
    
    const baseURL = 'http://localhost:5000'; // Adjust if your server runs on different port
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NmI4NTI3Mzc2NzUwMWQzNmYzOWQwMiIsImlhdCI6MTc1ODkwOTcyOCwiZXhwIjoxNzkwNDQ1NzI4fQ.QrfZ8zUXujssSAVCUxNg51_fHL5nkd3s9cpMmw0a4YA';
    
    console.log('Testing crisis detection with API calls...\n');
    
    for (const message of crisisMessages) {
      console.log(`Testing message: "${message}"`);
      
      try {
        const response = await axios.post(`${baseURL}/ai/session-generate`, {
          prompt: message,
          sessionId: null // Let it create a new session
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });
        
        console.log(`  Status: ${response.status}`);
        console.log(`  Response:`, {
          text: response.data.text?.substring(0, 100) + '...',
          crisisDetected: response.data.crisisDetected,
          crisisLevel: response.data.crisisLevel,
          crisisType: response.data.crisisType,
          therapistAssigned: response.data.therapistAssigned,
          appointmentScheduled: response.data.appointmentScheduled
        });
        
        if (response.data.crisisDetected) {
          console.log(`  🚨 CRISIS DETECTED!`);
          console.log(`    Level: ${response.data.crisisLevel}`);
          console.log(`    Type: ${response.data.crisisType}`);
          console.log(`    Therapist: ${response.data.therapistAssigned || 'None'}`);
          console.log(`    Appointment: ${response.data.appointmentScheduled || 'None'}`);
        } else {
          console.log(`  ✅ No crisis detected`);
        }
        
      } catch (error) {
        console.log(`  ❌ API Error:`, error.response?.status, error.response?.data || error.message);
      }
      
      console.log(''); // Empty line for readability
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCrisisAPI();