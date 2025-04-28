import { View, Text, StyleSheet, TouchableOpacity, StyleProp, TextStyle } from 'react-native';
import Colors from '@/constants/Colors';
import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react-native';

interface SettingsItemProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
}

export default function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
  titleStyle,
}: SettingsItemProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{icon}</View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      {rightComponent ? (
        <View style={styles.rightComponentContainer}>
          {rightComponent}
        </View>
      ) : onPress ? (
        <ChevronRight size={20} color={Colors.dark.textDim} />
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.dark.text,
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
    marginTop: 2,
  },
  rightComponentContainer: {
    marginLeft: 8,
  },
});