import { Stack, useSegments, useRouter } from "expo-router";
import React, { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from '../components/SplashScreen';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { BUNDLE_VERSION } from '../constants/bundleVersion';
import '../i18n';

SplashScreen.preventAutoHideAsync();

function RouteGuard() {
    const { user, token, isLoaded } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;
        const inProtectedGroup = segments[0] === '(tabs)';
        // Only redirect to login if BOTH user AND token are absent.
        // Having either one means we consider the session active.
        const hasSession = !!user || !!token;
        if (!hasSession && inProtectedGroup) {
            router.replace('/login');
        }
    }, [user, token, isLoaded, segments]);

    return null;
}

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
            <AuthProvider>
                <RouteGuard />
                <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="scanning/analysis" options={{ headerShown: false }} />
                    <Stack.Screen name="scanning/result" options={{ headerShown: false }} />
                    <Stack.Screen name="signup" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
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
            </AuthProvider>
        </ThemeProvider>
    );
}
