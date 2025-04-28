import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Filter, Plus } from 'lucide-react-native';
import AppHeader from '@/components/AppHeader';
import DocumentCard from '@/components/DocumentCard';
import FilterButton from '@/components/FilterButton';
import FAB from '@/components/FAB';
import Colors from '@/constants/Colors';
import { getDocuments } from '@/services/documentService';
import { Document } from '@/types';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [activeFilter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const filter = activeFilter !== 'all' ? { status: activeFilter } : {};
      const docs = await getDocuments(filter);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFilter = () => {
    setFilterVisible(!filterVisible);
  };

  const selectFilter = (filter: string) => {
    setActiveFilter(filter);
    setFilterVisible(false);
  };

  const renderFilterOptions = () => {
    const options = [
      { id: 'all', label: 'All Documents' },
      { id: 'pending', label: 'Pending' },
      { id: 'completed', label: 'Completed' },
      { id: 'rejected', label: 'Rejected' },
      { id: 'draft', label: 'Drafts' },
    ];

    return (
      <View style={styles.filterOptions}>
        {options.map(option => (
          <FilterButton
            key={option.id}
            label={option.label}
            active={activeFilter === option.id}
            onPress={() => selectFilter(option.id)}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      <AppHeader title="Documents" 
        rightComponent={
          <TouchableOpacity onPress={toggleFilter} style={styles.filterButton}>
            <Filter size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        } 
      />
      
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.dark.textDim} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.dark.textDim}
        />
      </View>
      
      {filterVisible && renderFilterOptions()}
      
      <FlatList
        data={filteredDocuments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <DocumentCard
            title={item.title}
            description={item.description}
            status={item.status}
            date={item.updatedAt}
            onPress={() => router.push(`/document/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No documents found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try a different search term' : 'Start by creating a new document'}
            </Text>
          </View>
        }
      />
      
      <FAB 
        icon={<Plus size={24} color="#fff" />}
        onPress={() => router.push('/document/new')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.text,
  },
  filterButton: {
    padding: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
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
});