import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

const getStatusColor = (status, isDark = false) => {
  switch (status) {
    case 'pending':
      return isDark ? '#FFB74D' : '#FF9800';
    case 'approved':
      return isDark ? '#4BBE8A' : '#4CAF50';
    case 'declined':
      return isDark ? '#F44336' : '#f44336';
    case 'completed':
      return isDark ? '#64B5F6' : '#2196F3';
    case 'cancelled':
      return isDark ? '#BDBDBD' : '#9E9E9E';
    default:
      return isDark ? '#B0B0B0' : '#666';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'declined':
      return 'Declined';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export default function AppointmentMessage({ 
  appointment, 
  isTherapist, 
  onApprove, 
  onDecline,
  isOwnMessage 
}) {
  const { colors, isDark = false } = useTheme();
  const openMeetingLink = () => {
    if (appointment?.meetingLink) {
      Linking.openURL(appointment.meetingLink);
    }
  };

  return (
          <View style={[
        styles.container,
        { backgroundColor: isDark ? '#2A2A2A' : '#fff' },
        isOwnMessage ? 
          { 
            alignSelf: 'flex-end',
            backgroundColor: isDark ? '#3A5A3A' : '#E8F5E8',
            borderBottomRightRadius: 4,
          } : 
          { 
            alignSelf: 'flex-start',
            backgroundColor: isDark ? '#2A2A2A' : '#fff',
            borderBottomLeftRadius: 4,
            borderWidth: 1,
            borderColor: isDark ? '#454545' : '#E0E0E0',
          }
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="calendar" size={20} color={isDark ? '#4BBE8A' : "#4CAF50"} />
          <Text style={[styles.title, { color: isDark ? '#E8E8E8' : '#222' }]}>{appointment.title}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status, isDark) }]}>
          <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: isDark ? '#D0D0D0' : '#222' }]}>{appointment.description}</Text>

      {/* Time */}
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={16} color={isDark ? '#B0B0B0' : "#666"} />
        <Text style={[styles.timeText, { color: isDark ? '#B0B0B0' : '#666' }]}>
          {new Date(appointment.scheduledTime).toLocaleString()}
        </Text>
      </View>

      {/* Meeting Link */}
      {appointment.meetingLink && appointment.status === 'approved' && (
        <TouchableOpacity style={[styles.meetingLink, { 
          backgroundColor: isDark ? '#4BBE8A' : '#4CAF50'
        }]} onPress={openMeetingLink}>
          <Ionicons name="videocam-outline" size={16} color="#fff" />
          <Text style={[styles.meetingLinkText, { color: '#fff' }]}>Join Meeting</Text>
        </TouchableOpacity>
      )}

      {/* Notes */}
      {appointment.notes && (
        <View style={[styles.notesContainer, { backgroundColor: isDark ? '#353535' : '#f8f8f8' }]}>
          <Text style={[styles.notesLabel, { color: isDark ? '#E8E8E8' : '#222' }]}>Notes:</Text>
          <Text style={[styles.notesText, { color: isDark ? '#D0D0D0' : '#222' }]}>{appointment.notes}</Text>
        </View>
      )}

      {/* Action Buttons for Therapist */}
      {isTherapist && appointment.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton, { backgroundColor: isDark ? '#4BBE8A' : '#4CAF50' }]}
            onPress={() => onApprove(appointment)}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton, { backgroundColor: isDark ? '#F44336' : '#f44336' }]}
            onPress={() => onDecline(appointment)}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Message */}
      {appointment.status === 'approved' && (
        <View style={[styles.statusMessage, { borderTopColor: isDark ? '#454545' : 'rgba(0,0,0,0.1)' }]}>
          <Ionicons name="checkmark-circle" size={16} color={isDark ? '#4BBE8A' : "#4CAF50"} />
          <Text style={[styles.statusMessageText, { color: isDark ? '#E8E8E8' : '#222' }]}>
            Appointment approved! Check the meeting link above.
          </Text>
        </View>
      )}

      {appointment.status === 'declined' && (
        <View style={[styles.statusMessage, { borderTopColor: isDark ? '#454545' : 'rgba(0,0,0,0.1)' }]}>
          <Ionicons name="close-circle" size={16} color={isDark ? '#F44336' : "#f44336"} />
          <Text style={[styles.statusMessageText, { color: isDark ? '#E8E8E8' : '#222' }]}>
            Appointment declined by therapist.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginVertical: 8,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E8F5E8',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  meetingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  meetingLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  notesContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statusMessageText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontStyle: 'italic',
  },
}); 