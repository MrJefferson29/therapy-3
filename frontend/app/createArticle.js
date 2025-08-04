import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { WELLNESS_CATEGORIES } from './discover';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const { width: screenWidth } = Dimensions.get('window');
const API_URL = 'https://therapy-3.onrender.com/article';

export default function CreateArticle() {
  const { colors, isDark = false } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [error, setError] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const TITLE_LIMIT = 80;
  const CONTENT_LIMIT = 1000;
  const MAX_FILES = 5;

  // Theme-aware colors
  const themeColors = {
    primary: isDark ? '#4BBE8A' : '#388E3C',
    background: isDark ? '#1A1A1A' : '#F8F9FA',
    card: isDark ? '#2A2A2A' : '#FFFFFF',
    input: isDark ? '#353535' : '#FFFFFF',
    border: isDark ? '#454545' : '#E0E0E0',
    text: isDark ? '#E8E8E8' : '#222222',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
    placeholder: isDark ? '#888888' : '#999999',
    error: isDark ? '#FF6B6B' : '#FF3B30',
    success: isDark ? '#4BBE8A' : '#4CAF50',
    gradient: isDark ? ['#2A2A2A', '#1A1A1A'] : ['#F8F9FA', '#FFFFFF'],
  };

  const pickFiles = async () => {
    if (files.length >= MAX_FILES) {
      Alert.alert('Limit reached', `You can only attach up to ${MAX_FILES} files.`);
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
      
      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(f => ({
        uri: f.uri,
        type: f.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: f.fileName || f.uri.split('/').pop(),
      }));
        
      if (files.length + newFiles.length > MAX_FILES) {
        Alert.alert('Limit reached', `You can only attach up to ${MAX_FILES} files.`);
          const allowedFiles = newFiles.slice(0, MAX_FILES - files.length);
          setFiles([...files, ...allowedFiles]);
        } else {
          setFiles([...files, ...newFiles]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick files. Please try again.');
    }
  };

  const removeFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!title.trim()) {
      setError('Please enter a title for your article.');
      return;
    }
    
    if (!content.trim()) {
      setError('Please enter content for your article.');
      return;
    }
    
    if (!category) {
      setError('Please select a category for your article.');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('category', category);
      
      files.forEach((file, i) => {
        formData.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name || `file${i}`,
        });
      });
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create article');
      }
      
      Alert.alert(
        'Success!',
        'Your article has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      setError(error.message || 'Failed to create article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={themeColors.gradient}
      style={[styles.header, { borderBottomColor: themeColors.border }]}
    >
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.1)' }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color={themeColors.primary} />
          </TouchableOpacity>
      
      <ThemedText style={[styles.headerTitle, { color: themeColors.text }]}>
        Create Article
      </ThemedText>
      
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: themeColors.primary },
          (!title.trim() || !content.trim() || !category) && { opacity: 0.5 }
        ]}
        onPress={handleSubmit}
        disabled={loading || !title.trim() || !content.trim() || !category}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <ThemedText style={styles.submitButtonText}>Publish</ThemedText>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderFormSection = () => (
    <View style={styles.formSection}>
      {/* Title Input */}
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: themeColors.text }]}>
          Article Title *
        </ThemedText>
            <TextInput
          style={[styles.textInput, { 
            backgroundColor: themeColors.input,
            color: themeColors.text,
            borderColor: themeColors.border,
          }]}
          placeholder="Enter your article title..."
          placeholderTextColor={themeColors.placeholder}
              value={title}
          onChangeText={(text) => text.length <= TITLE_LIMIT && setTitle(text)}
              maxLength={TITLE_LIMIT}
          multiline={false}
        />
        <View style={styles.counterContainer}>
          <ThemedText style={[styles.counterText, { color: themeColors.textSecondary }]}>
            {title.length}/{TITLE_LIMIT}
          </ThemedText>
        </View>
      </View>

      {/* Category Selection */}
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: themeColors.text }]}>
          Category *
        </ThemedText>
        <TouchableOpacity
          style={[styles.categoryButton, { 
            backgroundColor: themeColors.input,
            borderColor: themeColors.border,
          }]}
          onPress={() => setShowCategoryPicker(true)}
          activeOpacity={0.8}
        >
          <ThemedText style={[
            styles.categoryButtonText,
            { color: category ? themeColors.text : themeColors.placeholder }
          ]}>
            {category || 'Select a category...'}
          </ThemedText>
          <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
          </View>

      {/* Content Input */}
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: themeColors.text }]}>
          Article Content *
        </ThemedText>
            <TextInput
          style={[styles.textArea, { 
            backgroundColor: themeColors.input,
            color: themeColors.text,
            borderColor: themeColors.border,
          }]}
          placeholder="Write your article content here..."
          placeholderTextColor={themeColors.placeholder}
              value={content}
          onChangeText={(text) => text.length <= CONTENT_LIMIT && setContent(text)}
          maxLength={CONTENT_LIMIT}
              multiline
          textAlignVertical="top"
        />
        <View style={styles.counterContainer}>
          <ThemedText style={[styles.counterText, { color: themeColors.textSecondary }]}>
            {content.length}/{CONTENT_LIMIT}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderAttachmentsSection = () => (
    <View style={styles.attachmentsSection}>
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
          Attachments
        </ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
          {files.length}/{MAX_FILES} files
        </ThemedText>
          </View>

      <TouchableOpacity
        style={[styles.addFilesButton, { 
          backgroundColor: themeColors.primary,
          opacity: files.length >= MAX_FILES ? 0.5 : 1
        }]}
        onPress={pickFiles}
        disabled={files.length >= MAX_FILES}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <ThemedText style={styles.addFilesButtonText}>Add Files</ThemedText>
      </TouchableOpacity>

      {files.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filesContainer}
          contentContainerStyle={styles.filesContent}
        >
          {files.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <TouchableOpacity
                style={styles.filePreview}
                onPress={() => handlePreview(file)}
                activeOpacity={0.8}
              >
                {file.type.startsWith('image') ? (
                  <Image source={{ uri: file.uri }} style={styles.fileImage} />
                ) : (
                  <View style={[styles.fileVideoContainer, { backgroundColor: themeColors.input }]}>
                    <Ionicons name="videocam" size={32} color={themeColors.primary} />
                  </View>
                )}
              </TouchableOpacity>
              
              <ThemedText style={[styles.fileName, { color: themeColors.text }]} numberOfLines={1}>
                {file.name}
              </ThemedText>
              
              <TouchableOpacity
                style={[styles.removeFileButton, { backgroundColor: themeColors.error }]}
                onPress={() => removeFile(index)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderError = () => (
    error ? (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(255,107,107,0.1)' : 'rgba(255,59,48,0.1)' }]}>
        <Ionicons name="alert-circle" size={20} color={themeColors.error} />
        <ThemedText style={[styles.errorText, { color: themeColors.error }]}>
          {error}
        </ThemedText>
          </View>
    ) : null
  );

  const renderCategoryPickerModal = () => (
    <Modal
      visible={showCategoryPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategoryPicker(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }]}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <ThemedText style={[styles.modalTitle, { color: themeColors.text }]}>
              Select Category
            </ThemedText>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Ionicons name="close" size={24} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.categoryList}>
            {WELLNESS_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  { borderBottomColor: themeColors.border },
                  category === cat.name && { backgroundColor: isDark ? 'rgba(75,190,138,0.15)' : 'rgba(56,142,60,0.1)' }
                ]}
                onPress={() => {
                  setCategory(cat.name);
                  setShowCategoryPicker(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name={cat.icon} size={24} color={themeColors.primary} />
                <ThemedText style={[styles.categoryItemText, { color: themeColors.text }]}>
                  {cat.name}
                </ThemedText>
                {category === cat.name && (
                  <Ionicons name="checkmark" size={20} color={themeColors.primary} />
                )}
                </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
          </View>
    </Modal>
  );

  const renderFilePreviewModal = () => (
    <Modal
      visible={showPreview}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPreview(false)}
    >
      <Pressable 
        style={[styles.previewOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.7)' }]}
        onPress={() => setShowPreview(false)}
      >
        {previewFile && (
          <Pressable onPress={() => {}}>
            {previewFile.type.startsWith('image') ? (
              <Image source={{ uri: previewFile.uri }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewVideo, { backgroundColor: themeColors.card }]}>
                <Ionicons name="videocam" size={64} color={themeColors.primary} />
                <ThemedText style={[styles.previewVideoText, { color: themeColors.text }]}>
                  Video Preview
                </ThemedText>
              </View>
            )}
          </Pressable>
        )}
          </Pressable>
        </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderFormSection()}
          {renderAttachmentsSection()}
          {renderError()}
          
          {/* Bottom spacing for submit button */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {renderCategoryPickerModal()}
      {renderFilePreviewModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formSection: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 50,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  categoryButtonText: {
    fontSize: 16,
    flex: 1,
  },
  attachmentsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  addFilesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  addFilesButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  filesContainer: {
    marginBottom: 16,
  },
  filesContent: {
    paddingRight: 20,
  },
  fileItem: {
    marginRight: 12,
    alignItems: 'center',
    position: 'relative',
  },
  filePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fileVideoContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 80,
  },
  removeFileButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
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
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  previewOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  previewImage: {
    width: screenWidth - 40,
    height: screenWidth - 40,
    borderRadius: 16,
    resizeMode: 'contain',
  },
  previewVideo: {
    width: screenWidth - 40,
    height: screenWidth - 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewVideoText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
}); 
 