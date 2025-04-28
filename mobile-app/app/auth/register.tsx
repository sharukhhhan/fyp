import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react-native';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Password strength validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      newErrors.password = 'Password does not meet all requirements';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      await register({ firstName, lastName, email, password });
      router.push('/auth/verify-id');
    } catch (err: any) {
      setErrors({ 
        form: err.message || 'Registration failed. Please try again.' 
      });
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const ValidationCheck = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <View style={styles.validationItem}>
      {isValid ? (
        <Check size={16} color={Colors.dark.success} />
      ) : (
        <X size={16} color={Colors.dark.textDim} />
      )}
      <Text 
        style={[
          styles.validationText, 
          isValid && styles.validationTextValid
        ]}
      >
        {text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Fill in your details to get started</Text>
          </View>
          
          <Animated.View 
            style={styles.formContainer}
            entering={FadeInUp.duration(600).delay(200)}
          >
            {errors.form && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.form}</Text>
              </View>
            )}
            
            <View style={styles.nameRow}>
              <View style={[styles.inputGroup, styles.nameInput]}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.firstName && styles.inputError
                  ]}
                  placeholder="First Name"
                  placeholderTextColor={Colors.dark.textDim}
                  value={firstName}
                  onChangeText={setFirstName}
                />
                {errors.firstName && (
                  <Text style={styles.fieldError}>{errors.firstName}</Text>
                )}
              </View>
              
              <View style={styles.nameGap} />
              
              <View style={[styles.inputGroup, styles.nameInput]}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.lastName && styles.inputError
                  ]}
                  placeholder="Last Name"
                  placeholderTextColor={Colors.dark.textDim}
                  value={lastName}
                  onChangeText={setLastName}
                />
                {errors.lastName && (
                  <Text style={styles.fieldError}>{errors.lastName}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.email && styles.inputError
                ]}
                placeholder="Enter your email"
                placeholderTextColor={Colors.dark.textDim}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.fieldError}>{errors.email}</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.passwordContainer,
                errors.password && styles.inputError
              ]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor={Colors.dark.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.dark.textDim} />
                  ) : (
                    <Eye size={20} color={Colors.dark.textDim} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.fieldError}>{errors.password}</Text>
              )}
            </View>
            
            <View style={styles.validationContainer}>
              <ValidationCheck isValid={hasMinLength} text="At least 8 characters" />
              <ValidationCheck isValid={hasUpperCase} text="At least 1 uppercase letter" />
              <ValidationCheck isValid={hasLowerCase} text="At least 1 lowercase letter" />
              <ValidationCheck isValid={hasNumber} text="At least 1 number" />
              <ValidationCheck isValid={hasSpecialChar} text="At least 1 special character" />
            </View>
            
            <Button 
              label="Create Account" 
              onPress={handleRegister}
              variant="primary"
              loading={loading}
              style={styles.registerButton}
            />
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Roboto-Bold',
    fontSize: 28,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.textDim,
  },
  formContainer: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: Colors.dark.errorLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.error,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
  },
  nameGap: {
    width: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.text,
  },
  inputError: {
    borderColor: Colors.dark.error,
  },
  fieldError: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: Colors.dark.error,
    marginTop: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.text,
  },
  eyeIcon: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validationContainer: {
    marginBottom: 24,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  validationText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
    marginLeft: 8,
  },
  validationTextValid: {
    color: Colors.dark.success,
  },
  registerButton: {
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
  },
  loginLink: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: Colors.dark.primaryBlue,
  },
});