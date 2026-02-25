import { Stack } from "expo-router";
import React, { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from '../components/SplashScreen';
import { ThemeProvider } from '../context/ThemeContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // This is just a placeholder for any initialization you might need
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Don't hide the native splash screen yet - let our custom one handle it
      }
    }

    prepare();
  }, []);

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scanning/analysis" options={{ headerShown: false }} />
        <Stack.Screen name="scanning/result" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  )
}