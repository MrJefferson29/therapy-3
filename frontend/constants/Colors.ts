/**
r * Comprehensive color palette for light and dark modes
 * Professional and accessible color scheme
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#4BBE8A';

export const Colors = {
  light: {
    // Primary colors
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Card and surface colors
    card: '#FFFFFF',
    cardSecondary: '#F8F9FA',
    cardTertiary: '#F4FFF4',
    cardBorder: '#E0E0E0',
    
    // Accent colors
    primary: '#1B4332',
    primaryLight: '#4BBE8A',
    primaryDark: '#0F2A1F',
    accent: '#388E3C',
    accentLight: '#E8F5E8',
    accentDark: '#2E7D32',
    
    // Status colors
    success: '#4CAF50',
    successLight: '#E8F5E8',
    warning: '#FF9800',
    warningLight: '#FFF3E0',
    error: '#D32F2F',
    errorLight: '#FFEBEE',
    info: '#2196F3',
    infoLight: '#E3F2FD',
    
    // Text colors
    textPrimary: '#222',
    textSecondary: '#666',
    textTertiary: '#888',
    textInverse: '#fff',
    
    // Background colors
    backgroundPrimary: '#fff',
    backgroundSecondary: '#F8F9FA',
    backgroundTertiary: '#F4FFF4',
    backgroundOverlay: 'rgba(0,0,0,0.25)',
    
    // Border colors
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    borderDark: '#CCC',
    
    // Shadow colors
    shadow: '#000',
    
    // Gradient colors
    gradientPrimary: ['#1B4332', '#4BBE8A'],
    gradientSecondary: ['#ece5dd', '#f2fff6'],
    gradientOverlay: ['transparent', 'rgba(0,0,0,0.7)'],
    
    // Chat colors
    chatUser: '#dcf8c6',
    chatBot: '#fff',
    chatError: '#FFE5E5',
    chatInput: '#fff',
    chatSend: '#075E54',
    
    // Skeleton colors
    skeleton: '#E0E0E0',
    skeletonLight: '#F5F5F5',
    skeletonDark: '#2C2C2C',
    skeletonPulse: '#E8E8E8',
  },
  dark: {
    // Primary colors
    text: '#E8E8E8',
    background: '#1A1A1A',
    tint: tintColorDark,
    icon: '#B8B8B8',
    tabIconDefault: '#B8B8B8',
    tabIconSelected: tintColorDark,
    
    // Card and surface colors
    card: '#2A2A2A',
    cardSecondary: '#353535',
    cardTertiary: '#2A3A2A',
    cardBorder: '#454545',
    
    // Accent colors
    primary: '#4BBE8A',
    primaryLight: '#6BCDA8',
    primaryDark: '#2E7D32',
    accent: '#4BBE8A',
    accentLight: '#2A3A2A',
    accentDark: '#2E7D32',
    
    // Status colors
    success: '#4CAF50',
    successLight: '#2A3A2A',
    warning: '#FF9800',
    warningLight: '#3A2F1F',
    error: '#F44336',
    errorLight: '#3A1F1F',
    info: '#2196F3',
    infoLight: '#1F2F3A',
    
    // Text colors
    textPrimary: '#E8E8E8',
    textSecondary: '#D0D0D0',
    textTertiary: '#B0B0B0',
    textInverse: '#000000',
    
    // Background colors
    backgroundPrimary: '#1A1A1A',
    backgroundSecondary: '#2A2A2A',
    backgroundTertiary: '#2A3A2A',
    backgroundOverlay: 'rgba(0,0,0,0.5)',
    
    // Border colors
    border: '#454545',
    borderLight: '#353535',
    borderDark: '#555555',
    
    // Shadow colors
    shadow: '#000000',
    
    // Gradient colors
    gradientPrimary: ['#2A3A2A', '#4BBE8A'],
    gradientSecondary: ['#2A2A2A', '#353535'],
    gradientOverlay: ['transparent', 'rgba(0,0,0,0.6)'],
    
    // Chat colors
    chatUser: '#3A5A3A',
    chatBot: '#2A2A2A',
    chatError: '#3A1F1F',
    chatInput: '#353535',
    chatSend: '#4BBE8A',
    
    // Skeleton colors
    skeleton: '#353535',
    skeletonLight: '#2A2A2A',
    skeletonDark: '#1A1A1A',
    skeletonPulse: '#454545',
  },
};

// Helper function to get theme-aware colors
export const getThemeColors = (colorScheme: 'light' | 'dark') => {
  return Colors[colorScheme];
};

// Helper function to get specific color with theme awareness
export const getColor = (colorScheme: 'light' | 'dark', colorKey: keyof typeof Colors.light) => {
  return Colors[colorScheme][colorKey];
};
