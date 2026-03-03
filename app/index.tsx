import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { isOnline } from '../services/auth';

/**
 * Authentication Gate
 * Checks if user is authenticated and redirects accordingly:
 * - Authenticated: redirects to /(tabs)/home
 * - Not authenticated: redirects to /(tabs)/index (welcome screen with "Get Started" button)
 */
export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      // Check if user has valid session with backend
      const authenticated = await isOnline();
      
      if (authenticated) {
        // User is authenticated, go to home
        router.replace('/(tabs)/home');
      } else {
        // User is not authenticated, show welcome screen
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, default to welcome screen
      router.replace('/(tabs)');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
