import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface FilterButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function FilterButton({ label, active, onPress }: FilterButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, active && styles.activeButton]} 
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    marginBottom: 8,
  },
  activeButton: {
    backgroundColor: Colors.dark.primaryBlue,
  },
  label: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: Colors.dark.text,
  },
  activeLabel: {
    color: '#fff',
  },
});