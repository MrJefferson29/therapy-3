import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function AppointmentRequestButton({ onPress, disabled = false }) {
  const { colors, isDark = false } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.button, { 
        backgroundColor: isDark ? '#2A3A2A' : colors.accentLight, 
        borderColor: isDark ? '#4BBE8A' : colors.accent 
      }, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="calendar-outline" size={20} color={isDark ? '#4BBE8A' : colors.accent} />
      <Text style={[styles.buttonText, { color: isDark ? '#4BBE8A' : colors.accent }]}>Request Appointment</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
}); 