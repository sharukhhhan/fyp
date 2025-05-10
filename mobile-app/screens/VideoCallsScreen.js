import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  SafeAreaView,
  RefreshControl,
  Alert
} from 'react-native';
import { 
  FAB, 
  Divider,
  Text, 
  Searchbar,
  Chip,
  Button,
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import VideoCallItem from '../components/VideoCallItem';
import LoadingIndicator from '../components/LoadingIndicator';

// Mock video call data
const MOCK_VIDEO_CALLS = [
  {
    id: '1',
    title: 'Document Notarization - Lease Agreement',
    scheduledTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    participants: [
      { id: '1', name: 'John Doe', role: 'client' },
      { id: '2', name: 'Jane Smith', role: 'notary' }
    ],
    documentTitle: 'Residential Lease Agreement',
    status: 'confirmed'
  },
  {
    id: '2',
    title: 'Document Review - Power of Attorney',
    scheduledTime: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    participants: [
      { id: '1', name: 'John Doe', role: 'client' },
      { id: '3', name: 'Robert Johnson', role: 'notary' }
    ],
    documentTitle: 'General Power of Attorney',
    status: 'confirmed'
  },
  {
    id: '3',
    title: 'Document Signing - Will',
    scheduledTime: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
    participants: [
      { id: '1', name: 'John Doe', role: 'client' },
      { id: '4', name: 'Emily Brown', role: 'notary' }
    ],
    documentTitle: 'Last Will and Testament',
    status: 'confirmed'
  }
];

const VideoCallsScreen = ({ navigation }) => {
  const theme = useTheme();
  const [videoCalls, setVideoCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('upcoming');

  // Load video calls
  useEffect(() => {
    const loadVideoCalls = async () => {
      // In a real app, you would fetch this from your API
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setVideoCalls(MOCK_VIDEO_CALLS);
      } catch (error) {
        console.error('Error loading video calls:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVideoCalls();
  }, []);

  // Filter video calls based on search and filter
  useEffect(() => {
    let filtered = [...videoCalls];
    
    // Apply status filter
    if (activeFilter === 'upcoming') {
      filtered = filtered.filter(call => {
        const callTime = new Date(call.scheduledTime);
        return callTime > new Date();
      });
    } else if (activeFilter === 'past') {
      filtered = filtered.filter(call => {
        const callTime = new Date(call.scheduledTime);
        return callTime < new Date();
      });
    }
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(call => 
        call.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.documentTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by scheduled time
    filtered.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
    
    setFilteredCalls(filtered);
  }, [videoCalls, searchQuery, activeFilter]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // In a real app, you would refresh from your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Could update the video calls data here if needed
    } catch (error) {
      console.error('Error refreshing video calls:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle joining a call
  const handleJoinCall = (callId) => {
    // Navigate to call screen
    navigation.navigate('JoinCall', { callId });
  };

  // Handle rescheduling a call
  const handleRescheduleCall = (callId) => {
    // In a real app, would show a date/time picker
    Alert.alert(
      'Reschedule Call',
      'This feature would allow you to select a new date and time for your call.',
      [{ text: 'OK' }]
    );
  };

  // Handle canceling a call
  const handleCancelCall = (callId) => {
    Alert.alert(
      'Cancel Call',
      'Are you sure you want to cancel this video call?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: () => {
            // Remove the call from the list
            setVideoCalls(prevCalls => prevCalls.filter(call => call.id !== callId));
            Alert.alert('Success', 'Call canceled successfully');
          }
        }
      ]
    );
  };

  // Render filter chips
  const renderFilterChips = () => {
    return (
      <View style={styles.filterContainer}>
        <Chip
          selected={activeFilter === 'upcoming'}
          onPress={() => setActiveFilter('upcoming')}
          style={[
            styles.filterChip,
            activeFilter === 'upcoming' ? { backgroundColor: theme.colors.primary + '20' } : null
          ]}
          textStyle={activeFilter === 'upcoming' ? { color: theme.colors.primary } : null}
        >
          Upcoming
        </Chip>
        
        <Chip
          selected={activeFilter === 'past'}
          onPress={() => setActiveFilter('past')}
          style={[
            styles.filterChip,
            activeFilter === 'past' ? { backgroundColor: theme.colors.primary + '20' } : null
          ]}
          textStyle={activeFilter === 'past' ? { color: theme.colors.primary } : null}
        >
          Past
        </Chip>
        
        <Chip
          selected={activeFilter === 'all'}
          onPress={() => setActiveFilter('all')}
          style={[
            styles.filterChip,
            activeFilter === 'all' ? { backgroundColor: theme.colors.primary + '20' } : null
          ]}
          textStyle={activeFilter === 'all' ? { color: theme.colors.primary } : null}
        >
          All
        </Chip>
      </View>
    );
  };

  // Render empty state
  const renderEmptyList = () => {
    if (searchQuery || activeFilter !== 'all') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-off-outline" size={60} color="#bbb" />
          <Text style={styles.emptyText}>No video calls match your filters</Text>
          <Text style={styles.emptySubtext}>Try changing your search or filter</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="videocam-outline" size={60} color="#bbb" />
        <Text style={styles.emptyText}>No video calls scheduled</Text>
        <Text style={styles.emptySubtext}>Tap the + button to schedule your first call</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('ScheduleCall')}
          style={styles.scheduleButton}
        >
          Schedule Call
        </Button>
      </View>
    );
  };

  // If still loading initially
  if (isLoading && !refreshing) {
    return <LoadingIndicator message="Loading video calls..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Searchbar
        placeholder="Search video calls"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {renderFilterChips()}
      
      <Divider style={styles.divider} />
      
      <FlatList
        data={filteredCalls}
        renderItem={({ item }) => (
          <VideoCallItem 
            call={item}
            onJoin={() => handleJoinCall(item.id)}
            onReschedule={() => handleRescheduleCall(item.id)}
            onCancel={() => handleCancelCall(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('ScheduleCall')}
        color="#fff"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  filterChip: {
    marginRight: 8,
  },
  divider: {
    height: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  scheduleButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default VideoCallsScreen;