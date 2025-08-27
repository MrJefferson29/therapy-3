const Chat = require('../models/chat');
const User = require('../models/user');
const chatEncryption = require('../utils/chatEncryption'); // Added this import

// Get chat history for a room
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.query; // Get userId for decryption
    
    const messages = await Chat.find({ roomId }).sort({ timestamp: 1 });
    
    // If no userId provided, return encrypted messages as-is (for backward compatibility)
    if (!userId) {
      console.log(`No userId provided for room ${roomId}, returning encrypted messages`);
      return res.status(200).json(messages);
    }
    
    // Decrypt messages for the requesting user
    const decryptedMessages = await Promise.all(
      messages.map(async (msg) => {
        try {
          if (msg.encryption && msg.encryption.isEncrypted) {
            // Generate session key for this room
            const sessionKey = chatEncryption.generateSessionKey(
              roomId, 
              msg.sender.toString(), 
              msg.receiver.toString()
            );
            
            // Decrypt the message
            const decryptedMessage = chatEncryption.decryptMessage(
              {
                encrypted: msg.message,
                iv: msg.encryption.iv,
                tag: msg.encryption.tag
              },
              sessionKey
            );
            
            // Verify message integrity
            if (!chatEncryption.verifyMessageIntegrity(decryptedMessage, msg.encryption.messageHash)) {
              console.error('Message integrity check failed for message:', msg._id);
              return { ...msg.toObject(), message: '[Message Integrity Check Failed]' };
            }
            
            return { ...msg.toObject(), decryptedMessage };
          }
          return msg.toObject();
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return { ...msg.toObject(), message: '[Encrypted Message - Unable to Decrypt]' };
        }
      })
    );
    
    res.status(200).json(decryptedMessages);
  } catch (err) {
    console.error('Error in getChatHistory:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Save a new chat message
exports.saveMessage = async (req, res) => {
  try {
    const { roomId, sender, receiver, message } = req.body;
    
    // Validate input
    if (!roomId || !sender || !receiver || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Generate session key for this room
    const sessionKey = chatEncryption.generateSessionKey(roomId, sender, receiver);
    
    // Encrypt the message
    const encryptedData = chatEncryption.encryptMessage(message, sessionKey);
    
    // Generate message hash for integrity
    const messageHash = chatEncryption.hashMessage(message);
    
    // Create chat object with encrypted data
    const chat = new Chat({
      roomId,
      sender,
      receiver,
      message: encryptedData.encrypted, // Store encrypted message
      encryption: {
        isEncrypted: true,
        algorithm: 'aes-256-gcm',
        iv: encryptedData.iv,
        tag: encryptedData.tag,
        messageHash: messageHash
      }
    });
    
    await chat.save();
    
    // Return the chat object with original message for immediate display
    const chatResponse = chat.toObject();
    chatResponse.originalMessage = message; // Include original message for response
    chatResponse.message = message; // Use original message for display
    
    res.status(201).json(chatResponse);
  } catch (err) {
    console.error('Error saving chat message:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all unique users who have chatted with a therapist
exports.getTherapistChats = async (req, res) => {
  try {
    const { therapistId } = req.params;
    // Find all chats where the therapist is the receiver
    const chats = await Chat.find({ receiver: therapistId }).populate('sender', 'username email profileImage');
    // Get unique users
    const userMap = {};
    chats.forEach(chat => {
      if (chat.sender && chat.sender._id) {
        userMap[chat.sender._id] = {
          userId: chat.sender._id,
          username: chat.sender.username,
          email: chat.sender.email,
          profileImage: chat.sender.profileImage,
        };
      }
    });
    res.status(200).json(Object.values(userMap));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all unique therapists who have chatted with a user
exports.getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    // Find all chats where the user is the sender
    const chats = await Chat.find({ sender: userId }).populate('receiver', 'username email profileImage');
    // Get unique therapists
    const therapistMap = {};
    chats.forEach(chat => {
      if (chat.receiver && chat.receiver._id) {
        therapistMap[chat.receiver._id] = {
          therapistId: chat.receiver._id,
          username: chat.receiver.username,
          email: chat.receiver.email,
          profileImage: chat.receiver.profileImage,
          lastMessage: chat.message,
          lastMessageTime: chat.timestamp,
        };
      }
    });
    res.status(200).json(Object.values(therapistMap));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Test encryption functionality
exports.testEncryption = async (req, res) => {
  try {
    const testResult = chatEncryption.testEncryptionCycle();
    res.status(200).json({
      message: 'Encryption test completed',
      success: testResult
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 