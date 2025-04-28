import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { Video, Clock } from 'lucide-react-native';
import { Meeting } from '@/types';

interface MeetingItemProps {
  meeting: Meeting;
  onPress: () => void;
}

export default function MeetingItem({ meeting, onPress }: MeetingItemProps) {
  const meetingDate = new Date(meeting.scheduledTime);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  const formatDuration = (minutes: number) => {
    return `${minutes} min`;
  };
  
  const isUpcoming = meetingDate > new Date();
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isUpcoming ? styles.upcomingContainer : styles.pastContainer
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTime(meetingDate)}</Text>
        <View style={styles.durationContainer}>
          <Clock size={12} color={Colors.dark.textDim} style={styles.durationIcon} />
          <Text style={styles.durationText}>{formatDuration(meeting.durationMinutes || 30)}</Text>
        </View>
      </View>
      
      <View style={styles.contentColumn}>
        <Text style={styles.title} numberOfLines={1}>
          {meeting.title}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {meeting.description || `Meeting with ${meeting.notaryName}`}
        </Text>
        
        {isUpcoming && (
          <View style={styles.joinButtonContainer}>
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={onPress}
            >
              <Video size={16} color="#fff" style={styles.joinIcon} />
              <Text style={styles.joinText}>Join</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  upcomingContainer: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.teal,
  },
  pastContainer: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.textDim,
    opacity: 0.8,
  },
  timeColumn: {
    width: 80,
    backgroundColor: '#F7F9FC',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: 'Roboto-Bold',
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationIcon: {
    marginRight: 4,
  },
  durationText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: Colors.dark.textDim,
  },
  contentColumn: {
    flex: 1,
    padding: 12,
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
  joinButtonContainer: {
    alignItems: 'flex-start',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  joinIcon: {
    marginRight: 4,
  },
  joinText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 12,
    color: '#fff',
  },
});