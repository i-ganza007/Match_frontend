// Login has been removed - redirecting to signup
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoginRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to signup
        router.replace('/signup');
    }, []);

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
        backgroundColor: '#000',
    },
});
