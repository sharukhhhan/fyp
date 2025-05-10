import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useDocuments } from '../contexts/DocumentContext';
import DocumentForm from '../components/DocumentForm';
import LoadingIndicator from '../components/LoadingIndicator';

const NewDocumentScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { documentId, isEditing, initialValues } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const [document, setDocument] = useState(null);
  
  const { 
    addDocument, 
    editDocument, 
    getDocument 
  } = useDocuments();

  // Fetch document if editing
  useEffect(() => {
    const loadDocument = async () => {
      if (isEditing && documentId) {
        try {
          setIsLoading(true);
          const documentData = await getDocument(documentId);
          setDocument(documentData);
        } catch (error) {
          console.error('Error loading document:', error);
          Alert.alert('Error', 'Failed to load document');
          navigation.goBack();
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadDocument();
  }, [isEditing, documentId, getDocument]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      
      if (isEditing) {
        // Update existing document
        await editDocument(documentId, formData);
        Alert.alert('Success', 'Document updated successfully');
      } else {
        // Create new document
        const newDocument = await addDocument(formData);
        
        // Ask if user wants to chat with AI about the document
        Alert.alert(
          'Document Created',
          'Would you like to discuss this document with AI?',
          [
            {
              text: 'No, go back to documents',
              onPress: () => navigation.navigate('Documents'),
              style: 'cancel',
            },
            {
              text: 'Yes, chat with AI',
              onPress: () => navigation.navigate('ChatWithAI', { 
                documentId: newDocument.id,
                documentTitle: newDocument.title
              }),
            },
          ]
        );
        return; // Return early as Alert has its own navigation logic
      }
      
      // Navigate back to documents screen after editing
      navigation.navigate('Documents');
    } catch (error) {
      console.error('Error saving document:', error);
      Alert.alert(
        'Error', 
        isEditing ? 'Failed to update document' : 'Failed to create document'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading && isEditing && !document) {
    return <LoadingIndicator message="Loading document..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={80}
    >
      <DocumentForm
        onSubmit={handleSubmit}
        initialValues={document || initialValues}
        isEditing={isEditing}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingIndicator 
            message={isEditing ? 'Updating document...' : 'Creating document...'}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NewDocumentScreen;