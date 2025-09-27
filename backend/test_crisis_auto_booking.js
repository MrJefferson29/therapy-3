// Test script for crisis detection and auto-booking functionality
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/user');
const Appointment = require('./models/appointment');
const Session = require('./models/session');
const Ai = require('./models/ai');

// Import crisis detection function
const { analyzeCrisisLevel, findAvailableTherapist, bookCrisisSession } = require('./controllers/ai');

async function testCrisisDetection() {
  try {
    console.log('🧪 Testing Crisis Detection and Auto-Booking System\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/therapy-app');
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Check if therapists exist
    console.log('📋 Test 1: Checking therapist availability...');
    const therapists = await User.find({ role: 'therapist' });
    console.log(`Found ${therapists.length} therapists in the system`);
    
    if (therapists.length === 0) {
      console.log('❌ No therapists found! Creating a test therapist...');
      const testTherapist = new User({
        username: 'test_therapist',
        email: 'therapist@test.com',
        password: 'hashed_password',
        role: 'therapist'
      });
      await testTherapist.save();
      console.log('✅ Test therapist created');
    }
    
    // Test 2: Test crisis detection
    console.log('\n📋 Test 2: Testing crisis detection...');
    const testMessages = [
      'I want to kill myself',
      'I am thinking about suicide',
      'I feel hopeless and want to die',
      'I am going to hurt myself',
      'I am having a great day today',
      'I died laughing at that joke'
    ];
    
    for (const message of testMessages) {
      const analysis = await analyzeCrisisLevel(message);
      console.log(`Message: "${message}"`);
      console.log(`  Level: ${analysis.level}, Type: ${analysis.type}, Confidence: ${analysis.confidence}`);
      console.log(`  Crisis Detected: ${analysis.level >= 3 ? 'YES' : 'NO'}\n`);
    }
    
    // Test 3: Test therapist availability
    console.log('📋 Test 3: Testing therapist availability...');
    const availableTherapist = await findAvailableTherapist();
    if (availableTherapist) {
      console.log(`✅ Available therapist found: ${availableTherapist.username}`);
    } else {
      console.log('❌ No available therapists found');
    }
    
    // Test 4: Test crisis session booking
    console.log('\n📋 Test 4: Testing crisis session booking...');
    if (availableTherapist) {
      const testUserId = '507f1f77bcf86cd799439011'; // Test user ID
      const crisisAnalysis = {
        level: 4,
        type: 'suicidal_ideation',
        confidence: 0.9
      };
      
      const appointment = await bookCrisisSession(testUserId, availableTherapist._id, 30, crisisAnalysis);
      if (appointment) {
        console.log('✅ Crisis session booked successfully!');
        console.log(`  Appointment ID: ${appointment._id}`);
        console.log(`  Scheduled Time: ${appointment.scheduledTime}`);
        console.log(`  Status: ${appointment.status}`);
      } else {
        console.log('❌ Failed to book crisis session');
      }
    }
    
    // Test 5: Check existing appointments
    console.log('\n📋 Test 5: Checking existing appointments...');
    const appointments = await Appointment.find({}).populate('therapist', 'username').populate('client', 'username');
    console.log(`Found ${appointments.length} appointments:`);
    appointments.forEach(apt => {
      console.log(`  - ${apt.title} with ${apt.therapist?.username || 'Unknown'} at ${apt.scheduledTime}`);
    });
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testCrisisDetection();
