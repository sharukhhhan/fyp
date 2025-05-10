import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

// Import screens
import DocumentsScreen from './screens/DocumentsScreen';
import DocumentDetailScreen from './screens/DocumentDetailScreen';
import NewDocumentScreen from './screens/NewDocumentScreen';
import NewDocumentOptionScreen from './screens/NewDocumentOptionScreen';
import ChatWithAIScreen from './screens/ChatWithAIScreen';
import VideoCallsScreen from './screens/VideoCallsScreen';
import JoinCallScreen from './screens/JoinCallScreen';
import UserScreen from './screens/UserScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Import components
import LoadingIndicator from './components/LoadingIndicator';

// Import contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    accent: '#f1c40f',
    background: '#ffffff',
  },
};



// Document stack navigator
function DocumentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ headerShown: true }} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Document Details' }} />
      <Stack.Screen name="NewDocumentOption" component={NewDocumentOptionScreen} options={{ title: 'Create Document' }} />
      <Stack.Screen name="NewDocument" component={NewDocumentScreen} options={{ title: 'New Document' }} />
      <Stack.Screen name="ChatWithAI" component={ChatWithAIScreen} options={{ title: 'Chat with AI' }} />
    </Stack.Navigator>
  );
}

// Video calls stack navigator
function VideoCallsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Calls" component={VideoCallsScreen} options={{ headerShown: true }} />
      <Stack.Screen name="JoinCall" component={JoinCallScreen} options={{ title: 'Join Call' }} />
    </Stack.Navigator>
  );
}

// User stack navigator
function UserStack() {
  const { logout } = useAuth();
  
  // Handle logout with confirmation
  const handleLogout = () => {
    // Handle logout logic (moved to UserScreen for better UX)
  };
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="UserProfile" 
        component={UserScreen} 
        options={{ 
          title: 'Profile',
          // Simple, clean header without logout button
        }} 
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    </Stack.Navigator>
  );
}

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DocumentsTab') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'VideoCallsTab') {
            iconName = focused ? 'videocam' : 'videocam-outline';
          } else if (route.name === 'UserTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="DocumentsTab" 
        component={DocumentsStack} 
        options={{ title: 'Documents' }} 
      />
      <Tab.Screen 
        name="VideoCallsTab" 
        component={VideoCallsStack} 
        options={{ title: 'Video Calls' }} 
      />
      <Tab.Screen 
        name="UserTab" 
        component={UserStack} 
        options={{ title: 'Profile' }} 
      />
    </Tab.Navigator>
  );
}

// Authentication stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Root navigation container
function RootNavigator() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingIndicator message="Loading..." />;
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <DocumentProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </DocumentProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}