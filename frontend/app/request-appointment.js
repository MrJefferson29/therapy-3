import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const API_URL = 'http://192.168.1.177:5000';

export default function RequestAppointment() {
  const { therapistId } = useLocalSearchParams();
  const { user, token } = useAuth();
  const { colors, isDark = false } = useTheme();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingTherapist, setFetchingTherapist] = useState(true);

  useEffect(() => {
    if (therapistId) {
      fetchTherapist();
    }
  }, [therapistId]);

  const fetchTherapist = async () => {
    try {
      const response = await fetch(`${API_URL}/user/${therapistId}`);
      const data = await response.json();
      setTherapist(data);
    } catch (error) {
      console.error('Error fetching therapist:', error);
      Alert.alert('Error', 'Failed to load therapist information');
    } finally {
      setFetchingTherapist(false);
    }
  };

  const showDateTimePicker = () => {
    setShowDateTimeModal(true);
  };

  const handleDateTimeSubmit = () => {
    if (!dateInput.trim() || !timeInput.trim()) {
      Alert.alert('Error', 'Please enter both date and time');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;

    if (!dateRegex.test(dateInput)) {
      Alert.alert('Error', 'Please use date format: YYYY-MM-DD');
      return;
    }

    if (!timeRegex.test(timeInput)) {
      Alert.alert('Error', 'Please use time format: HH:MM');
      return;
    }

    const combinedDateTime = `${dateInput} ${timeInput}`;
    const selectedDate = new Date(combinedDateTime);

    if (selectedDate <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    setScheduledTime(combinedDateTime);
    setShowDateTimeModal(false);
    setDateInput('');
    setTimeInput('');
  };

  const requestAppointment = async () => {
    if (!title.trim() || !description.trim() || !scheduledTime.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Please log in to request an appointment');
      return;
    }

    const selectedDate = new Date(scheduledTime);
    if (selectedDate <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/appointment/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          scheduledTime: selectedDate.toISOString(),
          therapistId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(data.error || data.message || 'Failed to request appointment');
      }

      Alert.alert(
        'Success',
        'Appointment request sent successfully! The therapist will review your request.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error requesting appointment:', error);
      Alert.alert('Error', error.message || 'Failed to request appointment');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingTherapist) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1A1A1A' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color={isDark ? '#4BBE8A' : "#4CAF50"} />
        <Text style={[styles.loadingText, { color: isDark ? '#B0B0B0' : '#666' }]}>Loading therapist information...</Text>
      </View>
    );
  }

  if (!therapist) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? '#1A1A1A' : '#f5f5f5' }]}>
        <Ionicons name="alert-circle" size={64} color={isDark ? '#F44336' : "#f44336"} />
        <Text style={[styles.errorText, { color: isDark ? '#F44336' : '#f44336' }]}>Therapist not found</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? '#4BBE8A' : '#4CAF50' }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : '#ece5dd' }]}>
      <LinearGradient colors={isDark ? colors.gradientSecondary : ["#ece5dd", "#f2fff6"]} style={styles.gradient}>
        {/* Header */}
        <LinearGradient colors={colors.gradientPrimary} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)' }]}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Request Appointment</Text>
            <Text style={styles.headerSubtitle}>Schedule a session</Text>
          </View>
          <TouchableOpacity style={[styles.avatarWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)' }]}>
            <Ionicons name="calendar" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={[styles.content, { backgroundColor: isDark ? '#1A1A1A' : 'transparent' }]} showsVerticalScrollIndicator={false}>
          {/* Therapist Info */}
          <View style={[styles.therapistCard, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
            <View style={styles.therapistInfo}>
              <Text style={[styles.therapistName, { color: isDark ? '#E8E8E8' : '#222' }]}>{therapist.username}</Text>
              <Text style={[styles.therapistEmail, { color: isDark ? '#B0B0B0' : '#888' }]}>{therapist.email}</Text>
            </View>
          </View>

          {/* Form */}
          <View style={[styles.formContainer, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E8E8E8' : '#222' }]}>Appointment Details</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#E8E8E8' : '#333' }]}>Title</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#353535' : '#f9f9f9',
                  color: isDark ? '#E8E8E8' : '#333',
                  borderColor: isDark ? '#454545' : '#ddd'
                }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter appointment title"
                placeholderTextColor={isDark ? '#B0B0B0' : "#888"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#E8E8E8' : '#333' }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: isDark ? '#353535' : '#f9f9f9',
                  color: isDark ? '#E8E8E8' : '#333',
                  borderColor: isDark ? '#454545' : '#ddd'
                }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what you'd like to discuss"
                placeholderTextColor={isDark ? '#B0B0B0' : "#888"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#E8E8E8' : '#333' }]}>Date & Time</Text>
              <TouchableOpacity
                style={[styles.dateButton, { 
                  backgroundColor: isDark ? '#353535' : '#f9f9f9',
                  borderColor: isDark ? '#454545' : '#ddd'
                }]}
                onPress={showDateTimePicker}
              >
                <Ionicons name="calendar-outline" size={20} color={isDark ? '#4BBE8A' : "#4CAF50"} />
                <Text style={[styles.dateButtonText, { 
                  color: scheduledTime ? (isDark ? '#E8E8E8' : '#333') : (isDark ? '#B0B0B0' : '#888') 
                }]}>
                  {scheduledTime || 'Select date and time'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? '#4BBE8A' : "#4CAF50"} />
              </TouchableOpacity>
              <Text style={[styles.helperText, { color: isDark ? '#B0B0B0' : '#666' }]}>
                Format: YYYY-MM-DD HH:MM (e.g., 2024-01-15 14:30)
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { 
          backgroundColor: isDark ? 'rgba(42,42,42,0.9)' : 'rgba(255,255,255,0.9)',
          borderTopColor: isDark ? '#454545' : '#ddd'
        }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: isDark ? '#4BBE8A' : '#4CAF50' }, loading && styles.submitButtonDisabled]}
            onPress={requestAppointment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Request Appointment</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Time Modal */}
        <Modal
          visible={showDateTimeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDateTimeModal(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date & Time</Text>
                <TouchableOpacity onPress={() => setShowDateTimeModal(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </LinearGradient>

              <View style={[styles.modalBody, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDark ? '#E8E8E8' : '#333' }]}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: isDark ? '#353535' : '#f9f9f9',
                      color: isDark ? '#E8E8E8' : '#333',
                      borderColor: isDark ? '#454545' : '#ddd'
                    }]}
                    value={dateInput}
                    onChangeText={(text) => {
                      // Allow only numbers and hyphens
                      const cleaned = text.replace(/[^0-9-]/g, '');
                      setDateInput(cleaned);
                    }}
                    placeholder="2024-01-15"
                    placeholderTextColor={isDark ? '#B0B0B0' : "#888"}
                    maxLength={10}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDark ? '#E8E8E8' : '#333' }]}>Time (HH:MM)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: isDark ? '#353535' : '#f9f9f9',
                      color: isDark ? '#E8E8E8' : '#333',
                      borderColor: isDark ? '#454545' : '#ddd'
                    }]}
                    value={timeInput}
                    onChangeText={(text) => {
                      // Allow only numbers and colons
                      const cleaned = text.replace(/[^0-9:]/g, '');
                      setTimeInput(cleaned);
                    }}
                    placeholder="14:30"
                    placeholderTextColor={isDark ? '#B0B0B0' : "#888"}
                    maxLength={5}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { 
                      backgroundColor: isDark ? '#353535' : '#f5f5f5',
                      borderColor: isDark ? '#454545' : '#ddd'
                    }]}
                    onPress={() => setShowDateTimeModal(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: isDark ? '#B0B0B0' : '#666' }]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: isDark ? '#4BBE8A' : '#4CAF50' }]}
                    onPress={handleDateTimeSubmit}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ece5dd" },
  gradient: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#f44336',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  content: {
    flex: 1,
    padding: 16,
  },
  therapistCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  therapistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  therapistName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  therapistEmail: {
    fontSize: 14,
    color: '#888',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 