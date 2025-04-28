import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { Calendar, Clock } from 'lucide-react-native';

interface MeetingCardProps {
  title: string;
  date: Date;
  notaryName: string;
  onPress: () => void;
}

export default function MeetingCard({
  title,
  date,
  notaryName,
  onPress,
}: MeetingCardProps) {
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        
        <View style={styles.detailRow}>
          <Calendar size={16} color={Colors.dark.textDim} style={styles.icon} />
          <Text style={styles.detailText}>{formattedDate}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Clock size={16} color={Colors.dark.textDim} style={styles.icon} />
          <Text style={styles.detailText}>{formattedTime}</Text>
        </View>
        
        <Text style={styles.notaryText}>with {notaryName}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.teal,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  detailText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
  },
  notaryText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: Colors.dark.primaryBlue,
    marginTop: 4,
  },
});