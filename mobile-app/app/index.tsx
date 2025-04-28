import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/context/AuthContext';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(error => {
  console.warn('Error preventing splash screen auto-hide:', error);
});

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    async function hideSplash() {
      try {
        // Hide splash screen once we've determined authentication state
        if (!isLoading) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    }

    hideSplash();
  }, [isLoading]);

  // If still loading, return null to keep splash screen visible
  if (isLoading) {
    return null;
  }

  // Redirect based on authentication state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/auth/welcome" />;
  }
}