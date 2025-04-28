import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';

interface ChatMessageProps {
  text: string;
  isUser: boolean;
}

export default function ChatMessage({ text, isUser }: ChatMessageProps) {
  const { darkMode } = useTheme();
  
  const containerStyles = [
    styles.container,
    isUser ? styles.userContainer : styles.botContainer,
    darkMode && (isUser ? styles.userContainerDark : styles.botContainerDark),
  ];
  
  const textStyles = [
    styles.text,
    isUser ? styles.userText : styles.botText,
    darkMode && (isUser ? styles.userTextDark : styles.botTextDark),
  ];
  
  return (
    <Animated.View 
      style={containerStyles}
      entering={isUser ? FadeInRight.duration(300) : FadeInLeft.duration(300)}
    >
      <Text style={textStyles}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userContainer: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.dark.primaryBlue,
    borderTopRightRadius: 4,
  },
  botContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 4,
  },
  userContainerDark: {
    backgroundColor: '#2D3748',
  },
  botContainerDark: {
    backgroundColor: '#1A202C',
  },
  text: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: Colors.dark.text,
  },
  userTextDark: {
    color: '#fff',
  },
  botTextDark: {
    color: '#E2E8F0',
  },
});