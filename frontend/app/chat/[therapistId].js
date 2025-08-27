import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Animated, Easing, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import AppointmentMessage from '../../components/AppointmentMessage';
import AppointmentApprovalModal from '../../components/AppointmentApprovalModal';
import AppointmentRequestButton from '../../components/AppointmentRequestButton';
import chatEncryption from '../../utils/chatEncryption';

const API_URL = 'http://192.168.1.177:5000';
const socket = io(API_URL);

export default function ChatWithTherapist() {
  const { therapistId } = useLocalSearchParams();
  const { user, token } = useAuth();
  const { colors, isDark = false } = useTheme();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [input, setInput] = useState('');
  const [therapist, setTherapist] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const roomId = user && therapistId ? [user._id, therapistId].sort().join('_') : '';
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    socket.emit('joinRoom', { roomId });
    fetchMessages();
    fetchAppointments();
    socket.on('chatMessage', (msg) => {
      console.log('🔔 Socket received message:', msg);
      console.log('🔍 Message details:', {
        roomId: msg.roomId,
        sender: msg.sender || msg.senderId,
        message: msg.message,
        encryptedMessage: msg.encryptedMessage ? msg.encryptedMessage.substring(0, 20) + '...' : 'none',
        hasEncryption: !!msg.encryption
      });
      
      if (msg.roomId === roomId) {
        console.log('✅ Message matches room, adding to messages');
        console.log('📝 Message content:', msg.message);
        console.log('👤 Sender:', msg.senderId || msg.sender);
        
        // Check if this message is from the current user (avoid duplicate)
        const isFromCurrentUser = (msg.senderId || msg.sender) === user._id;
        
        if (isFromCurrentUser) {
          console.log('🔄 Message from current user, updating existing local message');
          // Update the local message with the real message from server
          setMessages(prev => prev.map(existingMsg => 
            existingMsg.isLocal && existingMsg.message === msg.message 
              ? { ...msg, isLocal: false }
              : existingMsg
          ));
        } else {
          console.log('➕ Adding new message from other user');
          // Check if message already exists to prevent duplicates
          setMessages(prev => {
            const messageExists = prev.some(existingMsg => 
              existingMsg._id === msg._id || 
              (existingMsg.message === msg.message && 
               existingMsg.sender === msg.sender && 
               Math.abs(new Date(existingMsg.timestamp) - new Date(msg.timestamp)) < 5000) // Within 5 seconds
            );
            
            if (messageExists) {
              console.log('🔄 Message already exists, skipping duplicate');
              return prev;
            }
            
            return [...prev, msg];
          });
        }
      } else {
        console.log('❌ Message room mismatch:', msg.roomId, 'vs', roomId);
      }
    });
    return () => {
      socket.off('chatMessage');
      socket.emit('leaveRoom', { roomId });
    };
  }, [roomId]);

  useEffect(() => {
    if (therapistId) {
      fetchTherapist();
    }
  }, [therapistId]);

  // Fade in new messages
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  }, [messages]);

  // Scroll on new message
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, appointments]);

  const fetchMessages = async () => {
    try {
      console.log(`Fetching messages for room: ${roomId}`);
      
      // Always include userId for decryption
      const response = await fetch(`${API_URL}/chat/${roomId}?userId=${user._id}`);
      
      if (!response.ok) {
        console.error('Messages API error:', response.status, response.statusText);
        setMessages([]);
        return;
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Messages API returned non-array data:', data);
        setMessages([]);
        return;
      }
      
      console.log(`Fetched ${data.length} messages`);
      
      // Process messages to ensure we have the decrypted content
      const processedMessages = data.map(msg => {
        // If message has decryptedMessage field, use it
        if (msg.decryptedMessage) {
          return { ...msg, message: msg.decryptedMessage };
        }
        // If message has originalMessage field, use it
        if (msg.originalMessage) {
          return { ...msg, message: msg.originalMessage };
        }
        // Otherwise, use the message field as-is
        return msg;
      });
      
      console.log('📝 Processed messages:', processedMessages.map(m => ({ 
        id: m._id, 
        message: m.message, 
        sender: m.sender,
        timestamp: m.timestamp 
      })));
      
      setMessages(processedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]); // Set empty array on error
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_URL}/appointment/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Appointments API error:', response.status, response.statusText);
        setAppointments([]);
        return;
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Appointments API returned non-array data:', data);
        setAppointments([]);
        return;
      }
      
      // Filter appointments for this specific therapist
      const filteredAppointments = data.filter(app => 
        (app.therapist._id === therapistId || app.client._id === therapistId)
      );
      setAppointments(filteredAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    }
  };

  const fetchTherapist = async () => {
    try {
      const response = await fetch(`${API_URL}/user/${therapistId}`);
      
      if (!response.ok) {
        console.error('Therapist API error:', response.status, response.statusText);
        setTherapist(null);
        return;
      }
      
      const data = await response.json();
      setTherapist(data);
    } catch (error) {
      console.error('Error fetching therapist:', error);
      setTherapist(null);
    }
  };

  const requestAppointment = () => {
    if (!therapist) return;
    
    Alert.alert(
      'Request Appointment',
      `Request an appointment with ${therapist.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            router.push(`/request-appointment?therapistId=${therapistId}`);
          },
        },
      ]
    );
  };

  const handleApproveAppointment = async (appointment) => {
    try {
      const response = await fetch(`${API_URL}/appointment/${appointment._id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: '' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve appointment');
      }

      Alert.alert('Success', 'Appointment approved successfully');
      fetchAppointments();
    } catch (error) {
      console.error('Error approving appointment:', error);
      Alert.alert('Error', 'Failed to approve appointment');
    }
  };

  const handleDeclineAppointment = async (appointment) => {
    Alert.alert(
      'Decline Appointment',
      'Are you sure you want to decline this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/appointment/${appointment._id}/decline`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ notes: '' }),
              });

              if (!response.ok) {
                throw new Error('Failed to decline appointment');
              }

              Alert.alert('Success', 'Appointment declined successfully');
              fetchAppointments();
            } catch (error) {
              console.error('Error declining appointment:', error);
              Alert.alert('Error', 'Failed to decline appointment');
            }
          },
        },
      ]
    );
  };

  const handleAppointmentUpdated = (updatedAppointment) => {
    setAppointments(prev => 
      prev.map(app => 
        app._id === updatedAppointment._id ? updatedAppointment : app
      )
    );
  };

  const handleMenuRequestAppointment = () => {
    setShowMenu(false);
    requestAppointment();
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    
    // Check if user is loaded
    if (!user || !user._id) {
      console.error('❌ User not loaded, cannot send message');
      Alert.alert('Error', 'User session not loaded. Please try again.');
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    console.log('🚀 Sending message:', input);
    console.log('🏠 Room ID:', roomId);
    console.log('👤 User ID:', user._id);
    console.log('👨‍⚕️ Therapist ID:', therapistId);
    
    const msg = {
      roomId,
      sender: user._id,
      receiver: therapistId,
      message: input,
      timestamp: new Date().toISOString(),
    };
    
    // Socket message with required fields for encryption
    const socketMsg = {
      roomId,
      senderId: user._id,        // Required by backend encryption
      receiverId: therapistId,   // Required by backend encryption
      message: input,
      timestamp: new Date().toISOString(),
    };
    
    console.log('📤 Emitting socket message:', socketMsg);
    socket.emit('chatMessage', socketMsg);
    
    // Add message to local state immediately for instant display
    const localMessage = {
      ...msg,
      _id: Date.now().toString(), // Temporary ID for local display
      timestamp: new Date().toISOString(),
      isLocal: true // Flag to identify local messages
    };
    
    console.log('📱 Adding local message to state:', localMessage);
    setMessages(prev => [...prev, localMessage]);
    
    // Clear input
    setInput('');
    
    // Save message to database
    fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(msg),
    }).then(async response => {
      if (response.ok) {
        console.log('✅ Message saved to database');
        try {
          // Update local message with real database ID
          const savedMessage = await response.json();
          console.log('💾 Saved message data:', savedMessage);
          setMessages(prev => prev.map(msg => 
            msg.isLocal && msg.message === savedMessage.message
              ? { ...savedMessage, isLocal: false }
              : msg
          ));
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
        }
      } else {
        console.error('❌ Failed to save message to database');
        // Remove local message if save failed
        setMessages(prev => prev.filter(msg => !msg.isLocal));
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    }).catch(error => {
      console.error('❌ Error saving message:', error);
      // Remove local message if save failed
      setMessages(prev => prev.filter(msg => !msg.isLocal));
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }).finally(() => {
      setIsLoading(false);
    });
  };

  const renderMessage = ({ item }) => {
    console.log('🎨 Rendering message item:', item);
    
    if (item.type === 'appointment') {
      const appointment = appointments.find(app => app._id === item.appointmentId);
      if (!appointment) return null;
      
      const isOwnMessage = appointment.client._id === user._id;
      const isTherapist = user?.role === 'therapist';
      
      return (
        <AppointmentMessage
          appointment={appointment}
          isTherapist={isTherapist}
          onApprove={handleApproveAppointment}
          onDecline={handleDeclineAppointment}
          isOwnMessage={isOwnMessage}
        />
      );
    }

    // Determine if this is the user's own message
    const isOwnMessage = (item.sender === user._id) || (item.senderId === user._id);
    
    return (
      <Animated.View 
        style={[
          styles.messageRow, 
          isOwnMessage ? styles.myRow : styles.theirRow,
          { opacity: fadeAnim }
        ]}
      >
        <View style={[
          styles.bubble, 
          isOwnMessage ? 
            { 
              backgroundColor: isDark ? '#3A5A3A' : '#dcf8c6',
              alignSelf: 'flex-end',
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 0,
            } : 
            { 
              backgroundColor: isDark ? '#2A2A2A' : '#fff',
              alignSelf: 'flex-start',
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomRightRadius: 10,
              borderBottomLeftRadius: 0,
            }
        ]}>
          <Text style={[styles.messageText, { color: isDark ? '#E8E8E8' : '#303030' }]}>
            {item.message}
            {item.isLocal && <Text style={{ fontStyle: 'italic', opacity: 0.7 }}> (sending...)</Text>}
          </Text>
          <Text style={[
            styles.timeText, 
            { 
              color: isDark ? '#B0B0B0' : '#555',
              textAlign: isOwnMessage ? 'right' : 'left'
            }
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Combine messages and appointments for display
  const combinedMessages = [
    ...(Array.isArray(messages) ? messages.map(msg => ({ ...msg, type: 'message' })) : []),
    ...(Array.isArray(appointments) ? appointments.map(app => ({ 
      type: 'appointment', 
      appointmentId: app._id, 
      timestamp: app.createdDate 
    })) : [])
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  console.log('📊 Messages state:', messages);
  console.log('🔗 Combined messages:', combinedMessages);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : '#ece5dd' }]}>
      <LinearGradient colors={isDark ? colors.gradientSecondary : ["#ece5dd", "#f2fff6"]} style={styles.gradient}>
        {/* Header */}
        <LinearGradient colors={colors.gradientPrimary} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)' }]}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {therapist && (
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{therapist.username}</Text>
              <Text style={styles.headerSubtitle}>Therapist</Text>
            </View>
          )}
          {/* Three dots menu */}
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)' }]} onPress={() => setShowMenu(true)}>
            <Ionicons name="ellipsis-vertical" size={28} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        {/* Menu Modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity style={[styles.menuOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)' }]} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={[styles.menuContainer, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handleMenuRequestAppointment}>
                <Text style={[styles.menuItemText, { color: isDark ? '#E8E8E8' : '#222' }]}>Request Appointment</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        
        <KeyboardAvoidingView 
          style={[styles.keyboardContainer, { backgroundColor: isDark ? '#1A1A1A' : 'transparent' }]} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={combinedMessages}
            keyExtractor={(item, index) => item.type === 'appointment' ? item.appointmentId : index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={{ 
              padding: 16, 
              paddingBottom: 24,
              backgroundColor: isDark ? '#1A1A1A' : 'transparent'
            }}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: isDark ? '#1A1A1A' : 'transparent' }}
          />
          
          {/* Input Bar */}
          <View style={[styles.inputWrapper, { 
            backgroundColor: isDark ? 'rgba(42,42,42,0.9)' : 'rgba(255,255,255,0.9)',
            borderTopColor: isDark ? '#454545' : '#ddd'
          }]}>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#353535' : '#fff' }]}>
              <TextInput
                style={[styles.textInput, { 
                  color: isDark ? '#E8E8E8' : '#303030',
                  backgroundColor: isDark ? '#353535' : '#fff'
                }]}
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor={isDark ? '#B0B0B0' : "#888"}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity 
                onPress={sendMessage}
                style={[
                  styles.sendButton,
                  { backgroundColor: isDark ? '#4BBE8A' : '#075E54' },
                  (!input.trim() || isLoading) && { opacity: 0.5 }
                ]}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Text style={{ color: '#fff', fontSize: 12 }}>...</Text>
                ) : (
                  <Ionicons name="send" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Appointment Approval Modal */}
        <AppointmentApprovalModal
          visible={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          user={user}
          token={token}
          onAppointmentUpdated={handleAppointmentUpdated}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ece5dd" },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  backBtn: { 
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 8,
  },
  headerCenter: { 
    flex: 1, 
    alignItems: "center" 
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#e0ffe7",
    marginTop: 2,
    fontWeight: "500",
  },
  avatarWrap: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 2,
  },
  keyboardContainer: {
    flex: 1,
  },
  messageRow: { 
    flexDirection: 'row', 
    marginBottom: 12 
  },
  myRow: { 
    justifyContent: 'flex-end' 
  },
  theirRow: { 
    justifyContent: 'flex-start' 
  },
  bubble: {
    maxWidth: '75%',
    marginVertical: 4,
    padding: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
    borderTopLeftRadius: 10,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 0,
  },
  theirBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 0,
  },
  messageText: { 
    fontSize: 16, 
    color: '#303030' 
  },
  timeText: { 
    fontSize: 10, 
    color: '#555', 
    textAlign: 'right', 
    marginTop: 4 
  },
  inputWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    marginBottom: 8,
  },
  textInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#303030', 
    paddingVertical: 4 
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#075E54',
    padding: 10,
    borderRadius: 25,
  },
  menuBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: 60,
    marginRight: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuItemText: {
    fontSize: 16,
    color: '#222',
  },
});
