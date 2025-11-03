import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Modal,
  Text,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import moment from "moment";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

const API_BASE_URL = "https://therapy-3.onrender.com";
const TOKEN_KEY = "token";
const { width } = Dimensions.get("window");
const moodEmojis = ["😢", "😞", "😕", "😐", "🙂", "😊", "😃", "😁", "🤩", "😍"];

const getWelcomeMessage = (mood) => {
  const messages = {
    1: "I can see you're having a really tough day. I'm here to listen and support you through this difficult time. What's been weighing on your mind?",
    2: "It sounds like you're going through a rough patch. I want you to know that it's okay to not be okay. Would you like to talk about what's been bothering you?",
    3: "I sense you're feeling a bit down today. Sometimes just talking things out can help lighten the load. What's on your mind?",
    4: "You seem to be having a challenging day. I'm here to listen and help you work through whatever you're dealing with. What would you like to discuss?",
    5: "Hello! How are you feeling today? I'm here to chat and support you with whatever's on your mind.",
    6: "Hi there! I'm glad you're here. How has your day been so far? I'm ready to listen and chat about anything you'd like.",
    7: "Great to see you! You seem to be in a pretty good mood today. What's been going well for you lately?",
    8: "Welcome! I can sense your positive energy today. What's been making you feel so good? I'd love to hear about it!",
    9: "Hello! You're radiating such positive vibes today! What's been bringing you joy lately? I'm excited to hear about your day!",
    10: "Wow! You're absolutely glowing with happiness today! 🌟 What's been making your day so amazing? I'd love to celebrate the good things with you!"
  };
  return messages[mood] || messages[5];
};

export default function Chat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, user } = useAuth();
  const { colors, isDark = false } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [mood, setMood] = useState(5);
  const [isResetting, setIsResetting] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isTypingEffect, setIsTypingEffect] = useState(false);
  const [inputBarHeight, setInputBarHeight] = useState(0);
  const [hasWelcomeMessage, setHasWelcomeMessage] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Keyboard handling
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // User-specific storage keys
  const getChatHistoryKey = () => {
    const userId = user?.id || user?._id || 'anonymous';
    const key = `ai_chat_history_${userId}`;
    console.log('Using chat history key:', key, 'for user:', userId);
    return key;
  };
  const getSessionIdKey = () => {
    const userId = user?.id || user?._id || 'anonymous';
    const key = `ai_session_id_${userId}`;
    console.log('Using session ID key:', key, 'for user:', userId);
    return key;
  };
  
  // Debug function to log message saving
  const saveMessagesToStorage = async (messages) => {
    try {
      const key = getChatHistoryKey();
      const messageData = JSON.stringify(messages);
      await AsyncStorage.setItem(key, messageData);
      console.log(`Saved ${messages.length} messages to storage with key: ${key}`);
    } catch (error) {
      console.error('Failed to save messages to storage:', error);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!token) {
      setIsAuthChecking(false);
      Alert.alert(
        "Authentication Required",
        "Please log in to use the chat feature.",
        [
          {
            text: "OK",
            onPress: () => router.push("/LoginScreen"),
          },
        ],
        { cancelable: false }
      );
      return;
    }

    setIsAuthChecking(false);
    
    // Only load data if user is available
    if (user) {
    (async () => {
      try {
          // Clean up old global storage keys to prevent data leakage
          await AsyncStorage.removeItem("ai_chat_history");
          await AsyncStorage.removeItem("ai_session_id");
          
          const savedMessages = await AsyncStorage.getItem(getChatHistoryKey());
          const savedSession = await AsyncStorage.getItem(getSessionIdKey());
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
          setHasWelcomeMessage(parsedMessages.length > 0);
          // Show mood modal if no messages exist (first time or after reset)
          if (parsedMessages.length === 0) {
            setShowMoodModal(true);
          }
        } else {
          // No saved messages, show mood modal for first time
          setShowMoodModal(true);
        }
        if (savedSession) setSessionId(savedSession);
      } catch (e) {
        console.error(e);
      }
    })();
    }

    // keyboard listeners - account for text suggestion panel
    const subShow = Keyboard.addListener('keyboardDidShow', (e) => {
      console.log('Keyboard height:', e.endCoordinates.height);
      // Add extra height for text suggestion panel (typically 40-60px on Android)
      const suggestionPanelHeight = Platform.OS === 'android' ? 50 : 0;
      const totalHeight = e.endCoordinates.height + suggestionPanelHeight;
      
      Animated.timing(keyboardHeight, {
        toValue: totalHeight,
        duration: 250,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      }).start();
    });
    const subHide = Keyboard.addListener('keyboardDidHide', () => {
      console.log('Keyboard hiding');
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 250,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      }).start();
      // scroll to bottom when keyboard hides
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [token, router, user]);

  // fade in new messages
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  }, [messages]);

  // scroll on new message
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // typewriter effect
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.sender === "bot" && last.text && !last.isError) {
      setIsTypingEffect(true);
      let i = 0;
      setTypingText("");
      const iv = setInterval(() => {
        i++;
        setTypingText(last.text.slice(0, i));
        if (i >= last.text.length) {
          clearInterval(iv);
          setIsTypingEffect(false);
        }
      }, 18);
      return () => clearInterval(iv);
    } else setTypingText("");
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || !token || !user) {
      if (!token || !user) {
        Alert.alert("Authentication Required", "Please log in to use the chat feature.");
      }
      return;
    }
    const userMsg = {
      text: inputMessage,
      sender: "user",
      time: new Date().toISOString(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputMessage("");
    setIsLoading(true);
    try {
      console.log('Sending request with token:', token);
      const res = await fetch(`${API_BASE_URL}/ai/session-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: userMsg.text, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI error");
      
      // Create the bot response message
      const botResponse = { 
        text: data.text, 
        sender: "bot", 
        time: new Date().toISOString(),
        model: data.model, // Store which model was used
        crisisDetected: data.crisisDetected || false,
        crisisLevel: data.crisisLevel || 0,
        crisisType: data.crisisType || 'none',
        crisisConfidence: data.crisisConfidence || 0,
        therapistAssigned: data.therapistAssigned || null,
        therapistName: data.therapistName || null,
        therapistEmail: data.therapistEmail || null,
        appointmentScheduled: data.appointmentScheduled || null,
        appointmentId: data.appointmentId || null,
        urgencyMinutes: data.urgencyMinutes || null
      };
      
      // Update messages with both user message and bot response
      const updatedWithResponse = [...updated, botResponse];
      setMessages(updatedWithResponse);
      
      // Save the complete updated message history
      await saveMessagesToStorage(updatedWithResponse);

      // Advanced crisis handling with detailed response
      if (data.crisisDetected) {
        const crisisLevel = data.crisisLevel || 0;
        const therapistAssigned = data.therapistAssigned;
        const therapistName = data.therapistName;
        const therapistEmail = data.therapistEmail;
        const appointmentScheduled = data.appointmentScheduled;
        const appointmentId = data.appointmentId;
        const urgencyMinutes = data.urgencyMinutes;
        
        let alertTitle, alertMessage, alertButtons;
        
        if (crisisLevel >= 5) {
          // Critical crisis
          alertTitle = "🚨 CRITICAL CRISIS DETECTED";
          alertMessage = therapistAssigned 
            ? `IMMEDIATE HELP: An emergency session has been booked with ${therapistName} (${therapistEmail}) and will be available within ${urgencyMinutes} minutes. Please stay safe - help is on the way right now!`
            : `IMMEDIATE HELP NEEDED: Please call emergency services (911) or the National Suicide Prevention Lifeline (988) immediately.`;
          alertButtons = [
            { text: "Call 911", onPress: () => {
              Alert.alert("Emergency", "Please call 911 immediately");
            }},
            { text: "Call 988", onPress: () => {
              Alert.alert("Crisis Line", "Please call 988 - National Suicide Prevention Lifeline");
            }},
            { text: "View Therapist", onPress: () => router.push("/MyTherapist") }
          ];
        } else if (crisisLevel >= 4) {
          // High crisis
          alertTitle = "⚠️ CRISIS DETECTED";
          alertMessage = therapistAssigned 
            ? `URGENT SUPPORT: An urgent session has been booked with ${therapistName} (${therapistEmail}) and will be available within ${urgencyMinutes} minutes. Help is on the way!`
            : `URGENT SUPPORT NEEDED: Please reach out to a crisis helpline immediately.`;
          alertButtons = [
            { text: "Call 988", onPress: () => {
              Alert.alert("Crisis Line", "Please call 988 - National Suicide Prevention Lifeline");
            }},
            { text: "View Therapist", onPress: () => router.push("/MyTherapist") },
            { text: "Continue Chat", style: "cancel" }
          ];
        } else if (crisisLevel >= 3) {
          // Moderate-High crisis
          alertTitle = "⚠️ CONCERNING MESSAGE DETECTED";
          alertMessage = therapistAssigned 
            ? `SUPPORT AVAILABLE: A support session has been booked with ${therapistName} (${therapistEmail}) and will be available within ${urgencyMinutes} minutes. You don't have to face this alone.`
            : `SUPPORT AVAILABLE: Please know that help is available and you don't have to face this alone.`;
          alertButtons = [
            { text: "View Therapist", onPress: () => router.push("/MyTherapist") },
            { text: "Continue Chat", style: "cancel" }
          ];
        }
        
        if (alertTitle) {
          Alert.alert(alertTitle, alertMessage, alertButtons, { cancelable: false });
        }
        
        // Show crisis indicator in chat
        if (crisisLevel >= 3) {
          console.log(`Crisis detected: Level ${crisisLevel}, Type: ${data.crisisType}, Confidence: ${data.crisisConfidence}`);
          if (therapistAssigned) {
            console.log(`Therapist assigned: ${therapistName} (${therapistEmail})`);
            console.log(`Appointment scheduled: ${appointmentScheduled}`);
            console.log(`Appointment ID: ${appointmentId}`);
          }
        }
      }

      // Legacy danger handling for backward compatibility
      if (data.danger) {
        let alertMsg = "We detected you may need urgent support. Redirecting you to a therapist.";
        if (data.appointment && data.appointment.scheduledTime) {
          const tName = data.therapistName || data.therapistAssigned || "a therapist";
          alertMsg = `We detected you may need urgent support. An appointment has been auto-booked for you with ${tName} at ${new Date(data.appointment.scheduledTime).toLocaleString()}.`;
        }
        Alert.alert(
          "Urgent Support",
          alertMsg,
          [
            {
              text: "OK",
              onPress: () => router.push("/MyTherapist"),
            },
          ],
          { cancelable: false }
        );
      }
    } catch (e) {
      console.error('Chat error:', e);
      const errorMsg = {
        text: "Sorry, something went wrong. Please try again.",
          sender: "bot",
          isError: true,
          time: new Date().toISOString(),
      };
      const updatedWithError = [...updated, errorMsg];
      setMessages(updatedWithError);
      
      // Save the error message to history as well
      try {
        await saveMessagesToStorage(updatedWithError);
      } catch (storageError) {
        console.error('Failed to save error message:', storageError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!token || !user) {
      Alert.alert("Authentication Required", "Please log in to use the chat feature.");
      return;
    }
    setShowMoodModal(false);
    try {
      console.log('Starting session with token:', token);
      const res = await fetch(`${API_BASE_URL}/ai/start-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mood }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "start error");
      setSessionId(d.sessionId);
      await AsyncStorage.setItem(getSessionIdKey(), d.sessionId);
      
      // Add welcome message based on mood
      const welcomeMessage = getWelcomeMessage(mood);
      const welcomeMsg = {
        text: welcomeMessage,
        sender: "bot",
        time: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
      setHasWelcomeMessage(true);
      
      // Save the welcome message immediately
      await saveMessagesToStorage([welcomeMsg]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not start session.");
    }
  };

  const startNewChat = async () => {
    if (!token || !user) {
      Alert.alert("Authentication Required", "Please log in to use the chat feature.");
      return;
    }
    setIsResetting(true);
    try {
      if (sessionId) {
        await fetch(`${API_BASE_URL}/ai/end-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });
      }
      setMessages([]);
      setHasWelcomeMessage(false);
      setSessionId(null); // Clear session ID for fresh start
      await AsyncStorage.removeItem(getChatHistoryKey());
      await AsyncStorage.removeItem(getSessionIdKey()); // Also clear saved session ID
      setShowMoodModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  // Show loading screen while checking authentication
  if (isAuthChecking) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={"padding"}
        keyboardVerticalOffset={insets.bottom || 0}
      >
        <LinearGradient colors={isDark ? colors.gradientSecondary : ["#ece5dd", "#f2fff6"]} style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading chat...</Text>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={isDark ? colors.gradientSecondary : ["#ece5dd", "#f2fff6"]} style={styles.container}>
        {/* Mood Modal */}
        <Modal visible={showMoodModal} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: colors.backgroundOverlay }]}>
            <Animated.View style={[styles.moodCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.moodTitle, { color: colors.textPrimary }]}>How are you feeling today?</Text>
              <Text style={[styles.moodSubtitle, { color: colors.accent }]}>
                Scale 1 (worst) to 10 (best)
              </Text>
              <Text style={styles.moodEmoji}>{moodEmojis[mood - 1]}</Text>
              <Slider
                style={{ width: width * 0.6, height: 40 }}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={mood}
                onValueChange={setMood}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.accentLight}
                thumbTintColor={colors.primary}
              />
              <Text style={[styles.moodValue, { color: colors.textPrimary }]}>Your mood: {mood}</Text>
              <TouchableOpacity
                style={[styles.moodButton, { backgroundColor: colors.accent }]}
                onPress={handleStartSession}
              >
                <Text style={styles.moodButtonText}>Start Chat</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {/* Header */}
        <LinearGradient colors={colors.gradientPrimary} style={styles.header}>
          <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)' }]}
          onPress={() => router.push('/MyTherapist')}
          >
          <Ionicons name="people-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Zensui Chat</Text>
            <Text style={styles.headerSubtitle}>Your private AI session</Text>
          </View>
          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: isDark ? colors.accent : '#388E3C' }]}
            onPress={startNewChat}
            disabled={isResetting}
          >
            {isResetting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={24} color="#fff" />
            )}
          </TouchableOpacity>
      </LinearGradient>
      
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => {
            const isLast = index === messages.length - 1 && isTypingEffect;
            const showText =
              item.sender === "bot" && isLast ? typingText : item.text;
            return (
              <Animated.View
                style={[
                  styles.bubble,
                  item.sender === "user" ? 
                    { 
                      backgroundColor: colors.chatUser,
                      alignSelf: "flex-end",
                      borderTopLeftRadius: 10,
                      borderTopRightRadius: 10,
                      borderBottomLeftRadius: 10,
                      borderBottomRightRadius: 0,
                    } : 
                    { 
                      backgroundColor: colors.chatBot,
                      alignSelf: "flex-start",
                      borderTopLeftRadius: 10,
                      borderTopRightRadius: 10,
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 10,
                    },
                  item.isError && { 
                    backgroundColor: colors.chatError,
                    borderColor: colors.error 
                  },
                  { opacity: fadeAnim },
                ]}
              >
                <Text style={[styles.bubbleText, { color: colors.textPrimary }]}>{showText}</Text>
                <View style={styles.bubbleFooter}>
                  <Text style={[
                    styles.bubbleTime, 
                    { 
                      color: colors.textSecondary,
                      textAlign: item.sender === "user" ? "right" : "left"
                    }
                  ]}>
                    {item.time
                      ? new Date(item.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                  {item.sender === "bot" && item.model && (
                    <Text style={[styles.modelIndicator, { color: colors.textTertiary }]}>
                      {item.model === 'gemini' ? '🤖' : '🧠'}
                    </Text>
                  )}
                </View>
              </Animated.View>
            );
          }}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ paddingBottom: 100 }} // Fixed padding to account for input area
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
        <Animated.View
          style={[styles.inputWrapper, { 
            bottom: keyboardHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [insets.bottom, 30],
              extrapolate: 'clamp',
            }),
            borderTopColor: colors.border,
          }]}
        >
          <View
            style={[styles.inputContainer, { backgroundColor: colors.chatInput }]}
            onLayout={(e) => setInputBarHeight(e.nativeEvent.layout.height)}
          >
            <TextInput
              style={[styles.textInput, { 
                color: colors.textPrimary,
                backgroundColor: colors.chatInput 
              }]}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="sentences"
              blurOnSubmit={false}
              returnKeyType="default"
              numberOfLines={6}
              scrollEnabled
              keyboardType="default"
              enablesReturnKeyAutomatically={false}
              onFocus={() => {
                // Ensure input stays positioned correctly when focused
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
              }}
            />
            <TouchableOpacity 
              onPress={sendMessage}
              style={[
                styles.sendButton,
                { backgroundColor: colors.chatSend },
                (!inputMessage.trim() || isLoading) && { opacity: 0.5 },
              ]}
              disabled={!inputMessage.trim() || isLoading}
            >
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  backButton: {
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
  },
  avatarWrap: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 2,
  },
  headerCenter: { flex: 1, alignItems: "center" },
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
  fab: {
    borderRadius: 24,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  bubble: {
    maxWidth: "75%",
    marginVertical: 4,
    padding: 10,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  bubbleText: { fontSize: 16 },
  bubbleTime: { fontSize: 10, textAlign: "right", marginTop: 4 },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  modelIndicator: {
    fontSize: 14,
    marginLeft: 8,
  },
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
  },
  textInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 25,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  moodCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    width: width * 0.8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  moodTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  moodSubtitle: { fontSize: 15, marginBottom: 10 },
  moodEmoji: { fontSize: 48, marginBottom: 8 },
  moodValue: {
    fontSize: 18,
    marginVertical: 8,
    fontWeight: "600",
  },
  moodButton: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 38,
    marginTop: 16,
  },
  moodButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});
