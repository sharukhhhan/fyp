import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface DividerWithTextProps {
  text: string;
}

export default function DividerWithText({ text }: DividerWithTextProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  text: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
    marginHorizontal: 10,
  },
});