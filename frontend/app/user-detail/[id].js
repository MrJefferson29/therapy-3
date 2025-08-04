import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

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

export default function UserDetail() {
  const { id } = useLocalSearchParams();
  const { isDark = false } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

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
    warning: isDark ? '#FFA726' : '#FF9800',
    gradient: isDark ? ['#2A2A2A', '#1A1A1A'] : ['#F8F9FA', '#FFFFFF'],
  };

  const fetchUserDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/user/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError(error.message || 'Failed to fetch user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return isDark ? '#FF6B6B' : '#FF3B30';
      case 'therapist':
        return isDark ? '#4BBE8A' : '#4CAF50';
      case 'user':
        return isDark ? '#64B5F6' : '#2196F3';
      default:
        return isDark ? '#B0B0B0' : '#666666';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return 'shield-checkmark';
      case 'therapist':
        return 'medical';
      case 'user':
        return 'person';
      default:
        return 'help-circle';
    }
  };

  const getRandomProfileImage = (username) => {
    if (!username) return DEFAULT_PROFILE_IMAGES[0];
    const index = username.charCodeAt(0) % DEFAULT_PROFILE_IMAGES.length;
    return DEFAULT_PROFILE_IMAGES[index];
  };

  const handleDeleteUser = async () => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user?.username}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${API_URL}/user/${id}`, {
                method: 'DELETE',
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                throw new Error('Failed to delete user');
              }

              Alert.alert('Success', 'User deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user. Please try again.');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleChangeRole = async (newRole) => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/user/${id}/role`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user role');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      Alert.alert('Success', 'User role updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update user role. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.1)' }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={20} color={themeColors.primary} />
      </TouchableOpacity>
      
      <ThemedText style={[styles.headerTitle, { color: themeColors.text }]}>
        User Details
      </ThemedText>
      
      <View style={styles.headerActions}>
        {currentUser?.role === 'admin' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.error + '15' }]}
            onPress={handleDeleteUser}
            disabled={updating}
          >
            <Ionicons name="trash-outline" size={18} color={themeColors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderUserProfile = () => (
    <View style={[styles.profileSection, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <Image 
        source={{ 
          uri: user?.profileImage || getRandomProfileImage(user?.username) 
        }} 
        style={[styles.profileImage, { borderColor: themeColors.border }]} 
      />
      
      <View style={styles.profileInfo}>
        <ThemedText style={[styles.userName, { color: themeColors.text }]}>
          {user?.username || 'Unknown User'}
        </ThemedText>
        <ThemedText style={[styles.userEmail, { color: themeColors.textSecondary }]}>
          {user?.email || 'No email'}
        </ThemedText>
        
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role) + '15' }]}>
          <Ionicons 
            name={getRoleIcon(user?.role)} 
            size={14} 
            color={getRoleColor(user?.role)} 
            style={styles.roleIcon}
          />
          <ThemedText style={[styles.roleText, { color: getRoleColor(user?.role) }]}>
            {user?.role || 'Unknown'}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderUserStats = () => (
    <View style={[styles.statsSection, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
        Account Information
      </ThemedText>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { borderColor: themeColors.border }]}>
          <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
          <ThemedText style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Joined
          </ThemedText>
          <ThemedText style={[styles.statValue, { color: themeColors.text }]}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
          </ThemedText>
        </View>
        
        <View style={[styles.statItem, { borderColor: themeColors.border }]}>
          <Ionicons name="time-outline" size={20} color={themeColors.primary} />
          <ThemedText style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Last Active
          </ThemedText>
          <ThemedText style={[styles.statValue, { color: themeColors.text }]}>
            {user?.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Unknown'}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderRoleManagement = () => {
    if (currentUser?.role !== 'admin') return null;

    return (
      <View style={[styles.roleSection, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
          Role Management
        </ThemedText>
        
        <View style={styles.roleOptions}>
          {['user', 'therapist', 'admin'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleOption,
                { 
                  backgroundColor: user?.role === role ? themeColors.primary : themeColors.input,
                  borderColor: themeColors.border,
                }
              ]}
              onPress={() => handleChangeRole(role)}
              disabled={updating || user?.role === role}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={getRoleIcon(role)} 
                size={16} 
                color={user?.role === role ? '#FFFFFF' : getRoleColor(role)} 
              />
              <ThemedText style={[
                styles.roleOptionText,
                { color: user?.role === role ? '#FFFFFF' : themeColors.text }
              ]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={themeColors.primary} />
      <ThemedText style={[styles.loadingText, { color: themeColors.text }]}>
        Loading user details...
      </ThemedText>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color={themeColors.error} />
      <ThemedText style={[styles.errorTitle, { color: themeColors.text }]}>
        Error Loading User
      </ThemedText>
      <ThemedText style={[styles.errorMessage, { color: themeColors.textSecondary }]}>
        {error}
      </ThemedText>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
        onPress={fetchUserDetails}
      >
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {renderHeader()}
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {renderHeader()}
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderUserProfile()}
        {renderUserStats()}
        {renderRoleManagement()}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleIcon: {
    marginRight: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsSection: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  roleSection: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    paddingHorizontal: 32,
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
}); 