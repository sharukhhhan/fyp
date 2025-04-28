import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { ChevronRight } from 'lucide-react-native';

interface DashboardCardProps {
  title: string;
  description: string;
  status: string;
  date: string;
  onPress: () => void;
}

export default function DashboardCard({
  title,
  description,
  status,
  date,
  onPress,
}: DashboardCardProps) {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.dark.success;
      case 'pending':
        return Colors.dark.warning;
      case 'rejected':
        return Colors.dark.error;
      case 'draft':
        return Colors.dark.textDim;
      default:
        return Colors.dark.textDim;
    }
  };

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        
        <Text style={styles.date}>Updated: {formattedDate}</Text>
      </View>
      
      <View style={styles.arrow}>
        <ChevronRight size={20} color={Colors.dark.textDim} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.dark.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 12,
    color: '#fff',
    textTransform: 'capitalize',
  },
  description: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
    marginBottom: 8,
  },
  date: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: Colors.dark.textDim,
  },
  arrow: {
    marginLeft: 12,
  },
});