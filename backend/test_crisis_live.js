// Test script for live crisis detection and auto-booking
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/user');
const Appointment = require('./models/appointment');
const Session = require('./models/session');
const Ai = require('./models/ai');

// Import crisis detection functions
const { analyzeCrisisLevel, findAvailableTherapist, bookCrisisSession } = require('./controllers/ai');

async function testLiveCrisisDetection() {
  try {
    console.log('🧪 Testing Live Crisis Detection and Auto-Booking System\n');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/therapy-app');
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Check therapists in database
    console.log('📋 Test 1: Checking therapists in database...');
    const therapists = await User.find({ role: 'therapist' });
    console.log(`Found ${therapists.length} therapists in the system`);
    
    if (therapists.length === 0) {
      console.log('❌ No therapists found! Creating test therapists...');
      
      const testTherapists = [
        {
          username: 'dr_smith',
          email: 'dr.smith@therapy.com',
          password: 'hashed_password_123',
          role: 'therapist',
          firstName: 'Dr. Sarah',
          lastName: 'Smith',
          specialization: 'Crisis Intervention'
        },
        {
          username: 'dr_jones',
          email: 'dr.jones@therapy.com',
          password: 'hashed_password_456',
          role: 'therapist',
          firstName: 'Dr. Michael',
          lastName: 'Jones',
          specialization: 'Mental Health'
        }
      ];
      
      for (const therapistData of testTherapists) {
        const therapist = new User(therapistData);
        await therapist.save();
        console.log(`✅ Created therapist: ${therapist.username}`);
      }
    } else {
      console.log('✅ Therapists found:');
      therapists.forEach(t => console.log(`  - ${t.username} (${t.email})`));
    }
    
    // Test 2: Check existing appointments
    console.log('\n📋 Test 2: Checking existing appointments...');
    const appointments = await Appointment.find({}).populate('therapist', 'username').populate('client', 'username');
    console.log(`Found ${appointments.length} existing appointments:`);
    appointments.forEach(apt => {
      console.log(`  - ${apt.title} with ${apt.therapist?.username || 'Unknown'} at ${apt.scheduledTime}`);
    });
    
    // Test 3: Test crisis detection
    console.log('\n📋 Test 3: Testing crisis detection...');
    const crisisMessages = [
      'I want to kill myself',
      'I am thinking about suicide',
      'I am going to hurt myself',
      'I feel hopeless and want to die'
    ];
    
    for (const message of crisisMessages) {
      console.log(`\nTesting message: "${message}"`);
      const analysis = await analyzeCrisisLevel(message);
      console.log(`  Crisis Level: ${analysis.level}`);
      console.log(`  Crisis Type: ${analysis.type}`);
      console.log(`  Confidence: ${analysis.confidence.toFixed(2)}`);
      console.log(`  Should Auto-Book: ${analysis.level >= 3 ? 'YES' : 'NO'}`);
      
      if (analysis.level >= 3) {
        console.log('  🚨 CRISIS DETECTED - Testing auto-booking...');
        
        // Test therapist availability
        const availableTherapist = await findAvailableTherapist();
        if (availableTherapist) {
          console.log(`  ✅ Available therapist found: ${availableTherapist.username}`);
          
          // Test booking
          const testUserId = '507f1f77bcf86cd799439011'; // Test user ID
          const urgencyMinutes = analysis.level >= 5 ? 15 : analysis.level >= 4 ? 30 : 45;
          
          console.log(`  📅 Attempting to book crisis session (${urgencyMinutes} minutes)...`);
          const appointment = await bookCrisisSession(testUserId, availableTherapist._id, urgencyMinutes, analysis);
          
          if (appointment) {
            console.log(`  ✅ Crisis session booked successfully!`);
            console.log(`    - Appointment ID: ${appointment._id}`);
            console.log(`    - Scheduled Time: ${appointment.scheduledTime}`);
            console.log(`    - Status: ${appointment.status}`);
          } else {
            console.log(`  ❌ Failed to book crisis session`);
          }
        } else {
          console.log(`  ❌ No available therapists found`);
        }
      }
    }
    
    // Test 4: Check appointments after booking
    console.log('\n📋 Test 4: Checking appointments after booking...');
    const newAppointments = await Appointment.find({}).populate('therapist', 'username').populate('client', 'username');
    console.log(`Total appointments now: ${newAppointments.length}`);
    newAppointments.forEach(apt => {
      console.log(`  - ${apt.title} with ${apt.therapist?.username || 'Unknown'} at ${apt.scheduledTime}`);
    });
    
    console.log('\n✅ Live crisis detection test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testLiveCrisisDetection();
