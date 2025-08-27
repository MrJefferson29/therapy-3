import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const MOODS = [
  { key: 'happy', value: 1, label: 'Happy', icon: 'happy-outline', color: '#FFD600' },
  { key: 'calm', value: 2, label: 'Calm', icon: 'leaf-outline', color: '#4CAF50' },
  { key: 'neutral', value: 3, label: 'Okay', icon: 'remove-circle-outline', color: '#90A4AE' },
  { key: 'sad', value: 4, label: 'Sad', icon: 'sad-outline', color: '#FF7043' },
  { key: 'tired', value: 5, label: 'Tired', icon: 'bed-outline', color: '#9575CD' },
  { key: 'excited', label: 'Excited', icon: 'rocket-outline', color: '#FFB300' },
  { key: 'anxious', label: 'Anxious', icon: 'alert-circle-outline', color: '#FF5252' },
  { key: 'grateful', label: 'Grateful', icon: 'heart-outline', color: '#FF80AB' },
  { key: 'angry', label: 'Angry', icon: 'flame-outline', color: '#D84315' },
  { key: 'lonely', label: 'Lonely', icon: 'person-outline', color: '#607D8B' },
  { key: 'inspired', label: 'Inspired', icon: 'bulb-outline', color: '#FFD740' },
  { key: 'overwhelmed', label: 'Overwhelmed', icon: 'cloud-outline', color: '#90CAF9' },
];

function getInstagramProfileStyles({ accent, textColor, errorColor, isDark }) {
  const { width } = Dimensions.get('window');
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1A1A1A' : '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 54 : 24,
      paddingBottom: 12,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      backgroundColor: '#fff',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: accent,
      letterSpacing: 0.5,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 24,
      paddingBottom: 12,
    },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      borderWidth: 2,
      borderColor: accent,
      backgroundColor: '#eaeaea',
      marginRight: 24,
    },
    profileInfo: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    usernameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    username: {
      fontSize: 22,
      fontWeight: '700',
      color: textColor,
      marginRight: 10,
    },
    editBtn: {
      backgroundColor: accent,
      borderRadius: 18,
      paddingVertical: 6,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    editBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 6,
      width: '100%',
    },
    statBlock: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontWeight: '800',
      fontSize: 18,
      color: textColor,
    },
    statLabel: {
      fontSize: 13,
      color: '#888',
      fontWeight: '600',
      marginTop: 2,
    },
    bio: {
      fontSize: 15,
      color: textColor,
      paddingHorizontal: 18,
      marginTop: 8,
      marginBottom: 16,
    },
    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      marginBottom: 0,
    },
    tabBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
    },
    tabBtnActive: {
      borderBottomWidth: 2,
      borderBottomColor: accent,
    },
    tabBtnText: {
      fontWeight: '700',
      fontSize: 15,
      color: '#888',
    },
    tabBtnTextActive: {
      color: accent,
    },
    tabContent: {
      flex: 1,
      minHeight: 200,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      borderRadius: 18,
      padding: 24,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 18,
      color: textColor,
    },
    modalInput: {
      width: '100%',
      padding: 14,
      borderRadius: 12,
      backgroundColor: '#f8f8f8',
      color: textColor,
      fontSize: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#eee',
    },
    modalLabel: {
      fontWeight: '700',
      marginBottom: 6,
      fontSize: 15,
      color: textColor,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginHorizontal: 6,
    },
    modalButtonText: {
      fontWeight: '700',
      fontSize: 16,
    },
    errorText: {
      color: errorColor,
      marginBottom: 8,
      fontWeight: '700',
    },
    imageSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    previewImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 16,
      borderWidth: 3,
      borderColor: accent,
      backgroundColor: '#eaeaea',
    },
    changeImageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: accent,
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    changeImageText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
      marginLeft: 8,
    },
    imageSelectionContent: {
      width: '90%',
      borderRadius: 18,
      padding: 24,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    modalSubtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginBottom: 24,
    },
    imageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f8f8',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    imageOptionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(56,142,60,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    imageOptionText: {
      flex: 1,
    },
    imageOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 4,
    },
    imageOptionSubtitle: {
      fontSize: 14,
      color: '#666',
    },
    cancelButton: {
      marginTop: 16,
      paddingVertical: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#666',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingTop: Platform.OS === 'ios' ? 8 : 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      flex: 1,
      textAlign: 'center',
    },
    headerButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      padding: 8,
      borderRadius: 20,
      marginLeft: 8,
    },
    bioContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 18,
      marginTop: 2,
      marginBottom: 10,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
    },
    chatButton: {
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    chatButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
  });
}

const formatMoodDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Profile() {
  const colorScheme = useColorScheme();
  const { colors, isDark = false } = useTheme();
  const accent = '#388E3C';
  const textColor = isDark ? '#E8E8E8' : '#222';
  const errorColor = '#D32F2F';
  const styles = getInstagramProfileStyles({ accent, textColor, errorColor, isDark });
  const router = useRouter();
  const { user, getProfile, loading, logout, token } = useAuth();
  console.log('DEBUG: user object in Profile screen:', user);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('journal');
  const [uploading, setUploading] = useState(false);
  const [imageSelectionModal, setImageSelectionModal] = useState(false);
  const [userMoods, setUserMoods] = useState([]);
  const [userMoodCount, setUserMoodCount] = useState(0);
  const [journalMoods, setJournalMoods] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');

  React.useEffect(() => {
    (async () => {
      await getProfile();
    })();
  }, []);

  // Fetch moods for user
  const fetchUserMoods = async (authorId) => {
    if (!authorId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.1.177:5000/mood/author/${authorId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUserMoods(data);
        setUserMoodCount(data.length);
      } else {
        setUserMoods([]);
        setUserMoodCount(0);
      }
    } catch {
      setUserMoods([]);
      setUserMoodCount(0);
    }
  };

  // Fetch journals for user and extract moods
  const fetchUserJournals = async (authorId) => {
    if (!authorId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.1.177:5000/journal/author/${authorId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data)) {
        // Extract moods and dates from journals
        const moods = data.data.map(j => ({
          mood: j.mood,
          createdAt: j.createdAt,
          _id: j._id,
          source: 'journal',
        }));
        setJournalMoods(moods);
      } else {
        setJournalMoods([]);
      }
    } catch {
      setJournalMoods([]);
    }
  };

  // Fetch all appointments for the user (client or therapist)
  const fetchAppointments = async () => {
    if (!token) return;
    setAppointmentsLoading(true);
    setAppointmentsError('');
    try {
      const res = await fetch('http://192.168.1.177:5000/appointment/my', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppointments(data);
        setAppointmentsCount(data.length);
      } else {
        setAppointments([]);
        setAppointmentsCount(0);
      }
    } catch (e) {
      setAppointments([]);
      setAppointmentsCount(0);
      setAppointmentsError('Failed to fetch appointments');
    }
    setAppointmentsLoading(false);
  };

  // Fetch all user data (profile, moods, journals, appointments) on mount when user is available
  React.useEffect(() => {
    if (user && token) {
      fetchUserMoods(user._id || user.id);
      fetchUserJournals(user._id || user.id);
      fetchAppointments();
    }
  }, [user, token]);

  // Merge moods from mood logs and journals, sort by date descending, deduplicate by mood+date
  const mergedMoods = React.useMemo(() => {
    const all = [...userMoods, ...journalMoods];
    // Use a map to deduplicate by mood+date
    const map = new Map();
    all.forEach(m => {
      const key = `${m.mood}-${formatMoodDate(m.createdAt)}`;
      if (!map.has(key)) map.set(key, m);
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [userMoods, journalMoods]);

  // Helper to get mood label/icon from value
  const getMood = (moodValue) => {
    return MOODS.find(m => m.value === moodValue) || MOODS[2];
  };

  // Example stats (replace with real data if available)
  const stats = [
    { label: 'Journal', value: user?.journalCount || 0 },
    { label: 'Sessions', value: appointmentsCount },
    { label: 'Mood', value: userMoodCount },
  ];

  // Render moods grid
  const renderUserMoodsGrid = () => {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start'}}>
        {mergedMoods.map((mood, idx) => {
          let moodObj = MOODS.find(m => m.key === mood.mood) || MOODS.find(m => m.value === mood.mood) || MOODS.find(m => m.label.toLowerCase() === (mood.mood || '').toLowerCase());
          if (!moodObj && typeof mood.mood === 'number') moodObj = MOODS.find(m => m.value === mood.mood);
          const bgColor = moodObj?.color ? moodObj.color + '33' : (isDark ? '#353535' : '#F1F3F4');
          const isLarge = idx % 5 === 0;
          return (
            <View
              key={mood._id || idx}
              style={{
                width: isLarge ? '62%' : '31%',
                aspectRatio: isLarge ? 1.2 : 1,
                backgroundColor: bgColor,
                borderRadius: 8,
                margin: '1%',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 3,
                shadowColor: moodObj?.color || (isDark ? '#666' : '#888'),
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.10,
                shadowRadius: 8,
                padding: isLarge ? 10 : 6,
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? '#454545' : 'transparent',
              }}
            >
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Ionicons name={moodObj?.icon || 'happy-outline'} size={isLarge ? 54 : 38} color={moodObj?.color || (isDark ? '#B0B0B0' : '#888')} style={{ marginBottom: isLarge ? 8 : 4 }} />
                <ThemedText style={{ fontWeight: '800', color: isDark ? '#E8E8E8' : '#333', fontSize: isLarge ? 20 : 14, marginBottom: 2, textAlign: 'center' }}>{moodObj?.label || mood.mood}</ThemedText>
                {mood.createdAt && <ThemedText style={{ color: isDark ? '#B0B0B0' : '#555', fontSize: isLarge ? 13 : 10, opacity: 0.85, textAlign: 'center' }}>{formatMoodDate(mood.createdAt)}</ThemedText>}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // --- Early return after all hooks ---
  if (loading || !user) {
    return (
      <ThemedView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const openEditModal = () => {
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditProfileImage(user.profileImage);
    setEditModalVisible(true);
    setError('');
  };

  const openImageSelection = () => {
    setImageSelectionModal(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      // First upload the image if it has changed
      if (editProfileImage && editProfileImage !== user.profileImage && !editProfileImage.startsWith('http')) {
        await uploadProfileImage();
      }
      
      const res = await fetch('http://192.168.1.177:5000/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
          profileImage: editProfileImage,
        }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      await getProfile();
      setEditModalVisible(false);
    } catch (e) {
      setError('Failed to update profile');
    }
    setSaving(false);
  };

  const pickImageFromGallery = async () => {
    try {
      setUploading(true);
      setImageSelectionModal(false);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setEditProfileImage(asset.uri);
      }
    } catch (e) {
      setError('Failed to pick image');
    }
    setUploading(false);
  };

  const takePhotoWithCamera = async () => {
    try {
      setUploading(true);
      setImageSelectionModal(false);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setEditProfileImage(asset.uri);
      }
    } catch (e) {
      setError('Failed to take photo');
    }
    setUploading(false);
  };

  const uploadProfileImage = async () => {
    if (!editProfileImage || editProfileImage === user.profileImage) return;
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', {
        uri: editProfileImage,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });
      const res = await fetch('http://192.168.1.177:5000/user/me/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload image');
      const data = await res.json();
      setEditProfileImage(data.profileImage);
    } catch (e) {
      setError('Failed to upload image');
    }
    setUploading(false);
  };

  // --- Render ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1A1A1A' : '#fff' }} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        {/* Header Row: Go Back, Title, Add Article (admin/therapist), All Users (admin only), Logout */}
        <View style={[styles.headerContainer, { backgroundColor: isDark ? '#2A2A2A' : '#fff', borderBottomColor: isDark ? '#454545' : '#F0F0F0' }]}>
          {/* Go Back Button */}
          <TouchableOpacity
            onPress={() => {
              try {
                router.back();
                // Fallback: after a short delay, go home if still on profile
                setTimeout(() => {
                  if (window && window.location && window.location.pathname.includes('profile')) {
                    router.replace('/');
                  }
                }, 200);
              } catch {
                router.replace('/');
              }
            }}
            style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.08)' }]}
          >
            <Ionicons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          {/* Title */}
          <ThemedText style={[styles.headerTitle, { color: isDark ? '#E8E8E8' : accent }]}>Profile</ThemedText>
          {/* Right side buttons container */}
          <View style={styles.headerButtonsContainer}>
            {/* Add Article Button (admin/therapist only) */}
            {(user.role === 'admin' || user.role === 'therapist') && (
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.08)' }]}
                onPress={() => router.push('/createArticle')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={24} color={accent} />
              </TouchableOpacity>
            )}
            {/* All Users Button (admin only) */}
            {user.role === 'admin' && (
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.08)' }]}
                onPress={() => router.push('/all-users')}
                activeOpacity={0.85}
              >
                <Ionicons name="people-outline" size={24} color={accent} />
              </TouchableOpacity>
            )}
            {/* Logout Button */}
            <TouchableOpacity 
              onPress={handleLogout} 
              style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(244,67,54,0.15)' : 'rgba(56,142,60,0.08)' }]}
            >
              <Ionicons name="log-out-outline" size={24} color={isDark ? '#F44336' : accent} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Profile Row */}
        <View style={[styles.profileRow, { backgroundColor: isDark ? '#353535' : '#fff', borderBottomColor: isDark ? '#454545' : '#F0F0F0' }]}>
          <Image source={{ uri: user.profileImage || user.images?.[0] }} style={[styles.avatar, { borderColor: isDark ? '#4BBE8A' : accent }]} />
          <View style={styles.profileInfo}>
            <View style={styles.usernameRow}>
              <ThemedText style={[styles.username, { color: isDark ? '#E8E8E8' : textColor }]}>{user.username}</ThemedText>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: isDark ? '#4BBE8A' : accent }]} onPress={openEditModal}>
                <ThemedText style={styles.editBtnText}>Edit Profile</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.statBlock}>
                  <ThemedText style={[styles.statNumber, { color: isDark ? '#E8E8E8' : textColor }]}>{stat.value}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: isDark ? '#B0B0B0' : '#888' }]}>{stat.label}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>
        {/* Role/Bio and My Chats or Quote Row */}
        <View style={[styles.bioContainer, { backgroundColor: isDark ? '#2A2A2A' : '#fff', borderBottomColor: isDark ? '#454545' : '#F0F0F0' }]}>
          <ThemedText style={[styles.bio, { color: isDark ? '#E8E8E8' : textColor }]}>{user.role || 'Farmer, Dreamer, Grower'}</ThemedText>
          {user.role === 'therapist' ? (
            <TouchableOpacity
              style={[styles.chatButton, { backgroundColor: isDark ? '#4BBE8A' : accent }]}
              onPress={() => router.push('/therapist-chats')}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <ThemedText style={styles.chatButtonText}>My Chats</ThemedText>
            </TouchableOpacity>
          ) : user.role === 'user' ? (
            <TouchableOpacity
              style={[styles.chatButton, { backgroundColor: isDark ? '#4BBE8A' : accent }]}
              onPress={() => router.push('/user-chats')}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <ThemedText style={styles.chatButtonText}>My Chats</ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>
        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: isDark ? '#2A2A2A' : '#fff', borderBottomColor: isDark ? '#454545' : '#F0F0F0' }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn, 
              activeTab === 'journal' && [styles.tabBtnActive, { borderBottomColor: isDark ? '#4BBE8A' : accent }]
            ]}
            onPress={() => setActiveTab('journal')}
          >
            <ThemedText style={[
              styles.tabBtnText, 
              { color: isDark ? '#B0B0B0' : '#888' },
              activeTab === 'journal' && { color: isDark ? '#4BBE8A' : accent }
            ]}>Journal</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn, 
              activeTab === 'appointments' && [styles.tabBtnActive, { borderBottomColor: isDark ? '#4BBE8A' : accent }]
            ]}
            onPress={() => setActiveTab('appointments')}
          >
            <ThemedText style={[
              styles.tabBtnText, 
              { color: isDark ? '#B0B0B0' : '#888' },
              activeTab === 'appointments' && { color: isDark ? '#4BBE8A' : accent }
            ]}>Appointments</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn, 
              activeTab === 'mood' && [styles.tabBtnActive, { borderBottomColor: isDark ? '#4BBE8A' : accent }]
            ]}
            onPress={() => setActiveTab('mood')}
          >
            <ThemedText style={[
              styles.tabBtnText, 
              { color: isDark ? '#B0B0B0' : '#888' },
              activeTab === 'mood' && { color: isDark ? '#4BBE8A' : accent }
            ]}>Mood</ThemedText>
          </TouchableOpacity>
        </View>
        {/* Tab Content */}
        <View style={[styles.tabContent, { backgroundColor: isDark ? '#1A1A1A' : '#fff' }]}>
          {activeTab === 'journal' && (
            user.journals && user.journals.length > 0 ? (
              <ScrollView style={{ width: '110%' }}>
                {user.journals.map(journal => {
                  const mood = getMood(journal.mood);
                  return (
                    <View key={journal._id || journal.title + journal.createdAt} style={{ 
                      marginBottom: 18, 
                      backgroundColor: isDark ? '#2A2A2A' : '#FAFAF7', 
                      borderRadius: 14, 
                      padding: 16, 
                      borderWidth: 1, 
                      borderColor: isDark ? '#454545' : '#eee' 
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name={mood.icon} size={18} color={mood.color} style={{ marginRight: 8 }} />
                        <ThemedText style={{ fontWeight: '700', fontSize: 16, color: isDark ? '#E8E8E8' : '#222' }}>{journal.title}</ThemedText>
                      </View>
                      <ThemedText style={{ color: isDark ? '#B0B0B0' : '#888', fontSize: 13, marginBottom: 6 }}>{mood.label}</ThemedText>
                      <ThemedText style={{ fontSize: 15, color: isDark ? '#E8E8E8' : '#222' }}>{journal.note}</ThemedText>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <ThemedText style={{ color: isDark ? '#B0B0B0' : '#888' }}>No journal entries yet.</ThemedText>
            )
          )}
          {activeTab === 'fields' && <ThemedText style={{ color: isDark ? '#B0B0B0' : '#888' }}>Appointments managed will appear here.</ThemedText>}
          {activeTab === 'mood' && (
            userMoods.length > 0 ? (
              <ScrollView style={{ width: '110%' }}>
                {renderUserMoodsGrid()}
              </ScrollView>
            ) : (
              <ThemedText style={{ color: isDark ? '#B0B0B0' : '#888' }}>No mood logs yet.</ThemedText>
            )
          )}
          {activeTab === 'appointments' && (
            appointmentsLoading ? (
              <ActivityIndicator size="large" color={isDark ? '#4BBE8A' : accent} />
            ) : appointmentsError ? (
              <ThemedText style={{ color: isDark ? '#F44336' : errorColor }}>{appointmentsError}</ThemedText>
            ) : appointments.length > 0 ? (
              <ScrollView style={{ width: '110%' }}>
                {appointments.map(app => (
                  <View key={app._id} style={{ 
                    marginBottom: 18, 
                    backgroundColor: isDark ? '#2A2A2A' : '#FAFAF7', 
                    borderRadius: 14, 
                    padding: 16, 
                    borderWidth: 1, 
                    borderColor: isDark ? '#454545' : '#eee' 
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="calendar-outline" size={18} color={isDark ? '#4BBE8A' : accent} style={{ marginRight: 8 }} />
                      <ThemedText style={{ fontWeight: '700', fontSize: 16, color: isDark ? '#E8E8E8' : '#222' }}>{app.title}</ThemedText>
                    </View>
                    <ThemedText style={{ color: isDark ? '#B0B0B0' : '#888', fontSize: 13, marginBottom: 6 }}>{app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : ''}</ThemedText>
                    <ThemedText style={{ fontSize: 15, marginBottom: 6, color: isDark ? '#E8E8E8' : '#222' }}>{app.description}</ThemedText>
                    {app.scheduledTime && (
                      <ThemedText style={{ color: isDark ? '#B0B0B0' : '#555', fontSize: 13 }}>
                        Scheduled: {new Date(app.scheduledTime).toLocaleString()}
                      </ThemedText>
                    )}
                    <ThemedText style={{ color: isDark ? '#B0B0B0' : '#555', fontSize: 13, marginTop: 2 }}>
                      Therapist: {app.therapist?.username || ''} | Client: {app.client?.username || ''}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <ThemedText style={{ color: isDark ? '#B0B0B0' : '#888' }}>No appointments yet.</ThemedText>
            )
          )}
        </View>
        {/* Edit Profile Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }]}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
              <ThemedText style={[styles.modalTitle, { color: isDark ? '#E8E8E8' : textColor }]}>Edit Profile</ThemedText>
              
              {/* Profile Image Section */}
              <View style={styles.imageSection}>
                <Image
                  source={{ uri: editProfileImage || user.profileImage }}
                  style={[styles.previewImage, { borderColor: isDark ? '#4BBE8A' : accent }]}
                />
                <TouchableOpacity 
                  style={[styles.changeImageBtn, { backgroundColor: isDark ? '#4BBE8A' : accent }]} 
                  onPress={openImageSelection}
                  disabled={uploading}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <ThemedText style={styles.changeImageText}>Change Photo</ThemedText>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <ThemedText style={[styles.modalLabel, { color: isDark ? '#E8E8E8' : textColor }]}>Username</ThemedText>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: isDark ? '#353535' : '#f8f8f8',
                  color: isDark ? '#E8E8E8' : textColor,
                  borderColor: isDark ? '#454545' : '#eee'
                }]}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Enter your username"
                placeholderTextColor={isDark ? '#B0B0B0' : "#bbb"}
              />
              
              <ThemedText style={[styles.modalLabel, { color: isDark ? '#E8E8E8' : textColor }]}>Email</ThemedText>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: isDark ? '#353535' : '#f8f8f8',
                  color: isDark ? '#E8E8E8' : textColor,
                  borderColor: isDark ? '#454545' : '#eee'
                }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                placeholderTextColor={isDark ? '#B0B0B0' : "#bbb"}
                keyboardType="email-address"
              />
              
              {error ? <ThemedText style={[styles.errorText, { color: isDark ? '#F44336' : errorColor }]}>{error}</ThemedText> : null}
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: isDark ? '#353535' : '#eee' }]} onPress={() => setEditModalVisible(false)}>
                  <ThemedText style={[styles.modalButtonText, { color: isDark ? '#E8E8E8' : textColor }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: isDark ? '#4BBE8A' : accent }]} onPress={handleSaveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={[styles.modalButtonText, { color: '#fff' }]}>Save</ThemedText>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Image Selection Modal */}
        <Modal
          visible={imageSelectionModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setImageSelectionModal(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }]}>
            <View style={[styles.imageSelectionContent, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
              <ThemedText style={[styles.modalTitle, { color: isDark ? '#E8E8E8' : textColor }]}>Choose Photo</ThemedText>
              <ThemedText style={[styles.modalSubtitle, { color: isDark ? '#B0B0B0' : '#666' }]}>Select how you'd like to add a profile photo</ThemedText>
              
              <TouchableOpacity 
                style={[styles.imageOption, { backgroundColor: isDark ? '#353535' : '#f8f8f8' }]} 
                onPress={takePhotoWithCamera}
                disabled={uploading}
              >
                <View style={[styles.imageOptionIcon, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.1)' }]}>
                  <Ionicons name="camera" size={32} color={isDark ? '#4BBE8A' : accent} />
                </View>
                <View style={styles.imageOptionText}>
                  <ThemedText style={[styles.imageOptionTitle, { color: isDark ? '#E8E8E8' : textColor }]}>Take Photo</ThemedText>
                  <ThemedText style={[styles.imageOptionSubtitle, { color: isDark ? '#B0B0B0' : '#666' }]}>Use your camera to take a new photo</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : "#ccc"} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.imageOption, { backgroundColor: isDark ? '#353535' : '#f8f8f8' }]} 
                onPress={pickImageFromGallery}
                disabled={uploading}
              >
                <View style={[styles.imageOptionIcon, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.1)' }]}>
                  <Ionicons name="images" size={32} color={isDark ? '#4BBE8A' : accent} />
                </View>
                <View style={styles.imageOptionText}>
                  <ThemedText style={[styles.imageOptionTitle, { color: isDark ? '#E8E8E8' : textColor }]}>Choose from Gallery</ThemedText>
                  <ThemedText style={[styles.imageOptionSubtitle, { color: isDark ? '#B0B0B0' : '#666' }]}>Select an existing photo from your gallery</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : "#ccc"} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.cancelButton, { borderTopColor: isDark ? '#454545' : '#eee' }]} 
                onPress={() => setImageSelectionModal(false)}
              >
                <ThemedText style={[styles.cancelButtonText, { color: isDark ? '#B0B0B0' : '#666' }]}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

