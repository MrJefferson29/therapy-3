import React, { useEffect, useState } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  StyleSheet, 
  TextInput,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { AllUsersSkeleton } from '../components/AllUsersSkeleton';

const API_URL = 'http://192.168.1.177:5000';

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

export default function AllUsers() {
  const { isDark = false } = useTheme();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

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

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
      setError('');
    
      try {
        const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/user`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setUsers(data);
        setFilteredUsers(data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query and role
  useEffect(() => {
    let filtered = users;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, selectedRole]);

  const onRefresh = () => {
    fetchUsers(true);
  };

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
        All Users
      </ThemedText>
      
      <ThemedText style={[styles.userCount, { color: themeColors.textSecondary }]}>
        {filteredUsers.length}
      </ThemedText>
    </View>
  );

  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { backgroundColor: themeColors.input, borderColor: themeColors.border }]}>
      <Ionicons name="search" size={18} color={themeColors.textSecondary} style={styles.searchIcon} />
      <TextInput
        style={[styles.searchInput, { color: themeColors.text }]}
        placeholder="Search users..."
        placeholderTextColor={themeColors.placeholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
          <Ionicons name="close-circle" size={18} color={themeColors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRoleFilter = () => (
    <View style={styles.roleFilterContainer}>
      {['all', 'admin', 'therapist', 'user'].map((role) => (
        <TouchableOpacity
          key={role}
          style={[
            styles.roleFilterButton,
            { 
              backgroundColor: selectedRole === role ? themeColors.primary : themeColors.input,
              borderColor: themeColors.border,
            }
          ]}
          onPress={() => setSelectedRole(role)}
          activeOpacity={0.8}
        >
          {role === 'all' ? (
            <Ionicons 
              name="apps" 
              size={14} 
              color={selectedRole === role ? '#FFFFFF' : themeColors.textSecondary} 
              style={styles.roleFilterIcon}
            />
          ) : (
            <Ionicons 
              name={getRoleIcon(role)} 
              size={14} 
              color={selectedRole === role ? '#FFFFFF' : getRoleColor(role)} 
              style={styles.roleFilterIcon}
            />
          )}
          <ThemedText style={[
            styles.roleFilterText,
            { color: selectedRole === role ? '#FFFFFF' : themeColors.text }
          ]}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUserCard = (user) => (
    <TouchableOpacity
      key={user._id || user.id}
      style={[styles.userCard, { 
        backgroundColor: themeColors.card,
        borderColor: themeColors.border,
        shadowColor: isDark ? '#000' : '#000',
        shadowOpacity: isDark ? 0.2 : 0.08,
      }]}
      onPress={() => router.push(`/user-detail/${user._id || user.id}`)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ 
          uri: user.profileImage || getRandomProfileImage(user.username) 
        }} 
        style={[styles.userAvatar, { borderColor: themeColors.border }]} 
      />
      
      <View style={styles.userInfo}>
        <ThemedText style={[styles.userName, { color: themeColors.text }]}>
          {user.username || 'Unknown User'}
        </ThemedText>
        <ThemedText style={[styles.userEmail, { color: themeColors.textSecondary }]}>
          {user.email || 'No email'}
        </ThemedText>
        
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '15' }]}>
          <Ionicons 
            name={getRoleIcon(user.role)} 
            size={12} 
            color={getRoleColor(user.role)} 
            style={styles.roleIcon}
          />
          <ThemedText style={[styles.roleText, { color: getRoleColor(user.role) }]}>
            {user.role || 'Unknown'}
          </ThemedText>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.1)' }]}
        onPress={() => router.push(`/user-detail/${user._id || user.id}`)}
      >
        <Ionicons name="eye" size={16} color={themeColors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color={themeColors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: themeColors.text }]}>
        {searchQuery || selectedRole !== 'all' ? 'No users found' : 'No users available'}
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
        {searchQuery || selectedRole !== 'all' 
          ? 'Try adjusting your search or filters' 
          : 'Users will appear here once they register'
        }
      </ThemedText>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={40} color={themeColors.error} />
      <ThemedText style={[styles.errorTitle, { color: themeColors.text }]}>
        Error Loading Users
      </ThemedText>
      <ThemedText style={[styles.errorMessage, { color: themeColors.textSecondary }]}>
        {error}
      </ThemedText>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
        onPress={() => fetchUsers()}
      >
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => <AllUsersSkeleton />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {renderHeader()}
      
      <View style={styles.content}>
        {renderSearchBar()}
        {renderRoleFilter()}
        
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map(renderUserCard)
            ) : (
              renderEmptyState()
            )}
    </ScrollView>
        )}
      </View>
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
  userCount: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  clearButton: {
    padding: 2,
  },
  roleFilterContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
  },
  roleFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  roleFilterIcon: {
    marginRight: 4,
  },
  roleFilterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleIcon: {
    marginRight: 3,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});