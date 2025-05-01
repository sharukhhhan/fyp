import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { User, Shield, Bell, Moon, CircleHelp as HelpCircle, LogOut, ChevronRight, Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '@/components/AppHeader';
import ProfileAvatar from '@/components/ProfileAvatar';
import SettingsItem from '@/components/SettingsItem';
import DividerLine from '@/components/DividerLine';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://3.92.108.217/notary/api/profile/', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + await getAuthToken(),
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    // This is a placeholder - in a real app, you would get the token from your auth service
    // For example, from AsyncStorage or from your auth context
    try {
      const tokensStr = await AsyncStorage.getItem('auth_tokens');
      if (tokensStr) {
        const tokens = JSON.parse(tokensStr);
        return tokens.access;
      }
      return '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  };

  const getRefreshToken = async () => {
    try {
      const tokensStr = await AsyncStorage.getItem('auth_tokens');
      if (tokensStr) {
        const tokens = JSON.parse(tokensStr);
        return tokens.refresh;
      }
      return '';
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return '';
    }
  };

  const handleDirectLogout = async () => {
    try {
      console.log('Attempting direct API logout...');
      
      // Get tokens
      const tokensStr = await AsyncStorage.getItem('auth_tokens');
      if (!tokensStr) {
        console.error('No auth tokens found');
        Alert.alert('Error', 'No authentication tokens found.');
        return;
      }
      
      const tokens = JSON.parse(tokensStr);
      const accessToken = tokens.access;
      const refreshToken = tokens.refresh;
      
      if (!accessToken || !refreshToken) {
        console.error('Invalid tokens:', { accessToken, refreshToken });
        Alert.alert('Error', 'Invalid authentication tokens.');
        return;
      }
      
      console.log('Tokens retrieved successfully');
      
      // Make the API call
      const response = await fetch('https://3.92.108.217/notary/api/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        }),
      });
      
      console.log('Logout API response status:', response.status);
      
      if (!response.ok) {
        // Try to get error details
        let errorText = '';
        try {
          const errorData = await response.text();
          errorText = errorData;
          console.error('Error response:', errorData);
        } catch (e) {
          console.error('Failed to parse error response');
        }
        Alert.alert('API Error', `Status: ${response.status}, Details: ${errorText}`);
        return;
      }
      
      console.log('API logout successful');
      
      // Clear local tokens
      await AsyncStorage.removeItem('auth_tokens');
      console.log('Local tokens cleared');
      
      // Call the context logout (optional at this point)
      logout();
      console.log('Context logout called');
      
      // Navigate to welcome screen
      Alert.alert('Success', 'You have been logged out successfully', [
        { text: 'OK', onPress: () => router.replace('/auth/welcome') }
      ]);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please check your network connection and try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: handleDirectLogout
        }
      ]
    );
  };

  const handleChangeAvatar = () => {
    // Handle avatar change (implementation will depend on app requirements)
    Alert.alert("Change Avatar", "This feature will be implemented in the next update.");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      <AppHeader title="Profile" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <ProfileAvatar uri={null} size={100} />
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={handleChangeAvatar}
            >
              <Camera size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>
            {profileData?.full_name || 'Loading...'}
          </Text>
          <Text style={styles.userEmail}>{profileData?.email || 'Loading...'}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingsItem 
            icon={<User size={22} color={Colors.dark.primaryBlue} />}
            title="Personal Information"
            onPress={() => router.push('/profile/personal-info')}
          />
          
          <SettingsItem 
            icon={<Shield size={22} color={Colors.dark.primaryBlue} />}
            title="Security & Privacy"
            onPress={() => router.push('/profile/security')}
          />
          
          <DividerLine />
          
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <SettingsItem 
            icon={<Bell size={22} color={Colors.dark.primaryBlue} />}
            title="Notifications"
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#767577', true: Colors.dark.teal }}
                thumbColor={'#f4f3f4'}
              />
            }
          />
          
          <SettingsItem 
            icon={<Moon size={22} color={Colors.dark.primaryBlue} />}
            title="Dark Mode"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#767577', true: Colors.dark.teal }}
                thumbColor={'#f4f3f4'}
              />
            }
          />
          
          <DividerLine />
          
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingsItem 
            icon={<HelpCircle size={22} color={Colors.dark.primaryBlue} />}
            title="Help & Support"
            subtitle="Contact us, FAQs, Legal"
            onPress={() => router.push('/profile/support')}
          />
          
          <DividerLine />
          
          <SettingsItem 
            icon={<LogOut size={22} color={Colors.dark.error} />}
            title="Logout"
            titleStyle={{ color: Colors.dark.error }}
            onPress={handleLogout}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.dark.primaryBlue,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontFamily: 'Roboto-Bold',
    fontSize: 22,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.textDim,
    marginBottom: 16,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.dark.teal,
  },
  editProfileText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: '#fff',
  },
  settingsSection: {
    backgroundColor: '#fff',
    paddingTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.dark.textDim,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  version: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
  },
});