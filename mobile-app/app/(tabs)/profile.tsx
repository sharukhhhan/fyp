import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { User, Shield, Bell, Moon, CircleHelp as HelpCircle, LogOut, ChevronRight, Camera } from 'lucide-react-native';
import AppHeader from '@/components/AppHeader';
import ProfileAvatar from '@/components/ProfileAvatar';
import SettingsItem from '@/components/SettingsItem';
import DividerLine from '@/components/DividerLine';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            logout();
            router.replace('/auth/welcome');
          }
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
            <ProfileAvatar uri={user?.avatarUrl} size={100} />
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={handleChangeAvatar}
            >
              <Camera size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
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