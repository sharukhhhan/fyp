import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { FileText } from 'lucide-react-native';

interface DocumentCardProps {
  title: string;
  description: string;
  status: string;
  date: string;
  onPress: () => void;
}

export default function DocumentCard({
  title,
  description,
  status,
  date,
  onPress,
}: DocumentCardProps) {
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
      <View style={styles.iconContainer}>
        <FileText size={24} color={Colors.dark.primaryBlue} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        
        <View style={styles.footer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
          
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EBF2FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  date: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: Colors.dark.textDim,
  },
});