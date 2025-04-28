import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar as CalendarIcon, List, Plus } from 'lucide-react-native';
import AppHeader from '@/components/AppHeader';
import MeetingItem from '@/components/MeetingItem';
import MonthCalendar from '@/components/MonthCalendar';
import FAB from '@/components/FAB';
import Colors from '@/constants/Colors';
import { getMeetings } from '@/services/meetingService';
import { Meeting } from '@/types';

export default function MeetingsScreen() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, [selectedDate]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      // In calendar mode, fetch meetings for the selected month
      // In list mode, fetch all upcoming meetings
      const filter = viewMode === 'calendar' 
        ? { month: selectedDate.getMonth() + 1, year: selectedDate.getFullYear() }
        : { upcoming: true };
        
      const meetingsData = await getMeetings(filter);
      setMeetings(meetingsData);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'calendar' : 'list');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      <AppHeader 
        title="Meetings" 
        rightComponent={
          <TouchableOpacity onPress={toggleViewMode} style={styles.viewToggle}>
            {viewMode === 'list' 
              ? <CalendarIcon size={24} color={Colors.dark.text} />
              : <List size={24} color={Colors.dark.text} />
            }
          </TouchableOpacity>
        } 
      />
      
      {viewMode === 'calendar' ? (
        <View style={styles.calendarContainer}>
          <MonthCalendar 
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            markedDates={meetings.map(m => new Date(m.scheduledTime))}
          />
          
          <View style={styles.meetingsForDateContainer}>
            <Text style={styles.dateTitle}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            
            <FlatList
              data={meetings.filter(m => {
                const meetingDate = new Date(m.scheduledTime);
                return meetingDate.toDateString() === selectedDate.toDateString();
              })}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <MeetingItem
                  meeting={item}
                  onPress={() => router.push(`/meeting/${item.id}`)}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyDay}>
                  <Text style={styles.emptyDayText}>No meetings scheduled</Text>
                </View>
              }
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MeetingItem
              meeting={item}
              onPress={() => router.push(`/meeting/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No upcoming meetings</Text>
              <Text style={styles.emptyStateText}>
                Schedule a meeting to notarize your documents
              </Text>
            </View>
          }
        />
      )}
      
      <FAB 
        icon={<Plus size={24} color="#fff" />}
        onPress={() => router.push('/meeting/schedule')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  viewToggle: {
    padding: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  calendarContainer: {
    flex: 1,
  },
  meetingsForDateContainer: {
    flex: 1,
    padding: 16,
  },
  dateTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    marginBottom: 16,
    color: Colors.dark.text,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
    textAlign: 'center',
  },
  emptyDay: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyDayText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
  },
});