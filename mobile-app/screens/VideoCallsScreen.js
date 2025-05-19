import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  SafeAreaView,
  RefreshControl,
  Alert,
  Linking
} from 'react-native';
import { 
  Divider,
  Text, 
  Searchbar,
  Chip,
  Button,
  useTheme,
  Card
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import LoadingIndicator from '../components/LoadingIndicator';
import { useLocalization } from '../contexts/LocalizationContext';
import { format } from 'date-fns';
import { fetchVideoSessions } from '../services/videoService';
import { useAuth } from '../contexts/AuthContext';

const VideoCallsScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLocalization();
  const { user } = useAuth(); // Using the correct user object from auth context
  const [videoCalls, setVideoCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [error, setError] = useState(null);

  // Load video calls from API using videoService
  const loadVideoCalls = async () => {
    try {
      setError(null);
      const response = await fetchVideoSessions();
      console.log('Video calls response:', response.data);
      setVideoCalls(response.data);
    } catch (error) {
      console.error('Error loading video sessions:', error);
      setError('Failed to load video sessions');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load video calls on component mount
  useEffect(() => {
    loadVideoCalls();
  }, []);

  // Filter video calls based on search and filter
  useEffect(() => {
    let filtered = [...videoCalls];
    
    // Apply status filter
    const now = new Date();
    if (activeFilter === 'upcoming') {
      filtered = filtered.filter(call => {
        const callTime = new Date(call.scheduled_time);
        return callTime > now;
      });
    } else if (activeFilter === 'past') {
      filtered = filtered.filter(call => {
        const callTime = new Date(call.scheduled_time);
        return callTime <= now;
      });
    }
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(call => 
        call.request_details?.document_details?.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by scheduled time
    filtered.sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
    
    setFilteredCalls(filtered);
  }, [videoCalls, searchQuery, activeFilter]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVideoCalls();
  };

  // Handle joining a call
  const handleJoinCall = (roomUrl) => {
    Linking.openURL(roomUrl).catch(err => {
      console.error('Error opening room URL:', err);
      Alert.alert(t('error'), t('cannotOpenUrl'));
    });
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
          {t('upcoming')}
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
          {t('past')}
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
          {t('all')}
        </Chip>
      </View>
    );
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      // Format: DD.MM.YYYY | HH:MM
      return format(date, 'dd.MM.yyyy | HH:mm');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Render a single video call/meeting
  const renderVideoCallItem = ({ item }) => {
    const documentTitle = item.request_details?.document_details?.title || t('noDocumentTitle');
    const scheduledTime = formatDateTime(item.scheduled_time);
    const isPast = new Date(item.scheduled_time) < new Date();
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.documentTitle}>{documentTitle}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#555" />
            <Text style={styles.infoText}>{scheduledTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#555" />
            <Text style={styles.infoText}>
              {item.request_details?.user_details?.full_name || t('unknown')}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Chip 
              mode="outlined" 
              style={[styles.statusChip, {
                backgroundColor: isPast ? theme.colors.surface : theme.colors.primary + '10'
              }]}
            >
              {isPast ? t('past') : t('upcoming')}
            </Chip>
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="contained" 
            onPress={() => handleJoinCall(item.room_url)}
            disabled={false} // Set this to isPast if you want to disable past calls
          >
            {t('joinCall')}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  // Render empty state
  const renderEmptyList = () => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff8a65" />
          <Text style={styles.emptyText}>{t('error')}</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={loadVideoCalls}
            style={styles.retryButton}
          >
            {t('retry')}
          </Button>
        </View>
      );
    }
    
    if (searchQuery || activeFilter !== 'all') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-off-outline" size={60} color="#bbb" />
          <Text style={styles.emptyText}>{t('noCallsMatch')}</Text>
          <Text style={styles.emptySubtext}>{t('tryChangingCallFilter')}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="videocam-outline" size={60} color="#bbb" />
        <Text style={styles.emptyText}>{t('noCallsScheduled')}</Text>
        <Text style={styles.emptySubtext}>{t('tapToSchedule')}</Text>
      </View>
    );
  };

  // If still loading initially
  if (isLoading && !refreshing) {
    return <LoadingIndicator message={t('loadingVideoCalls')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Searchbar
        placeholder={t('searchVideoCalls')}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {renderFilterChips()}
      
      <Divider style={styles.divider} />
      
      <FlatList
        data={filteredCalls}
        renderItem={renderVideoCallItem}
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
  retryButton: {
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusChip: {
    height: 28,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingTop: 0,
  },
});

export default VideoCallsScreen;