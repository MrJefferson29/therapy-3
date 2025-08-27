const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Get chat history for a room
router.get('/:roomId', chatController.getChatHistory);

// Save a new chat message
router.post('/', chatController.saveMessage);

// Get all unique users who have chatted with a therapist
router.get('/therapist/:therapistId', chatController.getTherapistChats);

// Get all unique therapists who have chatted with a user
router.get('/user/:userId', chatController.getUserChats);

// Test encryption functionality
router.get('/test-encryption', chatController.testEncryption);

module.exports = router; 