import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get("window");
const API_URL = 'https://therapy-3.onrender.com';

const DEFAULT_PROFILE_IMAGES = [
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1519340333755-c1aa5571fd46?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=256&h=256&facepad=2"
];

export default function MyTherapist() {
  const { isDark = false } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Theme-aware colors
  const themeColors = {
    primary: isDark ? '#4BBE8A' : '#388E3C',
    background: isDark ? '#1A1A1A' : '#F8F9FA',
    card: isDark ? '#2A2A2A' : '#FFFFFF',
    input: isDark ? '#353535' : '#FFFFFF',
    border: isDark ? '#454545' : '#E0E0E0',
    text: isDark ? '#E8E8E8' : '#222222',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
    placeholder: isDark ? '#888888' : '#999999',
    error: isDark ? '#FF6B6B' : '#FF3B30',
    success: isDark ? '#4BBE8A' : '#4CAF50',
    gradient: isDark ? ['#2A2A2A', '#1A1A1A'] : ['#F8F9FA', '#FFFFFF'],
  };

  const getRandomProfileImage = (username) => {
    if (!username) return DEFAULT_PROFILE_IMAGES[0];
    const index = username.charCodeAt(0) % DEFAULT_PROFILE_IMAGES.length;
    return DEFAULT_PROFILE_IMAGES[index];
  };

  const fetchTherapists = async () => {
    try {
      setError('');
      const response = await fetch(`${API_URL}/user/therapists`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTherapists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch therapists:', error);
      setError('Failed to load therapists. Please try again.');
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTherapists();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTherapists();
  }, []);

  const handleChatWithTherapist = (therapist) => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please log in to chat with therapists.');
      return;
    }
    router.push(`/chat/${therapist._id || therapist.id}`);
  };

  const renderHeader = () => (
    <LinearGradient
      colors={themeColors.gradient}
      style={[styles.header, { borderBottomColor: themeColors.border }]}
    >
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.1)' }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color={themeColors.primary} />
        </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <ThemedText style={[styles.headerTitle, { color: themeColors.text }]}>
          Therapists
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
          Connect with professional therapists
        </ThemedText>
      </View>
      
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.1)' }]}
        onPress={onRefresh}
        disabled={refreshing}
        activeOpacity={0.8}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={themeColors.primary} />
        ) : (
          <Ionicons name="refresh" size={20} color={themeColors.primary} />
        )}
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderTherapistCard = (therapist) => (
    <View key={therapist._id || therapist.id} style={[styles.therapistCard, { 
      backgroundColor: themeColors.card,
      borderColor: themeColors.border,
    }]}>
              <Image
        source={{ 
          uri: therapist.profileImage || getRandomProfileImage(therapist.username) 
        }}
        style={[styles.therapistAvatar, { borderColor: themeColors.border }]}
      />
      
      <View style={styles.therapistInfo}>
        <ThemedText style={[styles.therapistName, { color: themeColors.text }]}>
          {therapist.username || 'Unknown Therapist'}
        </ThemedText>
        <ThemedText style={[styles.therapistEmail, { color: themeColors.textSecondary }]}>
          {therapist.email || 'No email available'}
        </ThemedText>
        
        <View style={styles.therapistBadge}>
          <Ionicons name="medical" size={14} color={themeColors.primary} />
          <ThemedText style={[styles.therapistBadgeText, { color: themeColors.primary }]}>
            Professional Therapist
          </ThemedText>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.chatButton, { backgroundColor: themeColors.primary }]}
        onPress={() => handleChatWithTherapist(therapist)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
        <ThemedText style={styles.chatButtonText}>Chat</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={themeColors.primary} />
      <ThemedText style={[styles.loadingText, { color: themeColors.text }]}>
        Loading therapists...
      </ThemedText>
              </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle" size={48} color={themeColors.error} />
      <ThemedText style={[styles.errorTitle, { color: themeColors.text }]}>
        Unable to Load Therapists
      </ThemedText>
      <ThemedText style={[styles.errorMessage, { color: themeColors.textSecondary }]}>
        {error}
      </ThemedText>
              <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
        onPress={fetchTherapists}
              >
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
              </TouchableOpacity>
            </View>
  );

  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="people-outline" size={64} color={themeColors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: themeColors.text }]}>
        No Therapists Available
      </ThemedText>
      <ThemedText style={[styles.emptyMessage, { color: themeColors.textSecondary }]}>
        Check back later for available therapists
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      {renderHeader()}
      
      {loading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.primary]}
              tintColor={themeColors.primary}
            />
          }
        >
          {therapists.length > 0 ? (
            therapists.map(renderTherapistCard)
          ) : (
            renderEmptyState()
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  therapistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  therapistAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
  },
  therapistInfo: {
    flex: 1,
  },
  therapistName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  therapistEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  therapistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(75,190,138,0.1)',
  },
  therapistBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
});
