import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Share, 
  Linking,
  Alert
} from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Chip, 
  Divider, 
  Menu, 
  IconButton,
  Portal,
  Dialog,
  useTheme
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useDocuments } from '../contexts/DocumentContext';
import LoadingIndicator from '../components/LoadingIndicator';
import SignaturePad from '../components/SignaturePad';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

const DocumentDetailScreen = ({ route, navigation }) => {
  const { documentId } = route.params;
  const theme = useTheme();
  
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [signDialogVisible, setSignDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  const { getDocument, editDocument, loadDocuments } = useDocuments();

  // Load document data
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const documentData = await getDocument(documentId);
        setDocument(documentData);
      } catch (err) {
        setError('Error loading document. Please try again.');
        console.error('Error loading document:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocument();
  }, [documentId, getDocument]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f1c40f'; // Yellow
      case 'signed':
        return '#2ecc71'; // Green
      case 'rejected':
        return '#e74c3c'; // Red
      case 'draft':
        return '#95a5a6'; // Gray
      default:
        return '#bdc3c7'; // Light gray
    }
  };

  // Handle document download
  const handleDownload = async () => {
    try {
      // Get download URL (this would be replaced with actual API call)
      const downloadUrl = document.fileUrl;
      
      // Download file
      const { uri } = await FileSystem.downloadAsync(
        downloadUrl,
        FileSystem.documentDirectory + document.filename
      );
      
      // Open file
      await Linking.openURL(uri);
      
      Alert.alert('Success', 'Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      Alert.alert('Error', 'Failed to download document');
    }
  };

  // Handle document sharing
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this document: ${document.title}`,
        url: document.shareUrl || document.fileUrl,
      });
    } catch (error) {
      console.error('Error sharing document:', error);
    }
  };

  // Handle document signing
  const handleSignatureComplete = async (signatureData) => {
    try {
      setIsLoading(true);
      
      // Update document status
      const updatedDocument = await editDocument(documentId, {
        status: 'signed',
        signatureData
      });
      
      setDocument(updatedDocument);
      setSignDialogVisible(false);
      await loadDocuments(); // Refresh the documents list
      
      Alert.alert('Success', 'Document signed successfully');
    } catch (error) {
      console.error('Error signing document:', error);
      Alert.alert('Error', 'Failed to sign document');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document deletion
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      // Delete document (this would be replaced with actual API call)
      // await deleteDocument(documentId);
      
      setDeleteDialogVisible(false);
      await loadDocuments(); // Refresh the documents list
      
      // Navigate back
      navigation.goBack();
      
      Alert.alert('Success', 'Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      Alert.alert('Error', 'Failed to delete document');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scheduling a video call
  const handleScheduleCall = () => {
    // Navigate to video call scheduling screen with document ID
    navigation.navigate('ScheduleCall', { documentId });
  };

  // Handle editing document
  const handleEdit = () => {
    navigation.navigate('NewDocument', { 
      documentId, 
      isEditing: true,
      initialValues: document
    });
  };

  if (isLoading && !document) {
    return <LoadingIndicator message="Loading document..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  if (!document) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Document not found</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>{document.title}</Text>
            
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={24}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(false);
                  handleEdit();
                }} 
                title="Edit" 
                leadingIcon="pencil"
              />
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(false);
                  handleShare();
                }} 
                title="Share" 
                leadingIcon="share-variant"
              />
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(false);
                  handleDownload();
                }} 
                title="Download" 
                leadingIcon="download"
              />
              <Divider />
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(false);
                  setDeleteDialogVisible(true);
                }} 
                title="Delete" 
                leadingIcon="delete"
                titleStyle={{ color: '#e74c3c' }}
              />
            </Menu>
          </View>
          
          <Chip 
            mode="flat"
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(document.status) }
            ]}
          >
            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
          </Chip>
          
          <Text style={styles.description}>{document.description}</Text>
          
          <Divider style={styles.divider} />
          
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.metaText}>Created: {formatDate(document.createdAt)}</Text>
            </View>
            
            {document.updatedAt && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.metaText}>Updated: {formatDate(document.updatedAt)}</Text>
              </View>
            )}
            
            <View style={styles.metaItem}>
              <Ionicons name="document-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.metaText}>Filename: {document.filename}</Text>
            </View>
          </View>
          
          {document.signatures && document.signatures.length > 0 && (
            <>
              <Divider style={styles.divider} />
              
              <View style={styles.sectionTitle}>
                <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitleText}>Signatures</Text>
              </View>
              
              {document.signatures.map((signature, index) => (
                <View key={index} style={styles.signatureItem}>
                  <Text style={styles.signatureName}>{signature.name}</Text>
                  <Text style={styles.signatureDate}>
                    Signed on {formatDate(signature.date)}
                  </Text>
                </View>
              ))}
            </>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.actionsContainer}>
            {document.status !== 'signed' && (
              <Button 
                mode="contained" 
                onPress={() => setSignDialogVisible(true)}
                style={styles.actionButton}
                icon="fountain-pen"
              >
                Sign Document
              </Button>
            )}
            
            <Button 
              mode="contained" 
              onPress={handleScheduleCall}
              style={[styles.actionButton, styles.secondaryButton]}
              icon="video"
            >
              Schedule Notary Call
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={handleDownload}
              style={styles.actionButton}
              icon="download"
            >
              Download
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={handleShare}
              style={styles.actionButton}
              icon="share-variant"
            >
              Share
            </Button>
          </View>
        </Card.Content>
      </Card>
      
      {/* Signature Dialog */}
      <Portal>
        <Dialog
          visible={signDialogVisible}
          onDismiss={() => setSignDialogVisible(false)}
          style={styles.signatureDialog}
        >
          <Dialog.Content>
            <SignaturePad
              onSave={handleSignatureComplete}
              onCancel={() => setSignDialogVisible(false)}
            />
          </Dialog.Content>
        </Dialog>
      </Portal>
      
      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Document</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this document? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleDelete}
              textColor="#e74c3c"
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  divider: {
    marginVertical: 16,
  },
  metaSection: {
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  signatureItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  signatureDate: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#e74c3c',
    textAlign: 'center',
  },
  errorButton: {
    width: 200,
  },
  signatureDialog: {
    maxHeight: '80%',
  },
});

export default DocumentDetailScreen;