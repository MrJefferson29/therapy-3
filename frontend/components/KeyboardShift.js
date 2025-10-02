import React, { useEffect, useState, useRef } from 'react';
import { Animated, Dimensions, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KeyboardShift({ children, inputComponent, style }) {
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const keyboardShowListener = useRef(null);
  const keyboardHideListener = useRef(null);

  useEffect(() => {
    // Use the newer addListener API for better compatibility
    keyboardShowListener.current = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      handleKeyboardShow
    );
    
    keyboardHideListener.current = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      handleKeyboardHide
    );

    return () => {
      if (keyboardShowListener.current) {
        keyboardShowListener.current.remove();
      }
      if (keyboardHideListener.current) {
        keyboardHideListener.current.remove();
      }
    };
  }, []);

  const handleKeyboardShow = (event) => {
    const { height } = event.endCoordinates;
    setIsKeyboardVisible(true);
    
    Animated.timing(keyboardHeight, {
      toValue: height,
      duration: Platform.OS === 'ios' ? 250 : 150,
      useNativeDriver: false,
    }).start();
  };

  const handleKeyboardHide = () => {
    setIsKeyboardVisible(false);
    
    Animated.timing(keyboardHeight, {
      toValue: 0,
      duration: Platform.OS === 'ios' ? 250 : 150,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Content area - stays in place */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* Input component - moves up with keyboard */}
      <Animated.View 
        style={[
          styles.inputContainer,
          {
            bottom: keyboardHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [insets.bottom, 0],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        {inputComponent}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
}); 