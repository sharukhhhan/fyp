import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Image,
  Modal as RNModal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  TextInput, 
  Button, 
  Text, 
  Headline, 
  Subheading,
  HelperText,
  Checkbox,
  RadioButton,
  Portal,
  Modal,
  useTheme
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import LanguageSelector from '../components/LanguageSelector';
import { uploadIdentityDocument } from '../services/documentService';

const RegisterScreen = ({ navigation }) => {
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  
  // Common document fields
  const [surname, setSurname] = useState('');
  const [name, setName] = useState('');
  const [patronym, setPatronym] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  
  // ID Card specific fields
  const [sex, setSex] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [authority, setAuthority] = useState('');
  const [personalNumber, setPersonalNumber] = useState('');
  
  const { register } = useAuth();
  const theme = useTheme();
  const [documentUploadSuccess, setDocumentUploadSuccess] = useState(false);
  const [documentUploadFailed, setDocumentUploadFailed] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  


  // Validate email format
  const isEmailValid = () => {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };
  
  // Validate password strength
  const isPasswordStrong = () => {
    // Password should be at least 8 characters with at least one number and one letter
    return password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      
      console.log('Document picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        console.log('Selected file:', selectedFile);
        setDocumentFile({
          uri: selectedFile.uri,
          type: selectedFile.mimeType,
          name: selectedFile.name,
          size: selectedFile.size
        });
      }
    } catch (err) {
      console.error('Document picker error:', err);
      setError(t('filePickError'));
    }
  };

  const handleDateSelect = (event, date) => {
  if (date) {
    const formattedDate = date.toISOString().split('T')[0];
    
    switch (currentDateField) {
      case 'dateOfBirth':
        setDateOfBirth(formattedDate);
        break;
      case 'issueDate':
        setIssueDate(formattedDate);
        break;
      case 'expiryDate':
        setExpiryDate(formattedDate);
        break;
    }
  }
  
  if (Platform.OS === 'android') {
    setShowDatePicker(false);
  }
};

  const showDatePickerModal = (fieldName) => {
  // First set the current field
  setCurrentDateField(fieldName);
  
  // Determine the initial date based on field values
  let date;
  switch (fieldName) {
    case 'dateOfBirth':
      date = dateOfBirth ? new Date(dateOfBirth) : new Date();
      break;
    case 'issueDate': 
      date = issueDate ? new Date(issueDate) : new Date();
      break;
    case 'expiryDate':
      date = expiryDate ? new Date(expiryDate) : new Date();
      break;
    default:
      date = new Date();
  }
  
  // Make sure it's a valid date
  if (isNaN(date.getTime())) {
    date = new Date();
  }
  
  // Set the date and show picker
  setSelectedDate(date);
  setShowDatePicker(true);
};

  // Validate form
  const validateForm = () => {
    if (!email.trim()) {
      setError(t('fieldRequired'));
      return false;
    }
    
    if (!isEmailValid()) {
      setError(t('invalidEmail'));
      return false;
    }
    
    if (!password) {
      setError(t('fieldRequired'));
      return false;
    }
    
    if (!isPasswordStrong()) {
      setError(t('weakPassword'));
      return false;
    }
    
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return false;
    }

    // Document validation
    if (!documentType) {
      setError('Please select a document type');
      return false;
    }

    if (!documentFile) {
      setError('Please upload a document file');
      return false;
    }

    if (!surname || !name || !dateOfBirth || !documentNumber) {
      setError('Please fill in all required document fields');
      return false;
    }

    if (!agreeToTerms) {
      setError('Please agree to terms and conditions');
      return false;
    }

    return true;
  };

  // Handle registration
  const handleRegister = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setIsLoading(true);
      setError('');
      
      console.log('Starting registration process...');
      
      const userData = {
        email,
        password,
        firstName: name,
        lastName: surname
      };
      
      console.log('Calling register with:', { email: userData.email });
      const success = await register(userData);
      console.log('Registration result:', success);
      
      if (success) {
        console.log('Registration successful, preparing document upload...');
        
        try {
          const identityDocData = {
            file: documentFile,
            document_number: documentNumber,
            full_name: `${surname} ${name} ${patronym}`.trim(),
            date_of_birth: dateOfBirth,
            issue_date: issueDate,
            expiry_date: expiryDate,
            type: documentType === 'idCard' ? 'passport' : 'driver_license'
          };
          
          console.log('Uploading identity document:', identityDocData);
          const uploadResult = await uploadIdentityDocument(identityDocData);
          console.log('Document upload result:', uploadResult);
          
          setDocumentUploadSuccess(true);
          setSuccessMessage(t('registrationCompleted'));
          
          setTimeout(() => {
            navigation.navigate('Login');
          }, 2000);
          
        } catch (uploadError) {
          console.error('Document upload error:', uploadError);
          setDocumentUploadSuccess(false);
          setDocumentUploadFailed(true);
          setSuccessMessage(t('registrationCompletedNoDoc'));
          setError(uploadError.message || t('documentUploadError'));
          
          setTimeout(() => {
            navigation.navigate('Login');
          }, 2000);
        }
      } else {
        console.error('Registration failed');
        setError(t('registrationFailed'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || t('registrationFailed')); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.languageSelectorContainer}>
          <LanguageSelector compact={true} />
        </View>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Headline style={styles.title}>{t('createAccount')}</Headline>
          <Subheading style={styles.subtitle}>
            {t('joinPlatform')}
          </Subheading>
        </View>
        
        <View style={styles.formContainer}>
          
          <TextInput
            label={t('email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
            error={error && (error.includes('email') || error.includes('Email'))}
            disabled={isLoading}
          />
          
          <TextInput
            label={t('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon 
                icon={secureTextEntry ? "eye" : "eye-off"} 
                onPress={() => setSecureTextEntry(!secureTextEntry)} 
              />
            }
            error={error && error.includes('Password must be')}
            disabled={isLoading}
          />
          
          <TextInput
            label={t('confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            style={styles.input}
            error={error && error.includes('Passwords do not match')}
            disabled={isLoading}
          />

          {/* Document Selection */}
          <View style={styles.documentSection}>
            <Text style={styles.sectionTitle}>{t('identityVerification')}</Text>
            
            <RadioButton.Group onValueChange={value => setDocumentType(value)} value={documentType}>
              <View style={styles.radioOptionsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.radioOptionCard,
                    documentType === 'idCard' && styles.radioOptionSelected
                  ]}
                  onPress={() => setDocumentType('idCard')}
                >
                  <View style={styles.radioOptionContent}>
                    <RadioButton
                      value="idCard"
                      color={theme.colors.primary}
                    />
                    <Text style={styles.radioOptionText}>{t('idCard')}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.radioOptionCard,
                    documentType === 'driverLicense' && styles.radioOptionSelected
                  ]}
                  onPress={() => setDocumentType('driverLicense')}
                >
                  <View style={styles.radioOptionContent}>
                    <RadioButton
                      value="driverLicense"
                      color={theme.colors.primary}
                    />
                    <Text style={styles.radioOptionText}>{t('driverLicense')}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </RadioButton.Group>

            {documentType && (
              <>
                <View style={styles.documentFieldsContainer}>
                  <TextInput
                    label={t('surname')}
                    value={surname}
                    onChangeText={setSurname}
                    mode="outlined"
                    style={styles.input}
                    disabled={isLoading}
                  />
                  <TextInput
                    label={t('name')}
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    disabled={isLoading}
                  />
                  <TextInput
                    label={t('patronym')}
                    value={patronym}
                    onChangeText={setPatronym}
                    mode="outlined"
                    style={styles.input}
                    disabled={isLoading}
                  />
                  <TouchableOpacity onPress={() => showDatePickerModal('dateOfBirth')}>
                    <TextInput
                      label={t('dateOfBirth')}
                      value={dateOfBirth}
                      mode="outlined"
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      disabled={isLoading}
                      editable={false}
                      right={<TextInput.Icon icon="calendar" onPress={() => showDatePickerModal('dateOfBirth')} />}
                    />
                  </TouchableOpacity>
                  <TextInput
                    label={t('documentNumber')}
                    value={documentNumber}
                    onChangeText={setDocumentNumber}
                    mode="outlined"
                    style={styles.input}
                    disabled={isLoading}
                  />

                  {documentType === 'idCard' && (
                    <>
                      <View style={styles.radioRow}>
                        <Text style={styles.radioLabel}>{t('sex')}:</Text>
                        <RadioButton.Group onValueChange={value => setSex(value)} value={sex}>
                          <View style={styles.sexOptionsContainer}>
                            <View style={styles.sexOption}>
                              <RadioButton value="male" />
                              <Text>{t('male')}</Text>
                            </View>
                            <View style={styles.sexOption}>
                              <RadioButton value="female" />
                              <Text>{t('female')}</Text>
                            </View>
                          </View>
                        </RadioButton.Group>
                      </View>
                      
                      <TextInput
                        label={t('placeOfBirth')}
                        value={placeOfBirth}
                        onChangeText={setPlaceOfBirth}
                        mode="outlined"
                        style={styles.input}
                        disabled={isLoading}
                      />
                      <TextInput
                        label={t('authority')}
                        value={authority}
                        onChangeText={setAuthority}
                        mode="outlined"
                        style={styles.input}
                        disabled={isLoading}
                      />
                      <TouchableOpacity onPress={() => showDatePickerModal('issueDate')}>
                        <TextInput
                          label={t('dateOfIssue')}
                          value={issueDate}
                          mode="outlined"
                          style={styles.input}
                          placeholder="YYYY-MM-DD"
                          disabled={isLoading}
                          editable={false}
                          right={<TextInput.Icon icon="calendar" onPress={() => showDatePickerModal('issueDate')} />}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => showDatePickerModal('expiryDate')}>
                        <TextInput
                          label={t('dateOfExpiry')}
                          value={expiryDate}
                          mode="outlined"
                          style={styles.input}
                          placeholder="YYYY-MM-DD"
                          disabled={isLoading}
                          editable={false}
                          right={<TextInput.Icon icon="calendar" onPress={() => showDatePickerModal('expiryDate')} />}
                        />
                      </TouchableOpacity>
                      <TextInput
                        label={t('personalNumber')}
                        value={personalNumber}
                        onChangeText={setPersonalNumber}
                        mode="outlined"
                        style={styles.input}
                        disabled={isLoading}
                      />
                    </>
                  )}

                  {documentType === 'driverLicense' && (
                    <>
                      <TouchableOpacity onPress={() => showDatePickerModal('issueDate')}>
                        <TextInput
                          label={t('dateOfIssue')}
                          value={issueDate}
                          mode="outlined"
                          style={styles.input}
                          placeholder="YYYY-MM-DD"
                          disabled={isLoading}
                          editable={false}
                          right={<TextInput.Icon icon="calendar" onPress={() => showDatePickerModal('issueDate')} />}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => showDatePickerModal('expiryDate')}>
                        <TextInput
                          label={t('dateOfExpiry')}
                          value={expiryDate}
                          mode="outlined"
                          style={styles.input}
                          placeholder="YYYY-MM-DD"
                          disabled={isLoading}
                          editable={false}
                          right={<TextInput.Icon icon="calendar" onPress={() => showDatePickerModal('expiryDate')} />}
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <Button
                  mode="outlined"
                  onPress={pickDocument}
                  style={styles.uploadButton}
                  disabled={isLoading}
                >
                  {documentFile ? t('documentSelected') : t('uploadPdfDocument')}
                </Button>

                {documentFile && (
                  <Text style={styles.fileName}>
                    {t('selected')}: {documentFile.name}
                  </Text>
                )}
              </>
            )}
          </View>
          
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={agreeToTerms ? 'checked' : 'unchecked'}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              disabled={isLoading}
            />
            <Text style={styles.termsText}>
              {t('iAgreeTo')}{' '}
              <Text style={styles.linkText}>{t('termsAndConditions')}</Text> {t('and')}{' '}
              <Text style={styles.linkText}>{t('privacyPolicy')}</Text>
            </Text>
          </View>
          
          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}
          
          {successMessage ? (
            <HelperText type="info" visible={!!successMessage} style={styles.successMessage}>
              {successMessage}
            </HelperText>
          ) : null}
          
          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.registerButton}
            loading={isLoading}
            disabled={isLoading || !!successMessage}
          >
            {t('createAccount')}
          </Button>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('hasAccount')}
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Text style={styles.loginLink}>
              {t('signInNow')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Time Picker Modal */}
        {showDatePicker && Platform.OS === 'ios' && (
  <RNModal
    transparent={true}
    animationType="slide"
    visible={showDatePicker}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.pickerHeaderContainer}>
          <TouchableOpacity 
            onPress={() => setShowDatePicker(false)}
            style={styles.pickerHeaderButton}
          >
            <Text style={styles.cancelButton}>{t('cancel')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              handleDateSelect(null, selectedDate);
              setShowDatePicker(false);
            }}
            style={styles.pickerHeaderButton}
          >
            <Text style={styles.doneButton}>{t('done')}</Text>
          </TouchableOpacity>
        </View>
        
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            if (date) setSelectedDate(date);
          }}
          style={styles.datePicker}
          textColor="#000000"
        />
      </View>
    </View>
  </RNModal>
)}

        {showDatePicker && Platform.OS === 'android' && (
  <DateTimePicker
    testID="dateTimePicker"
    value={selectedDate}
    mode="date"
    display="default"
    onChange={(event, date) => {
      setShowDatePicker(false);
      if (date) {
        handleDateSelect(event, date);
      }
    }}
  />
)}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  languageSelectorContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  logoContainer: {
    marginTop: 60,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
  },
  linkText: {
    color: '#3498db',
  },
  registerButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  footerText: {
    marginRight: 6,
  },
  loginLink: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  radioButtonContainer: {
    marginBottom: 16,
  },
  radioButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  documentSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  radioOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  radioOptionCard: {
    flexBasis: '48%',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  radioOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOptionSelected: {
    borderColor: '#3498db',
    backgroundColor: '#f0f9ff',
  },
  radioOptionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    flexWrap: 'wrap',
  },
  documentFieldsContainer: {
    marginTop: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioLabel: {
    marginRight: 16,
    fontSize: 16,
  },
  sexOptionsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  sexOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
  },
  successMessage: {
    color: '#27ae60',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  pickerHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerHeaderButton: {
    padding: 8,
  },
  cancelButton: {
    color: '#999',
    fontSize: 17,
  },
  doneButton: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  datePicker: {
    height: 200,
    width: '100%',
  },
});

export default function RegisterScreenWrapper(props) {
  const theme = useTheme();
  return <RegisterScreen {...props} theme={theme} />;
}