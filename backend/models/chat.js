const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true }, // This will store encrypted content
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['message', 'appointment_notification', 'appointment_approved', 'appointment_declined'], default: 'message' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  // Encryption metadata
  encryption: {
    isEncrypted: { type: Boolean, default: true },
    algorithm: { type: String, default: 'aes-256-gcm' },
    iv: { type: String, required: true }, // Initialization vector
    tag: { type: String, required: true }, // Authentication tag
    messageHash: { type: String, required: true } // SHA-256 hash for integrity
  }
});

module.exports = mongoose.model('Chat', chatSchema); 