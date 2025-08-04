import { useColorScheme } from './useColorScheme';
import { Colors } from '../constants/Colors';

export const useTheme = () => {
  try {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme] || Colors.light;
    
    return {
      colorScheme,
      colors,
      isDark: Boolean(colorScheme === 'dark'),
      isLight: Boolean(colorScheme === 'light'),
    
    // Helper functions for common styling patterns
    getCardStyle: () => ({
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadow,
    }),
    
    getTextStyle: (variant: 'primary' | 'secondary' | 'tertiary' | 'inverse' = 'primary') => ({
      color: colors[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof colors],
    }),
    
    getBackgroundStyle: (variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => ({
      backgroundColor: colors[`background${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof colors],
    }),
    
    getBorderStyle: (variant: 'light' | 'dark' = 'light') => ({
      borderColor: colors[`border${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof colors],
    }),
    
          getStatusStyle: (status: 'success' | 'warning' | 'error' | 'info') => ({
        backgroundColor: colors[`${status}Light` as keyof typeof colors],
        borderColor: colors[status as keyof typeof colors],
      }),
    };
  } catch (error) {
    // Fallback to light theme if there's any error
    return {
      colorScheme: 'light',
      colors: Colors.light,
      isDark: false,
      isLight: true,
      getCardStyle: () => ({
        backgroundColor: Colors.light.card,
        borderColor: Colors.light.cardBorder,
        shadowColor: Colors.light.shadow,
      }),
      getTextStyle: () => ({
        color: Colors.light.textPrimary,
      }),
      getBackgroundStyle: () => ({
        backgroundColor: Colors.light.backgroundPrimary,
      }),
      getBorderStyle: () => ({
        borderColor: Colors.light.border,
      }),
      getStatusStyle: () => ({
        backgroundColor: Colors.light.successLight,
        borderColor: Colors.light.success,
      }),
    };
  }
}; 