import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

const { width: screenWidth } = Dimensions.get('window');

const SkeletonLoader = ({ width, height, borderRadius = 8, style, variant = 'default' }) => {
  const { colors, isDark = false } = useTheme();
  
  // Convert percentage strings to numbers or keep as is
  const getWidth = () => {
    if (typeof width === 'string' && width.includes('%')) {
      return width;
    }
    return width;
  };

  const getHeight = () => {
    if (typeof height === 'string' && height.includes('%')) {
      return height;
    }
    return height;
  };
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );

    // Pulse animation for some variants
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    shimmerAnimation.start();
    if (variant === 'pulse') {
      pulseAnimation.start();
    }

    return () => {
      shimmerAnimation.stop();
      pulseAnimation.stop();
    };
  }, [shimmerAnim, pulseAnim, variant]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0.7, 1],
    outputRange: [0.4, 0.8],
  });

  const getBackgroundColor = () => {
    if (isDark) {
      switch (variant) {
        case 'dark':
          return colors.skeletonDark;
        case 'light':
          return colors.skeletonLight;
        case 'pulse':
          return colors.skeletonPulse;
        default:
          return colors.skeleton;
      }
    } else {
      switch (variant) {
        case 'dark':
          return '#2C2C2C';
        case 'light':
          return '#F5F5F5';
        case 'pulse':
          return '#E8E8E8';
        default:
          return '#E0E0E0';
      }
    }
  };

  const content = (
    <View
      style={[
        {
          width: getWidth(),
          height: getHeight(),
          borderRadius,
          backgroundColor: getBackgroundColor(),
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </Animated.View>
    </View>
  );

  if (variant === 'pulse') {
    return (
      <Animated.View style={{ opacity }}>
        {content}
      </Animated.View>
    );
  }

  return content;
};

// Specialized skeleton components
export const TextSkeleton = ({ lines = 1, lineHeight = 16, spacing = 4, width = '100%' }) => (
  <View>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        width={index === lines - 1 ? '60%' : width}
        height={lineHeight}
        borderRadius={4}
        variant="pulse"
        style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
      />
    ))}
  </View>
);

export const AvatarSkeleton = ({ size = 40, variant = 'default' }) => (
  <SkeletonLoader
    width={size}
    height={size}
    borderRadius={size / 2}
    variant={variant}
  />
);

export const CardSkeleton = ({ width = '100%', height = 120, borderRadius = 12 }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.cardContainer, { 
      width, 
      height, 
      borderRadius,
      backgroundColor: colors.card 
    }]}>
      <SkeletonLoader width="100%" height="60%" borderRadius={borderRadius} />
      <View style={styles.cardContent}>
        <TextSkeleton lines={2} lineHeight={14} spacing={6} />
        <View style={styles.cardMeta}>
          <SkeletonLoader width={60} height={12} borderRadius={6} />
          <SkeletonLoader width={40} height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );
};

export const ButtonSkeleton = ({ width = 100, height = 40, borderRadius = 20 }) => (
  <SkeletonLoader
    width={width}
    height={height}
    borderRadius={borderRadius}
    variant="pulse"
  />
);

const styles = StyleSheet.create({
  cardContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});

export default SkeletonLoader; 