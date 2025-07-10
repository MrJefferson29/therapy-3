import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 18, backgroundColor: '#eaeaea' },
  info: { flex: 1 },
  username: { fontWeight: '700', fontSize: 18, color: '#222' },
  email: { color: '#666', fontSize: 14, marginTop: 2 },
  role: { color: '#388E3C', fontWeight: '600', fontSize: 14, marginTop: 2 },
});

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch('http://192.168.130.1:5000/user', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
        else setError('Failed to fetch users');
      } catch {
        setError('Failed to fetch users');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} size="large" color="#388E3C" />;
  if (error) return <ThemedText style={{ color: '#D32F2F', margin: 20 }}>{error}</ThemedText>;

  return (
    <ScrollView style={styles.container}>
      {users.map(user => (
        <TouchableOpacity
          key={user._id || user.id}
          style={styles.card}
          onPress={() => router.push(`/user-detail/${user._id || user.id}`)}
        >
          <Image source={{ uri: user.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username || 'User') }} style={styles.avatar} />
          <View style={styles.info}>
            <ThemedText style={styles.username}>{user.username}</ThemedText>
            <ThemedText style={styles.email}>{user.email}</ThemedText>
            <View style={{ marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2 }}>
              <ThemedText style={{ color: '#388E3C', fontWeight: '700', fontSize: 13 }}>Role: {user.role}</ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
} 