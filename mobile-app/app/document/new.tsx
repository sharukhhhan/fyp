import { View, Text, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Send, Plus, X } from 'lucide-react-native';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import { createDocument } from '@/services/documentService';
import { useAuth } from '@/context/AuthContext';
import ChatMessage from '@/components/ChatMessage';

export default function NewDocumentScreen() {
  const { user } = useAuth();
  const [documentType, setDocumentType] = useState('');
  const [customType, setCustomType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string; text: string; isUser: boolean}>>([
    {
      id: '1',
      text: "Hi there! I'm your AI notary assistant. What document would you like to create today?",
      isUser: false
    }
  ]);

  const documentTypes = [
    'Power of Attorney',
    'Affidavit',
    'Living Will',
    'Deed Transfer',
    'Promissory Note',
    'Lease Agreement',
    'Custom Document',
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessageId = Date.now().toString();
    setChatMessages(prevMessages => [
      ...prevMessages,
      {
        id: userMessageId,
        text: message,
        isUser: true
      }
    ]);
    
    // Clear input
    setMessage('');
    
    // Simulate AI response (with loading state)
    setLoading(true);
    
    setTimeout(() => {
      // This would be replaced with actual AI response logic
      const aiResponse = getAIResponse(message);
      
      setChatMessages(prevMessages => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          isUser: false
        }
      ]);
      
      setLoading(false);
    }, 1500);
  };

  const getAIResponse = (userMessage: string) => {
    // This is a simple mock of AI responses
    // In a real app, this would be handled by an actual NLP service
    const lowercaseMsg = userMessage.toLowerCase();
    
    if (lowercaseMsg.includes('power of attorney')) {
      return "I can help with a Power of Attorney document. Could you tell me the name of the principal (the person granting authority) and the name of the agent (the person receiving authority)?";
    } else if (lowercaseMsg.includes('affidavit')) {
      return "I'll help you create an affidavit. What is the purpose of this affidavit?";
    } else if (lowercaseMsg.includes('will') || lowercaseMsg.includes('testament')) {
      return "For a Living Will, I'll need to know your healthcare preferences and who you'd like to designate as your healthcare proxy. Would you like to start with that information?";
    } else if (lowercaseMsg.includes('hello') || lowercaseMsg.includes('hi') || lowercaseMsg.includes('hey')) {
      return "Hello! I'm your AI notary assistant. What document would you like to create today?";
    } else if (lowercaseMsg.includes('help')) {
      return "I can help you create various legal documents like Power of Attorney, Affidavits, Living Wills, and more. Just tell me what document you need and I'll guide you through the process.";
    } else {
      return "I understand you need help with a document. Could you tell me more specifically what type of document you'd like to create?";
    }
  };

  const selectDocumentType = (type: string) => {
    if (type === 'Custom Document') {
      setDocumentType('custom');
    } else {
      setDocumentType(type);
      
      // Add an AI message explaining the document type
      setChatMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          text: `Great! Let's create a ${type}. What details would you like to include?`,
          isUser: false
        }
      ]);
    }
  };

  const handleSubmitCustomType = () => {
    if (!customType.trim()) return;
    
    setDocumentType(customType);
    
    // Add an AI message about the custom document
    setChatMessages(prevMessages => [
      ...prevMessages,
      {
        id: Date.now().toString(),
        text: `I'll help you create a ${customType}. What specific details should it include?`,
        isUser: false
      }
    ]);
    
    setCustomType('');
  };

  const handleCreateDocument = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would process the conversation and generate a document
      await createDocument({
        title: documentType,
        description: "Generated from AI conversation",
        content: JSON.stringify(chatMessages),
        status: 'draft'
      });
      
      router.replace('/(tabs)/documents');
    } catch (err) {
      console.error('Error creating document:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>AI Document Assistant</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {!documentType ? (
          <View style={styles.documentTypeContainer}>
            <Text style={styles.documentTypeTitle}>What document do you need?</Text>
            <Text style={styles.documentTypeSubtitle}>Select from common document types or specify a custom document.</Text>
            
            <ScrollView style={styles.documentTypeList}>
              {documentTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.documentTypeItem}
                  onPress={() => selectDocumentType(type)}
                >
                  <Text style={styles.documentTypeItemText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {documentType === 'custom' && (
              <View style={styles.customTypeContainer}>
                <TextInput
                  style={styles.customTypeInput}
                  placeholder="Enter custom document type"
                  placeholderTextColor={Colors.dark.textDim}
                  value={customType}
                  onChangeText={setCustomType}
                  autoFocus
                />
                <Button
                  label="Confirm"
                  onPress={handleSubmitCustomType}
                  variant="secondary"
                  style={styles.customTypeButton}
                />
                <TouchableOpacity
                  style={styles.cancelCustomButton}
                  onPress={() => setDocumentType('')}
                >
                  <X size={20} color={Colors.dark.textDim} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <>
            <ScrollView 
              style={styles.chatContainer}
              contentContainerStyle={styles.chatContent}
              ref={ref => { if (ref) ref.scrollToEnd({ animated: true }); }}
            >
              {chatMessages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  text={msg.text}
                  isUser={msg.isUser}
                />
              ))}
            </ScrollView>
            
            <View style={styles.inputContainer}>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Type your message..."
                  placeholderTextColor={Colors.dark.textDim}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                />
                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    !message.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={!message.trim() || loading}
                >
                  <Send size={20} color={!message.trim() ? Colors.dark.textDim : '#fff'} />
                </TouchableOpacity>
              </View>
              
              <Button
                label="Create Document"
                onPress={handleCreateDocument}
                variant="primary"
                style={styles.createButton}
                loading={loading}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    color: Colors.dark.text,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  documentTypeContainer: {
    flex: 1,
    padding: 24,
  },
  documentTypeTitle: {
    fontFamily: 'Roboto-Bold',
    fontSize: 22,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  documentTypeSubtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.textDim,
    marginBottom: 24,
  },
  documentTypeList: {
    flex: 1,
  },
  documentTypeItem: {
    backgroundColor: '#F7F9FC',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  documentTypeItemText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.dark.text,
  },
  customTypeContainer: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
  },
  customTypeInput: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.text,
  },
  customTypeButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
  },
  cancelCustomButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    maxHeight: 120,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.text,
  },
  sendButton: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  createButton: {
    marginTop: 16,
  },
});