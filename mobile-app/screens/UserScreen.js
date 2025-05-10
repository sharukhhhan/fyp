import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Image
} from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Button, 
  Divider, 
  List, 
  Switch,
  useTheme 
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useDocuments } from '../contexts/DocumentContext';
import LoadingIndicator from '../components/LoadingIndicator';

const UserScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { documents } = useDocuments();
  
  const [isLoading, setIsLoading] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load recent documents
  useEffect(() => {
    if (documents && documents.length > 0) {
      // Sort by date and get the 3 most recent
      const sorted = [...documents].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      
      setRecentDocuments(sorted.slice(0, 3));
    }
  }, [documents]);

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

  // Handle editing profile
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Toggle notification settings
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // In a real app, would save this setting to user profile
  };

  // Toggle biometric authentication
  const toggleBiometric = () => {
    setBiometricEnabled(!biometricEnabled);
    // In a real app, would set up biometric authentication
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, would change app theme
  };

  if (isLoading) {
    return <LoadingIndicator message="Please wait..." />;
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <Button 
          mode="contained" 
          onPress={handleLogout}
          style={styles.errorButton}
          buttonColor="#e74c3c"
        >
          Go to Login
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            {user.profileImage ? (
              <Avatar.Image 
                size={80} 
                source={{ uri: user.profileImage }} 
              />
            ) : (
              <Avatar.Text 
                size={80} 
                label={getUserInitials()} 
                backgroundColor={theme.colors.primary}
              />
            )}
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              
              <Button 
                mode="outlined" 
                onPress={handleEditProfile}
                style={styles.editButton}
                icon="pencil"
              >
                Edit Profile
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {recentDocuments.length > 0 && (
        <Card style={styles.sectionCard}>
          <Card.Title title="Recent Documents" />
          <Card.Content>
            {recentDocuments.map((doc) => (
              <TouchableOpacity 
                key={doc.id}
                onPress={() => navigation.navigate('DocumentDetail', { documentId: doc.id })}
                style={styles.documentItem}
              >
                <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle} numberOfLines={1}>
                    {doc.title}
                  </Text>
                  <Text style={styles.documentDate}>
                    {formatDate(doc.updatedAt || doc.createdAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#777" />
              </TouchableOpacity>
            ))}
            
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('DocumentsTab')}
              style={styles.viewAllButton}
            >
              View All Documents
            </Button>
          </Card.Content>
        </Card>
      )}
      
      <Card style={styles.sectionCard}>
        <Card.Title title="Settings" />
        <Card.Content>
          <List.Item
            title="Notifications"
            description="Receive alerts about document updates and calls"
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />}
          />
        
          
          <Divider />
          
          <List.Item
            title="Account Information"
            description="View your account details"
            left={props => <List.Icon {...props} icon="account" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {/* Navigate to account details */}}
          />
          

          
          <Divider />
          
          <List.Item
            title="Help & Support"
            description="Contact our support team"
            left={props => <List.Icon {...props} icon="help-circle" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {/* Navigate to help & support */}}
          />
          
          <Divider />
          
          {/* Single Logout Button */}
          <List.Item
            title="Logout"
            description="Sign out of your account"
            left={props => <List.Icon {...props} icon="logout" color="#e74c3c" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#e74c3c" />}
            titleStyle={{ color: '#e74c3c' }}
            onPress={handleLogout}
            style={styles.logoutItem}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    color: '#666',
  },
  viewAllButton: {
    marginTop: 8,
  },
  logoutItem: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#e74c3c',
  },
  errorButton: {
    marginTop: 16,
  },
});

export default UserScreen;