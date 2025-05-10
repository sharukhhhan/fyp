import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Avatar,
  Divider,
  HelperText,
  useTheme
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import LoadingIndicator from '../components/LoadingIndicator';

const EditProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, updateProfile, logout } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userData = {
        firstName,
        lastName,
        email,
        phone,
        address,
        profileImage
      };
      
      const success = await updateProfile(userData);
      
      if (success) {
        Alert.alert(
          'Success',
          'Profile updated successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            setIsLoading(true);
            try {
              const success = await logout();
              if (!success) {
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Pick an image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!firstName && !lastName) return 'U';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return <LoadingIndicator message="Updating profile..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Avatar.Image
              size={100}
              source={{ uri: profileImage }}
            />
          ) : (
            <Avatar.Text
              size={100}
              label={getUserInitials()}
              backgroundColor={theme.colors.primary}
            />
          )}
          
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={pickImage}
          >
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={styles.input}
            error={!!errors.firstName}
          />
          <HelperText type="error" visible={!!errors.firstName}>
            {errors.firstName}
          </HelperText>
          
          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            style={styles.input}
            error={!!errors.lastName}
          />
          <HelperText type="error" visible={!!errors.lastName}>
            {errors.lastName}
          </HelperText>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
            error={!!errors.email}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>
          
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          
          <Divider style={styles.divider} />
          
          <View style={styles.buttonsContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.saveButton}
            >
              Save Changes
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
          
          <View style={styles.additionalActions}>
            <TouchableOpacity
              style={styles.actionLink}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <Text style={styles.actionLinkText}>
                Change Password
              </Text>
            </TouchableOpacity>
            
            <Divider style={styles.actionDivider} />
            
            <TouchableOpacity
              style={styles.actionLink}
              onPress={handleLogout}
            >
              <Text style={[styles.actionLinkText, styles.logoutText]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  changePhotoButton: {
    marginTop: 12,
  },
  changePhotoText: {
    color: '#3498db',
    fontSize: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
  },
  divider: {
    marginVertical: 20,
  },
  buttonsContainer: {
    marginBottom: 16,
  },
  saveButton: {
    marginBottom: 12,
    paddingVertical: 6,
  },
  cancelButton: {
    paddingVertical: 6,
  },
  additionalActions: {
    marginTop: 16,
  },
  actionLink: {
    alignItems: 'center',
    padding: 12,
  },
  actionLinkText: {
    color: '#3498db',
    fontSize: 16,
  },
  actionDivider: {
    marginVertical: 8,
  },
  logoutText: {
    color: '#e74c3c',
  },
});

export default EditProfileScreen;