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

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation, onRegisterSuccess }) {
  const { colors, isDark = false } = useTheme();
  const { register, loading, error } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

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

  const validateForm = () => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const ok = await register({ username, email, password });
    if (ok) {
      setSuccess(true);
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      setTimeout(() => {
        setSuccess(false);
        if (onRegisterSuccess) onRegisterSuccess();
        if (navigation) navigation.navigate('Login');
      }, 1500);
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
        marginBottom: height * 0.06,
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
        marginBottom: 16,
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
        marginBottom: 16,
      },
      errorText: {
        color: colors.error,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
      },
      successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? colors.success + '20' : colors.success + '15',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
      },
      successText: {
        color: colors.success,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
      },
      registerButton: {
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
      registerButtonText: {
        color: colors.textInverse,
        fontSize: 18,
        fontWeight: '700',
      },
      loginSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
      },
      loginText: {
        color: isDark ? colors.textSecondary : colors.textSecondary,
        fontSize: 16,
      },
      loginButton: {
        marginLeft: 8,
      },
      loginButtonText: {
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
                  Create Account
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Join our community and start your wellness journey
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

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, { 
                    borderColor: focused === 'email' ? colors.primary : isDark ? colors.border : colors.border 
                  }]}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      style={[styles.inputIcon, { 
                        color: focused === 'email' ? colors.primary : isDark ? colors.textTertiary : colors.textTertiary 
                      }]} 
                    />
              <TextInput
                      style={styles.textInput}
                placeholder="Email"
                      placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                      autoCorrect={false}
                keyboardType="email-address"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
              />
            </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={[styles.passwordContainer, { 
                    borderColor: focused === 'password' ? colors.primary : isDark ? colors.border : colors.border 
                  }]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      style={[styles.inputIcon, { 
                        color: focused === 'password' ? colors.primary : isDark ? colors.textTertiary : colors.textTertiary 
                      }]} 
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

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <View style={[styles.passwordContainer, { 
                    borderColor: focused === 'confirmPassword' ? colors.primary : isDark ? colors.border : colors.border 
                  }]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      style={[styles.inputIcon, { 
                        color: focused === 'confirmPassword' ? colors.primary : isDark ? colors.textTertiary : colors.textTertiary 
                      }]} 
                    />
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm Password"
                      placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocused('confirmPassword')}
                      onBlur={() => setFocused('')}
                    />
                    <TouchableOpacity 
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off" : "eye"} 
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

                {/* Success Message */}
            {success ? (
                  <Animated.View style={[styles.successContainer, { opacity: successAnim }]}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={18} 
                      color={colors.success} 
                    />
                    <ThemedText style={styles.successText}>
                      Registration successful! Redirecting to login...
                    </ThemedText>
                  </Animated.View>
                ) : null}

                {/* Register Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity 
                    style={styles.registerButton} 
                    onPress={handleRegister} 
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.textInverse} size="small" />
                    ) : (
                      <ThemedText style={styles.registerButtonText}>
                        Create Account
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Login Link */}
                <View style={styles.loginSection}>
                  <ThemedText style={styles.loginText}>
                    Already have an account?
                  </ThemedText>
                  <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={() => navigation && navigation.navigate('Login')}
                  >
                    <ThemedText style={styles.loginButtonText}>
                      Sign In
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