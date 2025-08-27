const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const IndexRoute = require("./routes/index")
const morgan = require("morgan")
const therapistRoutes = require('./routes/therapist');
const appointmentRoutes = require('./routes/appointment');
const chatRoutes = require('./routes/chat');
const chatEncryption = require('./utils/chatEncryption');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"))

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handler for chat
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room for a user-to-therapist chat
    socket.on('joinRoom', ({ roomId }) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle sending a message
    socket.on('chatMessage', async (data) => {
        try {
            // data: { roomId, senderId, receiverId, message, timestamp }
            
            // Validate required data
            if (!data.roomId || !data.message) {
                throw new Error('Missing required data: roomId or message');
            }
            
            // Use senderId/receiverId if available, otherwise fall back to sender/receiver
            const senderId = data.senderId || data.sender;
            const receiverId = data.receiverId || data.receiver;
            
            if (!senderId || !receiverId) {
                throw new Error('Missing sender or receiver information');
            }
            
            console.log(`Processing chat message from user ${data.senderId} in room ${data.roomId}`);
            
            // Generate session key for this room
            const sessionKey = chatEncryption.generateSessionKey(
                data.roomId, 
                senderId, 
                receiverId
            );
            
            // Encrypt the message
            const encryptedData = chatEncryption.encryptMessage(data.message, sessionKey);
            
            // Generate message hash for integrity
            const messageHash = chatEncryption.hashMessage(data.message);
            
            // Create secure message with encryption metadata
            const secureMessage = {
                roomId: data.roomId,
                sender: senderId,        // Use consistent field names
                receiver: receiverId,    // Use consistent field names
                message: data.message,   // Keep original message for display
                timestamp: data.timestamp || new Date().toISOString(),
                encryptedMessage: encryptedData.encrypted, // Store encrypted version
                encryption: {
                    isEncrypted: true,
                    algorithm: 'aes-256-gcm',
                    iv: encryptedData.iv,
                    tag: encryptedData.tag,
                    messageHash: messageHash
                }
            };
            
            console.log('🔐 Sending secure message via socket:', {
                roomId: secureMessage.roomId,
                sender: secureMessage.sender,
                message: secureMessage.message,
                encryptedMessage: secureMessage.encryptedMessage.substring(0, 20) + '...'
            });
            
            // Broadcast encrypted message to room
            io.to(data.roomId).emit('chatMessage', secureMessage);
            
            console.log(`Encrypted message sent to room ${data.roomId}`);
        } catch (error) {
            console.error('Error processing chat message:', error);
            // Send error back to sender
            socket.emit('chatError', { 
                message: 'Failed to encrypt message',
                error: error.message 
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Routes
app.use('/', IndexRoute);
app.use('/therapist', therapistRoutes);
app.use('/appointment', appointmentRoutes);
app.use('/chat', chatRoutes);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Bind to all network interfaces

server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`Accessible at: http://192.168.1.177:${PORT}`);
});

// Handle memory leak warning
server.setMaxListeners(15); // Increase the listener limit