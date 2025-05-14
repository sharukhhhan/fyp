import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Image 
} from 'react-native';
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

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
      
      if (result.type === 'success') {
        setDocumentFile(result);
      }
    } catch (err) {
      setError('Error picking document');
    }
  };

  // Handle registration
  const handleRegister = async () => {
    // Reset error
    setError('');
    
    // Validate inputs
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!isEmailValid()) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (!isPasswordStrong()) {
      setError('Password must be at least 8 characters and include at least one number and one letter');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (!documentType) {
      setError('Please select an identification document type');
      return;
    }

    if (!documentFile) {
      setError('Please upload your identification document');
      return;
    }

    if (!documentNumber) {
      setError('Document number is required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare common document data
      const documentData = {
        surname,
        name,
        patronym,
        dateOfBirth,
        documentNumber,
        issueDate,
        expiryDate
      };
      
      // Add specific fields based on document type
      if (documentType === 'idCard') {
        Object.assign(documentData, {
          sex,
          placeOfBirth,
          authority,
          personalNumber
        });
      }
      
      const userData = {
        email,
        password,
        documentType,
        documentData,
        documentFile
      };
      
      const success = await register(userData);
      
      if (!success) {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Headline style={styles.title}>Create an Account</Headline>
          <Subheading style={styles.subtitle}>
            Join our secure online notary platform
          </Subheading>
        </View>
        
        <View style={styles.formContainer}>
          
          <TextInput
            label="Email"
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
            label="Password"
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
            label="Confirm Password"
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
            <Text style={styles.sectionTitle}>Identity Verification</Text>
            
            <RadioButton.Group onValueChange={value => setDocumentType(value)} value={documentType}>
              <View style={styles.radioOptionsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.radioOptionButton,
                    documentType === 'idCard' && styles.radioOptionSelected
                  ]}
                  onPress={() => setDocumentType('idCard')}
                >
                  <RadioButton.Android
                    value="idCard"
                    color={theme.colors.primary}
                  />
                  <Text style={styles.radioOptionText}>ID Card</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.radioOptionButton,
                    documentType === 'driverLicense' && styles.radioOptionSelected
                  ]}
                  onPress={() => setDocumentType('driverLicense')}
                >
                  <RadioButton.Android
                    value="driverLicense"
                    color={theme.colors.primary}
                  />
                  <Text style={styles.radioOptionText}>Driver's License</Text>
                </TouchableOpacity>
              </View>
            </RadioButton.Group>

            {documentType && (
              <>
                <View style={styles.documentFieldsContainer}>
                  <TextInput
                    label="Surname"
                    value={surname}
                    onChangeText={setSurname}
                    mode="outlined"
                    style={styles.input}
                    disabled={isLoading}
                  />
                  <TextInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    disabled={isLoading}
                  />
                  <TextInput
                    label="Patronym (optional)"
                    value={patronym}
                    onChangeText={setPatronym}
                    mode="outlined"
                    style={styles.input}
                    disabled={isLoading}
                  />
                  <TextInput
                    label="Date of Birth"
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                    mode="outlined"
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    disabled={isLoading}
                  />
                  <TextInput
                    label="Document Number"
                    value={documentNumber}
                    onChangeText={setDocumentNumber}
                    mode="outlined"
                    style={styles.input}
                    disabled={isLoading}
                  />

                  {documentType === 'idCard' && (
                    <>
                      <View style={styles.radioRow}>
                        <Text style={styles.radioLabel}>Sex:</Text>
                        <RadioButton.Group onValueChange={value => setSex(value)} value={sex}>
                          <View style={styles.sexOptionsContainer}>
                            <View style={styles.sexOption}>
                              <RadioButton value="male" />
                              <Text>Male</Text>
                            </View>
                            <View style={styles.sexOption}>
                              <RadioButton value="female" />
                              <Text>Female</Text>
                            </View>
                          </View>
                        </RadioButton.Group>
                      </View>
                      
                      <TextInput
                        label="Place of Birth"
                        value={placeOfBirth}
                        onChangeText={setPlaceOfBirth}
                        mode="outlined"
                        style={styles.input}
                        disabled={isLoading}
                      />
                      <TextInput
                        label="Authority"
                        value={authority}
                        onChangeText={setAuthority}
                        mode="outlined"
                        style={styles.input}
                        disabled={isLoading}
                      />
                      <TextInput
                        label="Date of Issue"
                        value={issueDate}
                        onChangeText={setIssueDate}
                        mode="outlined"
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        disabled={isLoading}
                      />
                      <TextInput
                        label="Date of Expiry"
                        value={expiryDate}
                        onChangeText={setExpiryDate}
                        mode="outlined"
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        disabled={isLoading}
                      />
                      <TextInput
                        label="Personal Number"
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
                      <TextInput
                        label="Date of Issue"
                        value={issueDate}
                        onChangeText={setIssueDate}
                        mode="outlined"
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        disabled={isLoading}
                      />
                      <TextInput
                        label="Date of Expiry"
                        value={expiryDate}
                        onChangeText={setExpiryDate}
                        mode="outlined"
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        disabled={isLoading}
                      />
                    </>
                  )}
                </View>

                <Button
                  mode="outlined"
                  onPress={pickDocument}
                  style={styles.uploadButton}
                  disabled={isLoading}
                >
                  {documentFile ? 'Document Selected' : 'Upload PDF Document'}
                </Button>

                {documentFile && (
                  <Text style={styles.fileName}>
                    Selected: {documentFile.name}
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
              I agree to the{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
          
          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}
          
          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.registerButton}
            loading={isLoading}
            disabled={isLoading}
          >
            Create Account
          </Button>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Text style={styles.loginLink}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>
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
  logoContainer: {
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  radioOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  radioOptionSelected: {
    borderColor: '#3498db',
    backgroundColor: '#3498db10',
  },
  radioOptionText: {
    marginLeft: 8,
    fontSize: 16,
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
  },
});

export default function RegisterScreenWrapper(props) {
  const theme = useTheme();
  return <RegisterScreen {...props} theme={theme} />;
}