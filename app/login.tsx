import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ImageBackground, Dimensions, KeyboardAvoidingView,
    Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { login } from '../services/auth';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [identifier, setIdentifier] = useState(''); // email or phone
    const [password, setPassword]     = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!identifier.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter your email and password');
            return;
        }

        setLoading(true);
        const result = await login({ email: identifier.trim(), password });
        setLoading(false);

        if (result.success && result.user) {
            await signIn(result.token ?? null, result.user);
            router.replace('/(tabs)/home');
        } else {
            Alert.alert('Login Failed', result.message || 'Invalid credentials. Please try again.');
        }
    };

    return (
        <ImageBackground
            source={require('../assets/images/splash-icon.png')}
            style={styles.bg}
            blurRadius={15}
        >
            <LinearGradient
                colors={['rgba(15,30,15,0.96)', 'rgba(26,46,26,0.88)']}
                style={StyleSheet.absoluteFill}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Back */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Welcome back</Text>
                    <Text style={styles.subtitle}>Sign in to continue to Match</Text>

                    <View style={styles.card}>
                        {/* Email / Phone */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={identifier}
                                onChangeText={setIdentifier}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="Enter your email"
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.pwRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(v => !v)}
                                    style={styles.eyeBtn}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && { opacity: 0.6 }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#000" />
                            : <Text style={styles.btnText}>Sign In</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.signupLink}
                        onPress={() => router.replace('/signup')}
                    >
                        <Text style={styles.signupLinkText}>
                            Don't have an account?{' '}
                            <Text style={styles.signupLinkBold}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg:       { flex: 1, width, height },
    scroll:   { flexGrow: 1, padding: 24, paddingTop: 60 },
    backBtn:  { marginBottom: 32, padding: 4, alignSelf: 'flex-start' },
    title:    { fontSize: 34, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#aaa', marginBottom: 36 },
    card: {
        backgroundColor: 'rgba(30,40,30,0.6)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 28,
        gap: 20,
    },
    field:   {},
    label:   { color: '#eee', fontSize: 14, fontWeight: '500', marginBottom: 8 },
    input: {
        backgroundColor: '#fff',
        borderRadius: 50,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
        height: 50,
    },
    pwRow:   { flexDirection: 'row', alignItems: 'center' },
    eyeBtn:  { position: 'absolute', right: 16, padding: 4 },
    btn: {
        backgroundColor: '#22C55E',
        borderRadius: 50,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 20,
    },
    btnText:         { color: '#000', fontSize: 18, fontWeight: 'bold' },
    signupLink:      { alignItems: 'center', paddingBottom: 20 },
    signupLinkText:  { color: '#888', fontSize: 14 },
    signupLinkBold:  { color: '#22C55E', fontWeight: 'bold' },
});
