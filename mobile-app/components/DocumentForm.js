import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, Title, Subheading } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const DocumentForm = ({ onSubmit, initialValues = {}, isEditing = false }) => {
  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [documentFile, setDocumentFile] = useState(initialValues.documentFile || null);
  const [errors, setErrors] = useState({});

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!isEditing && !documentFile) {
      newErrors.documentFile = 'Please upload a document';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle document file selection
  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });
      
      // Handle different response formats based on Expo SDK version
      if (result.canceled) {
        return;
      }
      
      let fileInfo;
      
      // Handle newer Expo versions (assets array)
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        fileInfo = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
          size: asset.size,
        };
      } 
      // Handle older Expo versions (direct properties)
      else if (result.uri) {
        fileInfo = {
          uri: result.uri,
          name: result.name,
          type: result.mimeType || result.type,
          size: result.size,
        };
      } 
      // No valid file selected
      else {
        console.log('No file selected or invalid file format');
        return;
      }
      
      setDocumentFile(fileInfo);
      setErrors({ ...errors, documentFile: null });
    } catch (error) {
      console.error('Error picking document:', error);
      setErrors({ 
        ...errors, 
        documentFile: 'Error selecting document. Please try again.' 
      });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm()) {
      // For real app, you'd likely want to upload file to server here
      // For now, we're just passing the file info

      // Create form data with all values
      const formData = {
        title,
        description,
        documentFile,
        status: isEditing ? initialValues.status : 'draft',
      };
      
      onSubmit(formData);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.heading}>
        {isEditing ? 'Edit Document' : 'Create New Document'}
      </Title>
      
      <TextInput
        label="Document Title"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
        error={!!errors.title}
      />
      <HelperText type="error" visible={!!errors.title}>
        {errors.title}
      </HelperText>
      
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
        error={!!errors.description}
      />
      <HelperText type="error" visible={!!errors.description}>
        {errors.description}
      </HelperText>
      
      <Subheading style={styles.subheading}>Upload Document</Subheading>
      
      <TouchableOpacity
        style={[
          styles.uploadButton,
          documentFile ? styles.uploadComplete : null,
          errors.documentFile ? styles.uploadError : null
        ]}
        onPress={handleDocumentPick}
      >
        <Ionicons 
          name={documentFile ? "document" : "cloud-upload-outline"} 
          size={28} 
          color={documentFile ? "#2ecc71" : "#3498db"} 
        />
        <Subheading style={styles.uploadText}>
          {documentFile ? documentFile.name : 'Tap to upload a document'}
        </Subheading>
      </TouchableOpacity>
      <HelperText type="error" visible={!!errors.documentFile}>
        {errors.documentFile}
      </HelperText>
      
      {documentFile && (
        <Button 
          mode="text" 
          onPress={() => setDocumentFile(null)}
          style={styles.removeButton}
        >
          Remove File
        </Button>
      )}
      
      <View style={styles.actions}>
        <Button 
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          {isEditing ? 'Update Document' : 'Create Document'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  subheading: {
    marginTop: 8,
    marginBottom: 8,
  },
  uploadButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3498db',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  uploadComplete: {
    borderColor: '#2ecc71',
    borderStyle: 'solid',
  },
  uploadError: {
    borderColor: '#e74c3c',
  },
  uploadText: {
    marginTop: 8,
    textAlign: 'center',
  },
  removeButton: {
    marginTop: 8,
  },
  actions: {
    marginTop: 24,
    marginBottom: 24,
  },
  submitButton: {
    paddingVertical: 8,
  },
});

export default DocumentForm;