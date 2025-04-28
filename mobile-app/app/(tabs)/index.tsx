import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import DashboardCard from '@/components/DashboardCard';
import MeetingCard from '@/components/MeetingCard';
import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { getMeetings } from '@/services/meetingService';
import { getDocuments } from '@/services/documentService';
import { Meeting, Document } from '@/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent documents
        const documents = await getDocuments({ limit: 3 });
        setRecentDocuments(documents);

        // Fetch upcoming meetings
        const meetings = await getMeetings({ upcoming: true, limit: 3 });
        setUpcomingMeetings(meetings);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleNewDocument = () => {
    router.push('/document/new');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      <AppHeader title={`Hello, ${user?.firstName || 'User'}`} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          {recentDocuments.length > 0 ? (
            recentDocuments.map((doc, index) => (
              <DashboardCard 
                key={doc.id || index}
                title={doc.title}
                description={doc.description}
                status={doc.status}
                date={doc.updatedAt}
                onPress={() => router.push(`/document/${doc.id}`)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent documents</Text>
            </View>
          )}
          <ActionButton 
            icon={<Plus size={24} color="#fff" />}
            label="New Document"
            onPress={handleNewDocument}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((meeting, index) => (
              <MeetingCard 
                key={meeting.id || index}
                title={meeting.title}
                date={new Date(meeting.scheduledTime)}
                notaryName={meeting.notaryName}
                onPress={() => router.push(`/meeting/${meeting.id}`)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming meetings</Text>
            </View>
          )}
          <ActionButton 
            label="Schedule Meeting"
            onPress={() => router.push('/meeting/schedule')}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    marginBottom: 16,
    color: Colors.dark.text,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    color: Colors.dark.textDim,
    fontFamily: 'Roboto-Regular',
  },
});