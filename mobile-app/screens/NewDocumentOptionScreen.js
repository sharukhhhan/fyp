import React from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import { 
  Text, 
  Card, 
  Button,
  Title,
  Paragraph,
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../contexts/LocalizationContext';

const NewDocumentOptionScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLocalization();

  // Handle option selection
  const handleOptionSelect = (option) => {
    if (option === 'ai') {
      // Navigate to ChatWithAI screen
      navigation.navigate('ChatWithAI', { 
        fromNewDocument: true,
        documentTitle: 'New Document Draft'
      });
    } else {
      // Navigate to regular document form
      navigation.navigate('NewDocument');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>{t('createNewDocument')}</Title>
      <Paragraph style={styles.subtitle}>
        {t('chooseCreationMethod')}
      </Paragraph>

      <Card 
        style={styles.optionCard}
        onPress={() => handleOptionSelect('ai')}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="chatbubble-ellipses" 
              size={48} 
              color={theme.colors.primary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Title style={styles.optionTitle}>{t('chatWithAIOption')}</Title>
            <Paragraph style={styles.optionDescription}>
              {t('chatWithAIDesc')}
            </Paragraph>
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="contained" 
            onPress={() => handleOptionSelect('ai')}
            style={styles.actionButton}
          >
            {t('startAIChat')}
          </Button>
        </Card.Actions>
      </Card>

      <Card 
        style={styles.optionCard}
        onPress={() => handleOptionSelect('manual')}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="document-text" 
              size={48} 
              color={theme.colors.primary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Title style={styles.optionTitle}>{t('uploadManual')}</Title>
            <Paragraph style={styles.optionDescription}>
              {t('uploadManualDesc')}
            </Paragraph>
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="contained" 
            onPress={() => handleOptionSelect('manual')}
            style={styles.actionButton}
          >
            {t('continueToForm')}
          </Button>
        </Card.Actions>
      </Card>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>{t('whichOption')}</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            <Text style={styles.bold}>{t('chatWithAIOption')}</Text> {t('aiGreat')}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            <Text style={styles.bold}>{t('uploadManual')}</Text> {t('uploadIdeal')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionCard: {
    marginBottom: 20,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 70,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginRight: 8,
  },
  infoSection: {
    backgroundColor: '#e8f4fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default NewDocumentOptionScreen;