import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

// SSL certificate handling for development only
if (__DEV__) {
  if (Platform.OS === 'ios') {
    console.warn(
      'Running in development mode with SSL certificate validation disabled.\n' +
      'Do not use this configuration in production!'
    );
  }
}

// Import screens
import DocumentsScreen from './screens/DocumentsScreen';
import DocumentDetailScreen from './screens/DocumentDetailScreen';
import DocumentFilesScreen from './screens/DocumentFilesScreen';
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
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';

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
    surface: '#ffffff',
    text: '#000000',
    error: '#e74c3c',
    disabled: '#95a5a6',
    placeholder: '#bdc3c7',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#e74c3c',
  },
  roundness: 8,
  animation: {
    scale: 1.0,
  },
};

// Document stack navigator
function DocumentsStack() {
  const { t } = useLocalization();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ headerShown: true, title: t('documents') }} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: t('documentDetails') }} />
      <Stack.Screen name="DocumentFiles" component={DocumentFilesScreen} options={{ title: t('downloadedDocuments') }} />
      <Stack.Screen name="NewDocumentOption" component={NewDocumentOptionScreen} options={{ title: t('createNewDocument') }} />
      <Stack.Screen name="NewDocument" component={NewDocumentScreen} options={{ title: t('newDocument') }} />
      <Stack.Screen name="ChatWithAI" component={ChatWithAIScreen} options={{ title: t('chatWithAI') }} />
    </Stack.Navigator>
  );
}

// Video calls stack navigator
function VideoCallsStack() {
  const { t } = useLocalization();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Calls" component={VideoCallsScreen} options={{ headerShown: true, title: t('videoCalls') }} />
      <Stack.Screen name="JoinCall" component={JoinCallScreen} options={{ title: t('joinCall') }} />
    </Stack.Navigator>
  );
}

// User stack navigator
function UserStack() {
  const { logout } = useAuth();
  const { t } = useLocalization();
  
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
          title: t('profile'),
          // Simple, clean header without logout button
        }} 
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: t('editProfile') }} />
    </Stack.Navigator>
  );
}

// Main tab navigator
function MainTabs() {
  const { t } = useLocalization();
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
        options={{ title: t('documents') }} 
      />
      <Tab.Screen 
        name="VideoCallsTab" 
        component={VideoCallsStack} 
        options={{ title: t('videoCalls') }} 
      />
      <Tab.Screen 
        name="UserTab" 
        component={UserStack} 
        options={{ title: t('profile') }} 
      />
    </Tab.Navigator>
  );
}

// Authentication stack
function AuthStack() {
  const { t } = useLocalization();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: t('login') }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('register') }} />
    </Stack.Navigator>
  );
}

// Root navigation container
function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { t } = useLocalization();
  
  if (isLoading) {
    return <LoadingIndicator message={t('loading')} />;
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
        <LocalizationProvider>
          <AuthProvider>
            <DocumentProvider>
              <RootNavigator />
              <StatusBar style="auto" />
            </DocumentProvider>
          </AuthProvider>
        </LocalizationProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}