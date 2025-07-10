import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 18, backgroundColor: '#eaeaea' },
  username: { fontWeight: '700', fontSize: 24, color: '#222', textAlign: 'center', marginBottom: 6 },
  email: { color: '#666', fontSize: 16, textAlign: 'center', marginBottom: 6 },
  role: { color: '#388E3C', fontWeight: '600', fontSize: 16, textAlign: 'center', marginBottom: 18 },
  btnRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  btn: { backgroundColor: '#388E3C', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 22, marginHorizontal: 8 },
  btnDisabled: { backgroundColor: '#bbb' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default function UserDetail() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`http://192.168.130.1:5000/user/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data && data._id) setUser(data);
        else setError('User not found');
      } catch {
        setError('Failed to fetch user');
      }
      setLoading(false);
    })();
  }, [id]);

  const updateRole = async (role) => {
    setSaving(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.130.1:5000/user/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      const data = await res.json();
      setUser(data);
      Alert.alert('Success', `User is now a ${role}`);
    } catch {
      setError('Failed to update role');
    }
    setSaving(false);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} size="large" color="#388E3C" />;
  if (error) return <ThemedText style={{ color: '#D32F2F', margin: 20 }}>{error}</ThemedText>;
  if (!user) return null;

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username || 'User') }} style={styles.avatar} />
      <ThemedText style={styles.username}>{user.username}</ThemedText>
      <ThemedText style={styles.email}>{user.email}</ThemedText>
      <View style={{ alignSelf: 'center', backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 18 }}>
        <ThemedText style={{ color: '#388E3C', fontWeight: '700', fontSize: 15 }}>Role: {user.role}</ThemedText>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, user.role === 'admin' && styles.btnDisabled]}
          onPress={() => updateRole('admin')}
          disabled={user.role === 'admin' || saving}
        >
          <ThemedText style={styles.btnText}>Make Admin</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, user.role === 'therapist' && styles.btnDisabled]}
          onPress={() => updateRole('therapist')}
          disabled={user.role === 'therapist' || saving}
        >
          <ThemedText style={styles.btnText}>Make Therapist</ThemedText>
        </TouchableOpacity>
      </View>
      {error ? <ThemedText style={{ color: '#D32F2F', marginTop: 18 }}>{error}</ThemedText> : null}
    </View>
  );
} 