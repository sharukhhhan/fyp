import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View,  
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
  Platform
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  useTheme,
  ActivityIndicator
} from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../contexts/LocalizationContext';

// File extensions icons mapping
const fileIcons = {
  'pdf': 'document-text-outline',
  'doc': 'document-outline',
  'docx': 'document-outline',
  'jpg': 'image-outline',
  'jpeg': 'image-outline',
  'png': 'image-outline',
  'txt': 'document-text-outline',
  'default': 'document-outline'
};

const DocumentFilesScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLocalization();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load documents from file system
  const loadFiles = async () => {
    try {
      setIsLoading(true);
      
      // Get documents directory
      const docsDir = `${FileSystem.documentDirectory}documents/`;
      
      // Check if directory exists
      const dirInfo = await FileSystem.getInfoAsync(docsDir);
      
      if (!dirInfo.exists) {
        // Create directory if it doesn't exist
        await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
        setFiles([]);
        setIsLoading(false);
        return;
      }
      
      // Read directory contents
      const dirContents = await FileSystem.readDirectoryAsync(docsDir);
      
      // Get file information for each file
      const fileInfoPromises = dirContents.map(async (fileName) => {
        const fileUri = `${docsDir}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        // Extract document ID and extension
        const match = fileName.match(/document_(\d+)\.(\w+)/);
        const id = match ? match[1] : 'unknown';
        const extension = match ? match[2] : 'pdf';
        
        return {
          id,
          name: fileName,
          uri: fileUri,
          size: fileInfo.size,
          extension,
          createdAt: fileInfo.modificationTime || Date.now(),
        };
      });
      
      const fileInfos = await Promise.all(fileInfoPromises);
      
      // Sort files by creation date (newest first)
      fileInfos.sort((a, b) => b.createdAt - a.createdAt);
      
      setFiles(fileInfos);
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('Error', 'Failed to load document files');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Open file
  const openFile = async (fileUri, extension) => {
    try {
      // For iOS we need the file:// protocol
      const formattedUri = Platform.OS === 'ios' ? `file://${fileUri}` : fileUri;
      await Linking.openURL(formattedUri);
    } catch (error) {
      console.log('Could not open file directly, trying to share...', error);
      // If can't open directly, use share dialog
      await Share.share({
        url: fileUri,
        title: 'Document',
      });
    }
  };
  
  // Delete file
  const deleteFile = async (fileUri, fileName) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete ${fileName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(fileUri);
              // Refresh file list
              loadFiles();
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert('Error', 'Failed to delete file');
            }
          }
        }
      ]
    );
  };
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };
  
  // Render file item
  const renderFileItem = ({ item }) => {
    const iconName = fileIcons[item.extension] || fileIcons.default;
    
    return (
      <Card style={styles.fileCard}>
        <Card.Content style={styles.fileCardContent}>
          <View style={styles.fileIconContainer}>
            <Ionicons
              name={iconName}
              size={36}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.fileInfo}>
            <Title numberOfLines={1} style={styles.fileName}>
              Document {item.id}
            </Title>
            <Paragraph style={styles.fileDetails}>
              {item.extension.toUpperCase()} • {formatFileSize(item.size)}
            </Paragraph>
          </View>
          <View style={styles.fileActions}>
            <IconButton
              icon="open-in-new"
              size={24}
              onPress={() => openFile(item.uri, item.extension)}
            />
            <IconButton
              icon="trash-can-outline"
              size={24}
              color={theme.colors.error}
              onPress={() => deleteFile(item.uri, item.name)}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render empty state
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-outline"
        size={64}
        color={theme.colors.placeholder}
      />
      <Text style={styles.emptyText}>No downloaded documents</Text>
      <Text style={styles.emptySubtext}>
        Documents you download will appear here
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderFileItem}
          keyExtractor={(item) => item.uri}
          contentContainerStyle={files.length === 0 ? styles.fullHeight : styles.listContent}
          ListEmptyComponent={renderEmptyList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  fullHeight: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  fileCard: {
    marginBottom: 12,
  },
  fileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
  },
  fileDetails: {
    fontSize: 14,
    color: '#666',
  },
  fileActions: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  },
});

export default DocumentFilesScreen;
