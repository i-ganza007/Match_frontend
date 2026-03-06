import { Stack } from "expo-router";
import React, { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from '../components/SplashScreen';
import { ThemeProvider } from '../context/ThemeContext';
import { BUNDLE_VERSION } from '../constants/bundleVersion';
import '../i18n';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  // Bundle version logged to console only — no Alert blocking testing
  useEffect(() => {
    if (!isReady) return;
    console.log(`[BUNDLE] ${BUNDLE_VERSION}`);
  }, [isReady]);

  const handleSplashFinish = async () => {
    setIsReady(true);
    await SplashScreen.hideAsync();
  };

  if (!isReady) {
    return <CustomSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scanning/analysis" options={{ headerShown: false }} />
        <Stack.Screen name="scanning/result" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
        <Stack.Screen 
          name="map-test" 
          options={{ 
            headerShown: true,
            title: 'Users Map - Test',
            headerStyle: { backgroundColor: '#081209' },
            headerTintColor: '#11d41e',
          }} 
        />
      </Stack>
    </ThemeProvider>
  )
}