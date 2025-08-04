import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Modal } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export default function Loader({ visible, message }) {
  const { colors, isDark = false } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.18)' }]}>
        <View style={[styles.container, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          {message ? <Text style={[styles.message, { color: isDark ? '#E8E8E8' : '#333' }]}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 