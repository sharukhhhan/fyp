import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  SafeAreaView,
  RefreshControl
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
import { useDocuments } from '../contexts/DocumentContext';
import DocumentCard from '../components/DocumentCard';
import LoadingIndicator from '../components/LoadingIndicator';

const DocumentsScreen = ({ navigation }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
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
    let filtered = [...documents];
    
    // Apply status filter if not 'all'
    if (activeFilter !== 'all') {
      filtered = filterDocumentsByStatus(activeFilter);
    }
    
    // Apply search query if exists
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())
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
  const handleDocumentPress = (id) => {
    navigation.navigate('DocumentDetail', { documentId: id });
  };

  // Handle creating new document - UPDATED to navigate to options screen
  const handleNewDocument = () => {
    navigation.navigate('NewDocumentOption');
  };

  // Render filter chips
  const renderFilterChips = () => {
    const filters = [
      { id: 'all', label: 'All' },
      { id: 'draft', label: 'Drafts' },
      { id: 'pending', label: 'Pending' },
      { id: 'signed', label: 'Signed' },
      { id: 'rejected', label: 'Rejected' }
    ];
    
    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter:</Text>
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
          <Text style={styles.emptyText}>No documents match your filters</Text>
          <Text style={styles.emptySubtext}>Try changing your search or filter</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No documents yet</Text>
        <Text style={styles.emptySubtext}>Tap the + button to create your first document</Text>
      </View>
    );
  };

  // If still loading initially
  if (isLoading && !refreshing && documents.length === 0) {
    return <LoadingIndicator message="Loading documents..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Searchbar
        placeholder="Search documents"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {renderFilterChips()}
      
      {error ? (
        <Text style={styles.errorText}>
          Error loading documents. Pull down to retry.
        </Text>
      ) : null}
      
      <FlatList
        data={filteredDocuments}
        renderItem={({ item }) => (
          <DocumentCard document={item} onPress={handleDocumentPress} />
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />
      
      <Portal>
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={handleNewDocument}
          color="#fff"
        />
      </Portal>
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
    elevation: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
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
    right: 0,
    bottom: 0,
  },
});

export default DocumentsScreen;