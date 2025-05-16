import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Chip, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const DocumentCard = ({ document, onPress }) => {
  const theme = useTheme();
  
  // Function to determine status color
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

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity onPress={() => onPress(document.id)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title numberOfLines={1} style={styles.title}>{document.title}</Title>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(document.status) }
              ]}
            >
              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            </Chip>
          </View>
          
          <Paragraph numberOfLines={2} style={styles.description}>
            {document.description}
          </Paragraph>
          
          <View style={styles.footer}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Paragraph style={styles.metaText}>
                {formatDate(document.createdAt)}
              </Paragraph>
            </View>
            
            {document.signatureCount > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                <Paragraph style={styles.metaText}>
                  {document.signatureCount} {document.signatureCount === 1 ? 'signature' : 'signatures'}
                </Paragraph>
              </View>
            )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
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