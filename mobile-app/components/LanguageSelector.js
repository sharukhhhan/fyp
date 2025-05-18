import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, RadioButton, Portal, Card } from 'react-native-paper';
import { useLocalization } from '../contexts/LocalizationContext';

const LanguageSelector = ({ compact = false }) => {
  const { t, locale, changeLanguage, locales } = useLocalization();
  const [visible, setVisible] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    hideModal();
  };
  
  return (
    <>
      <Button 
        mode={compact ? "text" : "outlined"}
        icon="translate"
        onPress={showModal}
        style={compact ? styles.compactButton : styles.button}
        labelStyle={compact ? styles.compactButtonLabel : {}}
      >
        {compact ? t('language') : t('selectLanguage')}
      </Button>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          transparent
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <Card style={styles.modalContent}>
              <Card.Title title={t('selectLanguage')} />
              <Card.Content>
                <RadioButton.Group onValueChange={handleLanguageChange} value={locale}>
                  <RadioButton.Item label={t('english')} value="en" />
                  <RadioButton.Item label={t('russian')} value="ru" />
                  <RadioButton.Item label={t('kyrgyz')} value="kg" />
                </RadioButton.Group>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button onPress={hideModal}>{t('cancel')}</Button>
              </Card.Actions>
            </Card>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
  },
  compactButton: {
    marginVertical: 0,
  },
  compactButtonLabel: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
});

export default LanguageSelector;
