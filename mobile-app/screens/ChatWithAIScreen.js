// Обновлённая версия ChatWithAIScreen.js с новой логикой AI общения
// Ответ AI всегда: { message, is_ready, document_id, session_id, operation }
// remarks / missing_info / warnings убраны — теперь message содержит всю инфу

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
import { Ionicons } from '@expo/vector-icons';
import { chatWithAI } from '../services/documentService';
import { useDocuments } from '../contexts/DocumentContext';
import { useLocalization } from '../contexts/LocalizationContext';

const ChatWithAIScreen = ({ route, navigation }) => {
  const { documentTitle, fromNewDocument = false } = route.params || {};
  const theme = useTheme();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const { addDocument } = useDocuments();
  const { t } = useLocalization();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [documentName, setDocumentName] = useState(documentTitle || t('newDocument'));
  const [documentReady, setDocumentReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showFinalize, setShowFinalize] = useState(false);

  useEffect(() => {
    const initialMessage = {
      id: '1',
      text: t('welcomeMessage'),
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  }, [t]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const result = await chatWithAI({ operation: 'chat', prompt: 'init' });
        if (result.session_id) {
          setSessionId(result.session_id);
        }
      } catch (err) {
        console.error('Ошибка инициализации сессии:', err);
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    return () => {
      if (sessionId) {
        chatWithAI({ operation: 'end', session_id: sessionId }).catch(console.warn);
      }
    };
  }, [sessionId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const result = await chatWithAI({
        operation: 'chat',
        session_id: sessionId,
        prompt: userMessage.text
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: result.message,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setDocumentContent(result.message);
      setDocumentReady(result.is_ready);
      setShowFinalize(result.is_ready);
    } catch (err) {
      console.error('AI error:', err);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        text: t('aiServiceError'),
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!sessionId) return;
    setIsSaving(true);
    try {
      await chatWithAI({ operation: 'finalize', session_id: sessionId });
      Alert.alert(t('done'), t('documentSaved'));
    } catch (err) {
      Alert.alert(t('error'), t('finalizationFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <View style={[
            styles.messageContainer,
            item.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
          ]}>
            {item.sender === 'ai' && (
              <Avatar.Icon size={36} icon="robot" style={styles.avatar} />
            )}
            <Card style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Card.Content>
                <Text>{item.text}</Text>
              </Card.Content>
            </Card>
          </View>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
      />

      {showFinalize && (
        <Button
          mode="contained"
          onPress={handleFinalize}
          style={{ margin: 12 }}
          loading={isSaving}
        >
          {t('finalizeDocument')}
        </Button>
      )}

      <View style={styles.inputContainer}>
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
          onPress={sendMessage}
          disabled={isLoading || !inputMessage.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
  messageContainer: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  userMessageContainer: { alignSelf: 'flex-end', marginLeft: 'auto' },
  aiMessageContainer: { alignSelf: 'flex-start', marginRight: 'auto' },
  avatar: { marginRight: 8, alignSelf: 'flex-end', marginBottom: 4 },
  messageBubble: { borderRadius: 16 },
  userBubble: { backgroundColor: '#3498db' },
  aiBubble: { backgroundColor: 'white' },
  messagesList: { padding: 16, paddingBottom: 8 },
});

export default ChatWithAIScreen;
