const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  meetingLink: { type: String },
  scheduledTime: { type: Date, required: true },
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'declined', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'crisis'],
    default: 'normal'
  },
  crisisDetected: {
    type: Boolean,
    default: false
  },
  sessionId: {
    type: String,
    required: false
  },
  moodAtCrisis: {
    type: String,
    required: false
  },
  createdDate: { type: Date, default: Date.now },
  approvedAt: Date,
  declinedAt: Date,
  notes: String,
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema); 