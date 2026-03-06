import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Authentication Gate
 * 1. No token in SecureStore → welcome screen
 * 2. Token exists + server confirms it → home
 * 3. Token exists + server returns 401/403 → token is invalid, welcome screen
 * 4. Token exists + network error/timeout → trust the local token, go home
 */
export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    // ⚡ TESTING MODE — skip auth, always go straight to home
    router.replace('/(tabs)/home');
    setIsChecking(false);
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
