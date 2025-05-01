import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import Colors from '@/constants/Colors';
import { ReactNode } from 'react';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

export default function ActionButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  style,
}: ActionButtonProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        variant === 'primary' ? styles.primaryContainer : styles.secondaryContainer,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text 
        style={[
          styles.label,
          variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryContainer: {
    backgroundColor: Colors.dark.primaryBlue,
  },
  secondaryContainer: {
    backgroundColor: Colors.dark.teal,
  },
  iconContainer: {
    marginRight: 8,
  },
  label: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
  },
  primaryLabel: {
    color: '#fff',
  },
  secondaryLabel: {
    color: '#fff',
  },
});