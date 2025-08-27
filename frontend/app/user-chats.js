import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://therapy-3.onrender.com';

export default function UserChats() {
  const { user } = useAuth();
  const { colors, isDark = false } = useTheme();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    fetchUserChats();
  }, [user]);

  const fetchUserChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/chat/user/${user._id}`);
      const data = await response.json();
      setChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.chatItem, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]} 
      onPress={() => router.push(`/chat/${item.therapistId}`)}
      activeOpacity={0.85}
    >
      <Image 
        source={{ uri: item.profileImage || 'https://ui-avatars.com/api/?name=' + item.username }} 
        style={styles.avatar} 
      />
      <View style={styles.chatInfo}>
        <Text style={[styles.username, { color: isDark ? '#E8E8E8' : '#222' }]}>{item.username}</Text>
        <Text style={[styles.email, { color: isDark ? '#B0B0B0' : '#888' }]}>{item.email}</Text>
        <Text style={[styles.lastMessage, { color: isDark ? '#888' : '#666' }]}>{item.lastMessage || 'Start a conversation...'}</Text>
      </View>
      <View style={[styles.chevronContainer, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(76, 175, 80, 0.1)' }]}>
        <Ionicons name="chevron-forward" size={22} color={isDark ? '#4BBE8A' : "#4CAF50"} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={isDark ? colors.gradientSecondary : ["#ece5dd", "#f2fff6"]} style={styles.gradient}>
        {/* Header */}
        <LinearGradient colors={colors.gradientPrimary} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)' }]}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Chats</Text>
            <Text style={styles.headerSubtitle}>Conversations with therapists</Text>
          </View>
          <TouchableOpacity 
            style={[styles.avatarWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)' }]}
            onPress={() => router.push('/MyTherapist')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        
        {/* Chat List */}
        <FlatList
          data={chats}
          keyExtractor={item => item.therapistId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchUserChats}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={isDark ? '#666' : "#ccc"} />
              <Text style={[styles.emptyText, { color: isDark ? '#B0B0B0' : '#888' }]}>No chats yet</Text>
              <Text style={[styles.emptySubtext, { color: isDark ? '#888' : '#aaa' }]}>Start a conversation with a therapist to see your chats here</Text>
              <TouchableOpacity 
                style={[styles.findTherapistBtn, { backgroundColor: isDark ? '#4BBE8A' : '#4CAF50' }]}
                onPress={() => router.push('/MyTherapist')}
              >
                <Text style={styles.findTherapistBtnText}>Find a Therapist</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#ece5dd" 
  },
  gradient: { 
    flex: 1 
  },
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
    padding: 8,
  },
  listContainer: { 
    padding: 16, 
    paddingBottom: 24 
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 16,
    backgroundColor: '#e0e0e0',
  },
  chatInfo: { 
    flex: 1 
  },
  username: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#222',
    marginBottom: 4,
  },
  email: { 
    fontSize: 14, 
    color: '#888',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  chevronContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  findTherapistBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  findTherapistBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 