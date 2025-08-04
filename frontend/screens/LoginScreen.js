import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Animated, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const { colors, isDark = false } = useTheme();
  const { login, loading, error } = useAuth();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState('');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
      toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
      useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const success = await login({ username, password });
    if (success) {
      if (onLoginSuccess) onLoginSuccess();
      router.replace('/');
    }
  };

  const getStyles = () => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: isDark ? colors.backgroundPrimary : colors.backgroundPrimary,
      },
      gradient: {
        flex: 1,
      },
      scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
      },
      headerSection: {
        alignItems: 'center',
        marginBottom: height * 0.08,
      },
      logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: isDark ? colors.primary + '20' : colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
      },
      title: {
        fontSize: Math.min(width * 0.08, 32),
        fontWeight: '800',
        color: isDark ? colors.textPrimary : colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
      },
      subtitle: {
        fontSize: Math.min(width * 0.04, 16),
        color: isDark ? colors.textSecondary : colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
      },
      formSection: {
        width: '100%',
        maxWidth: 400,
      },
      inputContainer: {
        marginBottom: 20,
      },
      inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? colors.card : colors.card,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: focused === 'username' ? colors.primary : isDark ? colors.border : colors.border,
        paddingHorizontal: 16,
        paddingVertical: 4,
        minHeight: 56,
      },
      inputIcon: {
        marginRight: 12,
        fontSize: 20,
        color: focused === 'username' ? colors.primary : isDark ? colors.textTertiary : colors.textTertiary,
      },
      textInput: {
        flex: 1,
        fontSize: 16,
        color: isDark ? colors.textPrimary : colors.textPrimary,
        paddingVertical: 12,
      },
      passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? colors.card : colors.card,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: focused === 'password' ? colors.primary : isDark ? colors.border : colors.border,
        paddingHorizontal: 16,
        paddingVertical: 4,
        minHeight: 56,
      },
      passwordInput: {
        flex: 1,
        fontSize: 16,
        color: isDark ? colors.textPrimary : colors.textPrimary,
        paddingVertical: 12,
      },
      eyeButton: {
        padding: 8,
        marginLeft: 8,
      },
      errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? colors.error + '20' : colors.error + '15',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
      },
      errorText: {
        color: colors.error,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
      },
      loginButton: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
      loginButtonText: {
        color: colors.textInverse,
        fontSize: 18,
        fontWeight: '700',
      },
      forgotPasswordButton: {
        alignItems: 'center',
        marginBottom: 20,
      },
      forgotPasswordText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
      },
      registerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
      },
      registerText: {
        color: isDark ? colors.textSecondary : colors.textSecondary,
        fontSize: 16,
      },
      registerButton: {
        marginLeft: 8,
      },
      registerButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '700',
      },
    });
  };

  const styles = getStyles();

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={isDark ? colors.gradientSecondary : colors.gradientPrimary} 
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                width: '100%',
                alignItems: 'center',
              }}
            >
              {/* Header Section */}
              <View style={styles.headerSection}>
                <View style={styles.logoContainer}>
                  <Ionicons 
                    name="leaf" 
                    size={40} 
                    color={colors.primary} 
                  />
                </View>
                <ThemedText style={styles.title}>
                  Welcome Back
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Sign in to continue your wellness journey
                </ThemedText>
            </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                {/* Username Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons 
                      name="person-outline" 
                      size={20} 
                      style={styles.inputIcon} 
                    />
              <TextInput
                      style={styles.textInput}
                placeholder="Username"
                      placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                      autoCorrect={false}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused('')}
              />
            </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.passwordContainer}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      style={styles.inputIcon} 
                    />
              <TextInput
                      style={styles.passwordInput}
                placeholder="Password"
                      placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
              />
                    <TouchableOpacity 
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color={isDark ? colors.textTertiary : colors.textTertiary} 
                      />
                    </TouchableOpacity>
                  </View>
            </View>

                {/* Error Message */}
            {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons 
                      name="alert-circle" 
                      size={18} 
                      color={colors.error} 
                    />
                    <ThemedText style={styles.errorText}>
                      {error}
                    </ThemedText>
              </View>
            ) : null}

                {/* Login Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={handleLogin} 
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.textInverse} size="small" />
                    ) : (
                      <ThemedText style={styles.loginButtonText}>
                        Sign In
                      </ThemedText>
                    )}
              </TouchableOpacity>
            </Animated.View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPasswordButton}>
                  <ThemedText style={styles.forgotPasswordText}>
                    Forgot Password?
                  </ThemedText>
            </TouchableOpacity>

                {/* Register Link */}
                <View style={styles.registerSection}>
                  <ThemedText style={styles.registerText}>
                    Don't have an account?
                  </ThemedText>
                  <TouchableOpacity 
                    style={styles.registerButton}
                    onPress={() => navigation && navigation.navigate('Register')}
                  >
                    <ThemedText style={styles.registerButtonText}>
                      Sign Up
                    </ThemedText>
            </TouchableOpacity>
                </View>
              </View>
          </Animated.View>
          </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
    </View>
  );
} 