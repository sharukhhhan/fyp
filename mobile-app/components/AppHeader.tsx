import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { ReactNode } from 'react';

interface AppHeaderProps {
  title: string;
  rightComponent?: ReactNode;
}

export default function AppHeader({ title, rightComponent }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {rightComponent && (
        <View style={styles.rightComponent}>
          {rightComponent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 20,
    color: Colors.dark.text,
  },
  rightComponent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});