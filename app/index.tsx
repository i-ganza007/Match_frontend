import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user, token, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    // Consider the session active if EITHER the user object or token is present.
    // Never send to /login unless both are absent (i.e. user explicitly signed out).
    if (user || token) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/login');
    }
  }, [isLoaded, user, token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#11d41e" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#081209',
  },
});
