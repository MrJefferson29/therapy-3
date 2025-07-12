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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { WELLNESS_CATEGORIES } from './discover';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'https://therapy-3.onrender.com/article';

export default function CreateArticle() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState([]); // { uri, type, name }
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [error, setError] = useState('');
  const TITLE_LIMIT = 80;
  const CONTENT_LIMIT = 1000;
  const MAX_FILES = 5;

  const pickFiles = async () => {
    if (files.length >= MAX_FILES) {
      Alert.alert('Limit reached', `You can only attach up to ${MAX_FILES} files.`);
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      let picked = result.assets || [result];
      let newFiles = picked.map(f => ({
        uri: f.uri,
        type: f.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: f.fileName || f.uri.split('/').pop(),
      }));
      if (files.length + newFiles.length > MAX_FILES) {
        Alert.alert('Limit reached', `You can only attach up to ${MAX_FILES} files.`);
        newFiles = newFiles.slice(0, MAX_FILES - files.length);
      }
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = idx => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handlePreview = file => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!title || !content || !category) {
      setError('Please fill all fields.');
      return;
    }
    setLoading(true);
    try {
      let form = new FormData();
      form.append('title', title);
      form.append('content', content);
      form.append('category', category);
      files.forEach((file, i) => {
        form.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name || `file${i}`,
        });
      });
      const res = await fetch(API_URL, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create article');
      Alert.alert('Success', 'Article created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e.message || 'Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#e0ffe7", "#f2fff6"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={28} color="#1B4332" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Article</Text>

          {/* Section: Article Details */}
          <Text style={styles.sectionHeader}>Article Details</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={t => t.length <= TITLE_LIMIT && setTitle(t)}
              maxLength={TITLE_LIMIT}
              accessibilityLabel="Article title"
            />
            <Text style={styles.counter}>{title.length}/{TITLE_LIMIT}</Text>
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Content"
              value={content}
              onChangeText={t => t.length <= CONTENT_LIMIT && setContent(t)}
              multiline
              maxLength={CONTENT_LIMIT}
              accessibilityLabel="Article content"
            />
            <Text style={styles.counter}>{content.length}/{CONTENT_LIMIT}</Text>
          </View>

          {/* Section: Category */}
          <Text style={styles.sectionHeader}>Category</Text>
          <View style={[styles.input, { padding: 0, marginBottom: 16 }]}> 
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={{ height: 44, width: '100%' }}
              dropdownIconColor="#388E3C"
              accessibilityLabel="Select category"
            >
              <Picker.Item label="Select Category" value="" />
              {WELLNESS_CATEGORIES.map(cat => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
              ))}
            </Picker>
          </View>

          {/* Section: Attachments */}
          <Text style={styles.sectionHeader}>Attachments</Text>
          <View style={styles.fileRow}>
            <Text style={styles.label}>Files (images/videos):</Text>
            <TouchableOpacity style={styles.addBtn} onPress={pickFiles} accessibilityLabel="Add file">
              <Ionicons name="add" size={22} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
            <Text style={styles.counter}>{files.length}/{MAX_FILES}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {files.map((file, idx) => (
              <View key={idx} style={styles.fileThumbWrap}>
                <Pressable onPress={() => handlePreview(file)} accessibilityLabel={`Preview file ${file.name}`}> 
                  {file.type.startsWith('image') ? (
                    <Image source={{ uri: file.uri }} style={styles.fileThumb} />
                  ) : (
                    <View style={styles.fileThumbVideo}><Ionicons name="videocam" size={32} color="#388E3C" /></View>
                  )}
                </Pressable>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeFile(idx)} accessibilityLabel={`Remove file ${file.name}`}>
                  <Ionicons name="close-circle" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ height: 80 }} /> {/* Spacer for sticky button */}
        </ScrollView>
        {/* Sticky Submit Button */}
        <View style={styles.stickyBtnWrap} pointerEvents={loading ? 'none' : 'auto'}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} accessibilityLabel="Submit article">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit</Text>}
          </TouchableOpacity>
        </View>
        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#388E3C" />
          </View>
        )}
        {/* File Preview Modal */}
        <Modal visible={showPreview} transparent animationType="fade" onRequestClose={() => setShowPreview(false)}>
          <Pressable style={styles.previewOverlay} onPress={() => setShowPreview(false)}>
            {previewFile && previewFile.type.startsWith('image') ? (
              <Image source={{ uri: previewFile.uri }} style={styles.previewImage} />
            ) : previewFile ? (
              <View style={styles.previewVideo}><Ionicons name="videocam" size={64} color="#388E3C" /></View>
            ) : null}
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 48,
    alignItems: 'stretch',
    paddingBottom: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 32,
    left: 16,
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 16,
    alignSelf: 'center',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: '#388E3C',
    marginBottom: 8,
    marginTop: 18,
    letterSpacing: 0.2,
  },
  inputWrap: {
    marginBottom: 10,
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#BBECCA',
  },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    fontSize: 12,
    color: '#388E3C',
    fontWeight: '600',
    backgroundColor: '#e0ffe7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: '#1B4332',
    fontWeight: '600',
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#388E3C',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  fileThumbWrap: {
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    width: 72,
  },
  fileThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  fileThumbVideo: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#e0ffe7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 11,
    color: '#1B4332',
    marginTop: 2,
    maxWidth: 64,
    textAlign: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  submitBtn: {
    backgroundColor: '#388E3C',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 24,
    elevation: 2,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  stickyBtnWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 4,
    zIndex: 10,
    elevation: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 320,
    height: 320,
    borderRadius: 16,
    resizeMode: 'contain',
  },
  previewVideo: {
    width: 320,
    height: 320,
    borderRadius: 16,
    backgroundColor: '#e0ffe7',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 