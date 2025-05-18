import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Chip, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const DocumentCard = ({ document, onPress }) => {
  const theme = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Safe document accessor with fallback values
  const safeDocument = {
    id: document?.id || 0,
    title: document?.title || 'Untitled Document',
    description: document?.description || 'No description available',
    upload_date: document?.upload_date || document?.created_at || null,
    is_verified: document?.is_verified,
    file_size: document?.file_size || 0,
    file_type: document?.file_type || 'Unknown',
  };

  // Function to determine status color based on verification status
  const getStatusColor = (isVerified) => {
    if (isVerified === true) return '#2ecc71'; // Green for verified
    if (isVerified === false) return '#f1c40f'; // Yellow for pending verification
    return '#bdc3c7'; // Light gray for unknown status
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date error';
    }
  };

  // Get document status text
  const getStatusText = (isVerified) => {
    if (isVerified === true) return 'Verified';
    if (isVerified === false) return 'Pending';
    return 'Processing';
  };

  // Guard against null document
  if (!document) {
    return null;
  }
  
  return (
    <TouchableOpacity onPress={() => onPress(safeDocument.id)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title numberOfLines={1} style={styles.title}>
              {safeDocument.title}
            </Title>
            <View style={{ maxWidth: 120 }}>
  <Chip
    mode="flat"
    style={[
      styles.statusChip,
      { backgroundColor: getStatusColor(safeDocument.is_verified) }
    ]}
    textStyle={{
      fontSize: 13,
      fontWeight: 'bold',
      color: '#000',
    }}
    ellipsizeMode="clip"
  >
    {getStatusText(safeDocument.is_verified)}
  </Chip>
</View>

          </View>
          
          <Paragraph numberOfLines={2} style={styles.description}>
            {safeDocument.description}
          </Paragraph>
          
          <View style={styles.footer}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Paragraph style={styles.metaText}>
                {formatDate(safeDocument.upload_date)}
              </Paragraph>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="document-outline" size={16} color={theme.colors.primary} />
              <Paragraph style={styles.metaText}>
                {safeDocument.file_type || 'Document'}
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
header: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
  title: {
    flex: 1,
    marginRight: 8,
  },
statusChip: {
  paddingHorizontal: 10,
  height: 35, // немного больше, чтобы не обрезало
  alignSelf: 'center',
  justifyContent: 'center',
},
  description: {
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#666',
  },
});

export default DocumentCard;