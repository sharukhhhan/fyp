import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  FlatList,
  TextInput as RNTextInput,
  Alert
} from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  IconButton, 
  ActivityIndicator,
  Button,
  useTheme
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useDocuments } from '../contexts/DocumentContext';
import { useLocalization } from '../contexts/LocalizationContext';

// Mock chat with AI service
const simulateAIResponse = async (message, documentTitle) => {
  // In a real app, this would call your AI service API
  return new Promise((resolve) => {
    setTimeout(() => {
      if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
        resolve(`Hello! I'm here to help you with your document "${documentTitle}". What would you like to discuss about it?`);
      } else if (message.toLowerCase().includes('draft') || message.toLowerCase().includes('write')) {
        resolve(`I'd be happy to help you draft this document. Let's start by outlining the key points you want to include in "${documentTitle}".`);
      } else if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('what is')) {
        resolve(`I can explain any concepts related to "${documentTitle}". Could you specify what aspect you'd like me to explain in more detail?`);
      } else if (message.toLowerCase().includes('suggest') || message.toLowerCase().includes('recommendation')) {
        resolve(`Based on the title "${documentTitle}", I suggest focusing on clarity and ensuring all necessary legal elements are included. Would you like specific recommendations for this type of document?`);
      } else if (message.toLowerCase().includes('save') || message.toLowerCase().includes('create document')) {
        resolve(`I've prepared a draft for "${documentTitle}". Would you like me to finalize and save this document now?`);
      } else if (message.toLowerCase().includes('done') || message.toLowerCase().includes('complete') || message.toLowerCase().includes('finish')) {
        resolve(`Great! I've compiled all the information for "${documentTitle}". When you're ready, you can tap the "Create Document" button in the top right to save it to your documents.`);
      } else {
        resolve(`I understand you're asking about "${documentTitle}". Could you provide more details about what you'd like assistance with?`);
      }
    }, 1500); // Simulate network delay
  });
};

// Mock document content
const mockDocumentContent = `
This is a sample document created with AI assistance.

DOCUMENT TITLE: [Document Name]

SECTION 1: INTRODUCTION
This section contains the introductory information about the document.

SECTION 2: MAIN CONTENT
This is where the main content of the document would be placed.

SECTION 3: TERMS AND CONDITIONS
This section outlines the terms and conditions applicable to this document.

SIGNATURES:
____________________
[Party 1]

____________________
[Party 2]
`;

const ChatWithAIScreen = ({ route, navigation }) => {
  const { documentId, documentTitle, fromNewDocument = false } = route.params || {};
  const theme = useTheme();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const { addDocument } = useDocuments();
  const { t } = useLocalization();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [documentName, setDocumentName] = useState(documentTitle || 'New Document');
  const [documentReady, setDocumentReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initial greeting message from AI
  useEffect(() => {
    let initialMessage;
    
    if (fromNewDocument) {
      initialMessage = {
        id: '1',
        text: t(`Hello! I'm here to help you create a new document. What type of document would you like to draft today?`),
        sender: 'ai',
        timestamp: new Date(),
      };
    } else {
      initialMessage = {
        id: '1',
        text: t(`Hello! I'm here to help you with your document "${documentName}". How can I assist you today?`),
        sender: 'ai',
        timestamp: new Date(),
      };
    }
    
    setMessages([initialMessage]);
  }, [documentName, fromNewDocument]);

  // Send message to AI
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // In a real app, call to your AI service would go here
      const aiResponse = await simulateAIResponse(userMessage.text, documentName);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      
      // If the message seems to be about completing the document
      if (
        userMessage.text.toLowerCase().includes('done') || 
        userMessage.text.toLowerCase().includes('complete') || 
        userMessage.text.toLowerCase().includes('finish') || 
        userMessage.text.toLowerCase().includes('save')
      ) {
        // Set mock document content - in a real app, this would come from the AI
        setDocumentContent(mockDocumentContent.replace('[Document Name]', documentName));
        setDocumentReady(true);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating a document from the AI chat
  const handleCreateDocument = async () => {
    if (!documentReady) {
      Alert.alert(
        t('documentNotReady'),
        t('pleaseComplete'),
        [{ text: t('ok') }]
      );
      return;
    }
    
    setIsSaving(true);
    
    try {
      // In a real app, you would send the document content to your backend
      // For now, we'll mock the document creation
      
      // Create document data
      const documentData = {
        title: documentName,
        description: `Created using AI assistance on ${new Date().toLocaleDateString()}`,
        content: documentContent,
        status: 'draft',
        createdAt: new Date().toISOString(),
        // In a real app, you'd convert the content to a file or use an API call
      };
      
      // Add document to storage/backend
      const newDocument = await addDocument(documentData);
      
      // Show success message
      Alert.alert(
        t('documentCreated'),
        t('documentSaved'),
        [
          {
            text: 'View Documents',
            onPress: () => navigation.navigate('Documents'),
          },
          {
            text: 'Continue Editing',
            onPress: () => navigation.navigate('DocumentDetail', { documentId: newDocument.id }),
          }
        ]
      );
    } catch (error) {
      console.error('Error creating document:', error);
      Alert.alert('Error', 'Failed to create document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Attach a document to the conversation
  const attachDocument = async () => {
    try {
      let file;
      
      if (Platform.OS === 'web') {
        // Create a file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx';
        
        // Create a promise to handle the file selection
        const filePromise = new Promise((resolve) => {
          input.onchange = (e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile) {
              resolve({
                name: selectedFile.name,
                uri: URL.createObjectURL(selectedFile),
                type: selectedFile.type,
                size: selectedFile.size
              });
            } else {
              resolve(null);
            }
          };
        });
        
        // Trigger file selection
        input.click();
        
        // Wait for file selection
        file = await filePromise;
        
        if (!file) {
          return; // User cancelled
        }
      } else {
        // Native platforms
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          copyToCacheDirectory: true
        });
        
        if (result.canceled) {
          return;
        }
        
        file = result.assets[0];
      }
      
      // Create a message about the attached document
      const userMessage = {
        id: Date.now().toString(),
        text: `I've attached a document: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
        attachment: {
          name: file.name,
          uri: file.uri,
          type: file.type,
        },
      };
      
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      
      // If we're creating a new document, update the name
      if (fromNewDocument) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to attach document. Please try again.');
    }
  };

  // Render chat message
  const renderMessage = ({ item }) => {
    const isUserMessage = item.sender === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUserMessage ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        {!isUserMessage && (
          <Avatar.Icon 
            size={36} 
            icon="robot" 
            style={styles.avatar}
            color="white"
            backgroundColor={theme.colors.primary}
          />
        )}
        
        <Card 
          style={[
            styles.messageBubble,
            isUserMessage ? styles.userBubble : styles.aiBubble,
            item.isError && styles.errorBubble
          ]}
        >
          <Card.Content>
            {item.attachment && (
              <View style={styles.attachmentContainer}>
                <Ionicons name="document-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.attachmentName}>{item.attachment.name}</Text>
              </View>
            )}
            <Text style={[
              styles.messageText,
              isUserMessage && styles.userMessageText,
              item.isError && styles.errorText
            ]}>
              {item.text}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  // Scroll to bottom when new message added
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Set navigation options to include Create Document button
  React.useLayoutEffect(() => {
    if (fromNewDocument) {
      navigation.setOptions({
        headerRight: () => (
          <Button
            mode="text"
            onPress={handleCreateDocument}
            loading={isSaving}
            disabled={isSaving || !documentReady}
            labelStyle={{ color: theme.colors.primary }}
          >
            {t('createDocument')}
          </Button>
        ),
      });
    }
  }, [navigation, documentReady, isSaving, fromNewDocument]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={80}
    >
      {fromNewDocument && documentReady && (
        <View style={styles.documentReadyBanner}>
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.documentReadyText}>
            {t('documentReadyTap')}
          </Text>
        </View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
          <Text style={styles.loadingText}>{t('aiThinking')}</Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <IconButton
          icon="paperclip"
          size={24}
          onPress={attachDocument}
        />
        
        <RNTextInput
          ref={inputRef}
          style={styles.input}
          placeholder={t('typeMessage')}
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
          onSubmitEditing={sendMessage}
        />
        
        <IconButton
          icon="send"
          size={24}
          color={inputMessage.trim() ? theme.colors.primary : '#c2c2c2'}
          disabled={!inputMessage.trim() || isLoading}
          onPress={sendMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  documentReadyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    paddingHorizontal: 16,
  },
  documentReadyText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  avatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  messageBubble: {
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#3498db',
  },
  aiBubble: {
    backgroundColor: 'white',
  },
  errorBubble: {
    backgroundColor: '#ffebee',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: 'white',
  },
  errorText: {
    color: '#e74c3c',
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentName: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
});

export default ChatWithAIScreen;