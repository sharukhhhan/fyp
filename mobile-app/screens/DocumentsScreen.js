import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  SafeAreaView,
  RefreshControl,
  Alert,
  Linking,
  Share,
  Platform,
  TouchableOpacity
} from 'react-native';
import { 
  FAB, 
  Searchbar, 
  Chip, 
  Text, 
  ActivityIndicator,
  Portal, 
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useDocuments } from '../contexts/DocumentContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { downloadDocument } from '../services/documentService';
import DocumentCard from '../components/DocumentCard';
import LoadingIndicator from '../components/LoadingIndicator';

const DocumentsScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLocalization();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const { 
    documents, 
    isLoading, 
    error, 
    loadDocuments,
    filterDocumentsByStatus
  } = useDocuments();

  // Filter documents based on search query and status filter
  useEffect(() => {
    // Make sure documents is an array and not undefined
    if (!documents || !Array.isArray(documents)) {
      console.log('Documents is not an array:', documents);
      setFilteredDocuments([]);
      return;
    }
    
    let filtered = [...documents];
    console.log('Filtering documents:', filtered.length);
    
    // Apply status filter if not 'all'
    if (activeFilter !== 'all') {
      filtered = filtered.filter(doc => {
        switch(activeFilter) {
          case 'verified':
            return doc.is_verified === true;
          case 'pending':
            return doc.is_verified === false;
          default:
            return true;
        }
      });
    }
    
    // Apply search query if exists
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredDocuments(filtered);
  }, [documents, searchQuery, activeFilter]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  // Handle document selection
  const handleDocumentPress = async (id) => {
    try {
      // Create an alert with a button to cancel
      const downloadPrompt = Alert.alert(
        'Document Download',
        'Do you want to download this document?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Download', 
            onPress: async () => {
              try {
                // Show loading indicator
                setIsDownloading(true);
                
                console.log('Starting document download for ID:', id);
                
                // Download the file
                const fileUri = await downloadDocument(id);
                
                console.log('Document downloaded to:', fileUri);
                setIsDownloading(false);
                
                // Try to open the file
                try {
                  // For iOS we need the file:// protocol
                  const fileUrl = Platform.OS === 'ios' ? `file://${fileUri}` : fileUri;
                  console.log('Opening file at:', fileUrl);
                  
                  await Linking.openURL(fileUrl);
                } catch (openError) {
                  console.log('Could not open file directly, trying to share...', openError);
                  // If can't open directly, use share dialog
                  const UTI = 'public.item';
                  await Share.share({
                    url: fileUri,
                    UTI: UTI,
                  });
                }
              } catch (downloadError) {
                console.error('Error in download process:', downloadError);
                setIsDownloading(false);
                Alert.alert(
                  'Download Error',
                  'Failed to download the document. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error downloading document:', error);
      Alert.alert(
        'Download Error',
        'Failed to download the document. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle creating new document - UPDATED to navigate to options screen
  const handleNewDocument = () => {
    navigation.navigate('NewDocumentOption');
  };
  
  // Navigate to downloaded files
  const handleViewDownloadedDocuments = () => {
    navigation.navigate('DocumentFiles');
  };

  // Render filter chips
  const renderFilterChips = () => {
    const filters = [
      { id: 'all', label: t('all') },
      { id: 'verified', label: t('verified') },
      { id: 'pending', label: t('pending') }
    ];
    
    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>{t('filter')}</Text>
        <FlatList
          horizontal
          data={filters}
          renderItem={({ item }) => (
            <Chip
              mode="outlined"
              selected={activeFilter === item.id}
              style={[
                styles.filterChip,
                activeFilter === item.id ? { backgroundColor: theme.colors.primary + '20' } : null
              ]}
              textStyle={activeFilter === item.id ? { color: theme.colors.primary } : null}
              onPress={() => setActiveFilter(item.id)}
            >
              {item.label}
            </Chip>
          )}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  // Render empty state
  const renderEmptyList = () => {
    if (searchQuery || activeFilter !== 'all') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('noDocumentsMatch')}</Text>
          <Text style={styles.emptySubtext}>{t('tryChangingFilter')}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('noDocuments')}</Text>
        <Text style={styles.emptySubtext}>{t('createNewDocument')}</Text>
      </View>
    );
  };

  // If still loading initially
  if (isLoading && !refreshing && documents.length === 0) {
    return <LoadingIndicator message={t('loadingDocuments')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Searchbar
          placeholder={t('searchDocuments')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <TouchableOpacity
          style={styles.filesButton}
          onPress={handleViewDownloadedDocuments}
        >
          <Ionicons name="folder-open" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      {renderFilterChips()}
      
      {error ? (
        <Text style={styles.errorText}>
          Error loading documents. Pull down to retry.
        </Text>
      ) : null}
      
      {isDownloading && (
        <View style={styles.downloadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.downloadingText}>Downloading document...</Text>
        </View>
      )}
      
      <FlatList
        data={filteredDocuments}
        renderItem={({ item }) => (
          <DocumentCard 
            document={item} 
            onPress={handleDocumentPress} 
          />
        )}
        keyExtractor={item => item?.id?.toString() || Math.random().toString()}
        contentContainerStyle={[
          styles.listContent,
          filteredDocuments.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />
      
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={handleNewDocument}
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingLeft: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    elevation: 2,
  },
  filesButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 16,
    color: '#555',
  },
  filterChip: {
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 10,
    bottom: 10,
  },
  downloadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  downloadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DocumentsScreen;