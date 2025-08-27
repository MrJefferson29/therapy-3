import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

const API_URL = 'https://therapy-3.onrender.com';

export default function AppointmentApprovalModal({ 
  visible, 
  onClose, 
  appointment, 
  user, 
  token, 
  onAppointmentUpdated 
}) {
  const { colors, isDark = false } = useTheme();
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const approveAppointment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/appointment/${appointment._id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          meetingLink: meetingLink.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve appointment');
      }

      Alert.alert(
        'Success',
        'Appointment approved successfully! The client has been notified.',
        [
          {
            text: 'OK',
            onPress: () => {
              onAppointmentUpdated(data);
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error approving appointment:', error);
      Alert.alert('Error', error.message || 'Failed to approve appointment');
    } finally {
      setLoading(false);
    }
  };

  const declineAppointment = async () => {
    Alert.alert(
      'Decline Appointment',
      'Are you sure you want to decline this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_URL}/appointment/${appointment._id}/decline`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  notes: notes.trim(),
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Failed to decline appointment');
              }

              Alert.alert(
                'Appointment Declined',
                'The appointment has been declined and the client has been notified.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onAppointmentUpdated(data);
                      onClose();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error declining appointment:', error);
              Alert.alert('Error', error.message || 'Failed to decline appointment');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!appointment) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }]}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Appointment Request</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={[styles.modalBody, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]} showsVerticalScrollIndicator={false}>
            {/* Appointment Info */}
            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#E8E8E8' : '#222' }]}>Request Details</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="person" size={20} color={isDark ? '#B0B0B0' : "#666"} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>Client</Text>
                  <Text style={[styles.infoValue, { color: isDark ? '#E8E8E8' : '#222' }]}>{appointment.client?.username}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="document-text" size={20} color={isDark ? '#B0B0B0' : "#666"} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>Title</Text>
                  <Text style={[styles.infoValue, { color: isDark ? '#E8E8E8' : '#222' }]}>{appointment.title}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="chatbubble" size={20} color={isDark ? '#B0B0B0' : "#666"} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>Description</Text>
                  <Text style={[styles.infoValue, { color: isDark ? '#E8E8E8' : '#222' }]}>{appointment.description}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color={isDark ? '#B0B0B0' : "#666"} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>Requested Time</Text>
                  <Text style={[styles.infoValue, { color: isDark ? '#E8E8E8' : '#222' }]}>
                    {new Date(appointment.scheduledTime).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Approval Form */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#E8E8E8' : '#222' }]}>Session Details</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#E8E8E8' : '#222' }]}>Meeting Link *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: isDark ? '#353535' : '#f8f8f8',
                    color: isDark ? '#E8E8E8' : '#222',
                    borderColor: isDark ? '#454545' : '#ddd'
                  }]}
                  value={meetingLink}
                  onChangeText={setMeetingLink}
                  placeholder="Enter Zoom or Google Meet link"
                  placeholderTextColor={isDark ? '#B0B0B0' : "#888"}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={[styles.helperText, { color: isDark ? '#B0B0B0' : '#666' }]}>
                  Provide a Zoom, Google Meet, or other video conferencing link
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#E8E8E8' : '#222' }]}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { 
                    backgroundColor: isDark ? '#353535' : '#f8f8f8',
                    color: isDark ? '#E8E8E8' : '#222',
                    borderColor: isDark ? '#454545' : '#ddd'
                  }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any additional notes for the client"
                  placeholderTextColor={isDark ? '#B0B0B0' : "#888"}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.modalFooter, { backgroundColor: isDark ? '#2A2A2A' : '#fff', borderTopColor: isDark ? '#454545' : '#eee' }]}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.declineButton, { backgroundColor: isDark ? '#353535' : '#f8f8f8' }]}
                onPress={declineAppointment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={isDark ? '#F44336' : "#f44336"} />
                ) : (
                  <>
                    <Ionicons name="close" size={20} color={isDark ? '#F44336' : "#f44336"} />
                    <Text style={[styles.declineButtonText, { color: isDark ? '#F44336' : "#f44336" }]}>Decline</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.approveButton, { backgroundColor: isDark ? '#4BBE8A' : '#4CAF50' }, loading && styles.approveButtonDisabled]}
                onPress={approveAppointment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
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
    flex: 1,
    padding: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
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
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  declineButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  approveButtonDisabled: {
    opacity: 0.6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 