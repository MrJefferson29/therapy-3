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
const aiRoutes = require('./routes/ai');
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
        console.log(`🚪 Socket ${socket.id} joined room ${roomId}`);
        console.log(`📊 Room ${roomId} now has ${io.sockets.adapter.rooms.get(roomId)?.size || 0} users`);
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
            
            // Save message to database first
            const Chat = require('./models/chat');
            const newMessage = new Chat({
                roomId: data.roomId,
                sender: senderId,
                receiver: receiverId,
                message: encryptedData.encrypted, // Store encrypted message
                timestamp: secureMessage.timestamp,
                encryption: secureMessage.encryption
            });
            
            await newMessage.save();
            console.log('💾 Message saved to database with ID:', newMessage._id);
            
            // Add the database ID to the message before broadcasting
            const messageToBroadcast = {
                ...secureMessage,
                _id: newMessage._id
            };
            
            // Broadcast encrypted message to room
            const roomSize = io.sockets.adapter.rooms.get(data.roomId)?.size || 0;
            console.log(`📤 Broadcasting message to room ${data.roomId} with ${roomSize} users`);
            io.to(data.roomId).emit('chatMessage', messageToBroadcast);
            
            console.log(`✅ Encrypted message sent to room ${data.roomId}`);
        } catch (error) {
            console.error('Error processing chat message:', error);
            // Send error back to sender
            socket.emit('chatError', { 
                message: 'Failed to encrypt message',
                error: error.message 
            });
        }
    });

    socket.on('leaveRoom', ({ roomId }) => {
        socket.leave(roomId);
        console.log(`🚪 Socket ${socket.id} left room ${roomId}`);
        console.log(`📊 Room ${roomId} now has ${io.sockets.adapter.rooms.get(roomId)?.size || 0} users`);
    });

    socket.on('ping', ({ roomId, timestamp }) => {
        console.log(`🏓 Ping received from socket ${socket.id} in room ${roomId} at ${new Date(timestamp).toISOString()}`);
        socket.emit('pong', { roomId, timestamp, serverTime: Date.now() });
    });

    socket.on('disconnect', () => {
        console.log('🔌 User disconnected:', socket.id);
    });
});

// Routes
app.use('/', IndexRoute);
app.use('/therapist', therapistRoutes);
app.use('/appointment', appointmentRoutes);
app.use('/chat', chatRoutes);
app.use('/ai', aiRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Production server accessible at: https://therapy-3.onrender.com`);
});

// Handle memory leak warning
server.setMaxListeners(15); // Increase the listener limit