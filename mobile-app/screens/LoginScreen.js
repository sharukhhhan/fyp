import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Image,
  Alert,
  Text as RNText
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Headline, 
  Subheading,
  HelperText 
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

// Создаем отдельный компонент для отображения ошибки
const ErrorMessage = ({ errorText }) => {
  if (!errorText) return null;
  
  console.log('Rendering error component with text:', errorText);
  
  return (
    <View style={styles.errorContainer}>
      <RNText style={styles.errorText}>
        {errorText}
      </RNText>
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const { login } = useAuth();

  // Add effect to log error state changes
  useEffect(() => {
    if (error) {
      console.log('Error state updated:', error);
    }
  }, [error]);

  // Add effect to force re-render when error changes
  useEffect(() => {
    // If there's an error, force a re-render by incrementing forceUpdate
    if (error) {
      const timer = setTimeout(() => {
        setForceUpdate(prev => prev + 1);
        console.log('Forcing UI update for error:', error);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Validate email format
  const isEmailValid = () => {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  // Add a new function for showing errors
  const showError = (message) => {
    console.log('Setting error message to:', message);
    
    // Force a re-render by using a callback
    setError(() => {
      console.log('Error setter callback with:', message);
      return message;
    });
    
    // On web we need to ensure error is displayed
    if (Platform.OS === 'web') {
      console.log('Showing error banner:', message);
      
      // For web specifically, we'll try multiple approaches
      
      // 1. Force another re-render after a short delay
      setTimeout(() => {
        console.log('Forcing update after short delay');
        setForceUpdate(prev => prev + 1);
      }, 200);
      
      // 2. For web, we can also try to use direct DOM manipulation as fallback
      setTimeout(() => {
        try {
          // Create a hidden error element if it doesn't exist
          let errorContainer = document.getElementById('login-error-container');
          if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'login-error-container';
            errorContainer.style.position = 'fixed';
            errorContainer.style.top = '20px';
            errorContainer.style.left = '50%';
            errorContainer.style.transform = 'translateX(-50%)';
            errorContainer.style.backgroundColor = '#FFEBEE';
            errorContainer.style.color = '#d32f2f';
            errorContainer.style.padding = '10px 20px';
            errorContainer.style.borderRadius = '4px';
            errorContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            errorContainer.style.zIndex = '9999';
            errorContainer.style.textAlign = 'center';
            errorContainer.style.fontWeight = 'bold';
            document.body.appendChild(errorContainer);
          }
          
          // Update the error message and make sure it's visible
          errorContainer.textContent = message;
          errorContainer.style.display = 'block';
          
          // Hide after 5 seconds
          setTimeout(() => {
            errorContainer.style.display = 'none';
          }, 5000);
        } catch (e) {
          console.error('DOM manipulation error:', e);
        }
      }, 300);
    } else {
      // On mobile we can also show an alert for better visibility
      Alert.alert('Login Error', message);
    }
  };

  // Handle login
  const handleLogin = async () => {
    // Reset error
    setError('');
    console.log('Login button pressed');
    
    // Validate inputs
    if (!email.trim()) {
      showError('Email is required');
      return;
    }
    
    if (!isEmailValid()) {
      showError('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      showError('Password is required');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Calling login function');
      
      // Вызов функции входа
      const result = await login(email, password);
      console.log('Login result:', result);
      
      // Сбрасываем пароль
      setPassword('');
      
      // ВАЖНО: Сначала обрабатываем ошибки, затем завершаем загрузку
      if (result === true) {
        // Вход успешен, навигация произойдет автоматически
        console.log('Login successful');
        setIsLoading(false);
      } else {
        // Определяем сообщение об ошибке
        let errorMessage = 'Invalid email or password';
        
        if (result && result.error) {
          errorMessage = result.error;
          console.log('Login failed with error:', errorMessage);
        } else {
          console.log('Login failed with unknown result:', result);
        }
        
        // Завершаем загрузку перед показом ошибки
        setIsLoading(false);
        
        // Показываем ошибку в отдельном вызове после обновления isLoading
        setTimeout(() => {
          showError(errorMessage);
        }, 0);
      }
    } catch (err) {
      console.error('Login catch error:', err);
      // Завершаем загрузку
      setIsLoading(false);
      
      // Показываем ошибку в отдельном вызове
      setTimeout(() => {
        showError('Login failed. Please try again.');
      }, 0);
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
          <Headline style={styles.title}>Online Notary</Headline>
          <Subheading style={styles.subtitle}>
            Secure document notarization from anywhere
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
            error={error && error.includes('password')}
            disabled={isLoading}
          />
          
          <ErrorMessage errorText={error} />
          
          <RNText style={{color: 'gray', fontSize: 10, textAlign: 'center'}}>
            Error state: {error ? `"${error}"` : 'none'} (update: {forceUpdate})
          </RNText>
          
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            loading={isLoading}
            disabled={isLoading}
          >
            Log In
          </Button>
          
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading}
          >
            <Text style={styles.registerLink}>
              Register Now
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
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
  loginButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  forgotPassword: {
    marginTop: 16,
    textAlign: 'center',
    color: '#3498db',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    marginRight: 6,
  },
  registerLink: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default LoginScreen;