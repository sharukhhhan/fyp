import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const VideoCallItem = ({ call, onJoin, onReschedule, onCancel }) => {
  const theme = useTheme();
  
  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const { date, time } = formatDateTime(call.scheduledTime);
  
  // Calculate time until call
  const getTimeUntilCall = () => {
    const now = new Date();
    const callTime = new Date(call.scheduledTime);
    const diffMs = callTime - now;
    
    // If the call time is in the past
    if (diffMs < 0) {
      return 'Ended';
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'Starting now';
    } else if (diffMins < 60) {
      return `Starts in ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
    } else if (diffHours < 24) {
      return `Starts in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `Starts in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    }
  };

  // Check if call can be joined (within 10 minutes of scheduled time)
  const canJoinCall = () => {
    const now = new Date();
    const callTime = new Date(call.scheduledTime);
    const diffMs = callTime - now;
    const diffMins = Math.floor(diffMs / 60000);
    
    // Can join if within 10 minutes before or 30 minutes after start time
    return diffMins > -30 && diffMins < 10;
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title numberOfLines={1} style={styles.title}>
              {call.title}
            </Title>
            <Paragraph style={styles.timeUntil}>
              {getTimeUntilCall()}
            </Paragraph>
          </View>
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
            <Paragraph style={styles.metaText}>{date}</Paragraph>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
            <Paragraph style={styles.metaText}>{time}</Paragraph>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
            <Paragraph style={styles.metaText}>
              {call.participants.length} {call.participants.length === 1 ? 'participant' : 'participants'}
            </Paragraph>
          </View>
        </View>

        {call.documentTitle && (
          <View style={styles.documentInfo}>
            <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
            <Paragraph style={styles.documentText} numberOfLines={1}>
              Document: {call.documentTitle}
            </Paragraph>
          </View>
        )}

        <View style={styles.actions}>
          <Button 
            mode="contained" 
            onPress={() => onJoin(call.id)}
            disabled={!canJoinCall()}
            style={[styles.button, styles.joinButton]}
          >
            Join Call
          </Button>
          
          <View style={styles.secondaryActions}>
            <Button 
              mode="outlined" 
              onPress={() => onReschedule(call.id)}
              style={[styles.button, styles.rescheduleButton]}
            >
              Reschedule
            </Button>
            
            <Button 
              mode="text" 
              onPress={() => onCancel(call.id)}
              style={styles.button}
              textColor="#e74c3c"
            >
              Cancel
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  timeUntil: {
    fontSize: 14,
    color: '#666',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    marginLeft: 4,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  documentText: {
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  actions: {
    marginTop: 8,
  },
  button: {
    marginVertical: 4,
  },
  joinButton: {
    marginBottom: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rescheduleButton: {
    flex: 1,
    marginRight: 8,
  },
});

export default VideoCallItem;