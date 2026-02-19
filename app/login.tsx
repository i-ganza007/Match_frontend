
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        // Navigate to home logic or validation
        router.replace('/(tabs)/home');
    };

    const navigateToSignup = () => {
        router.push('/signup');
    };

    return (
        <ImageBackground
            source={require('../assets/images/splash-icon.png')} // Fallback or use a gradient if image not suitable
            style={styles.backgroundImage}
            blurRadius={10} // blur the background for better contrast
        >
            <LinearGradient
                colors={['rgba(26, 46, 26, 0.9)', 'rgba(26, 46, 26, 0.7)']}
                style={styles.gradientOverlay}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.glassContainer}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Access premium genetics for your farm</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email or Phone</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email or phone"
                                    placeholderTextColor="#666"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#666"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                            <Text style={styles.loginButtonText}>Log In</Text>
                            <Ionicons name="arrow-forward" size={20} color="#000" style={styles.loginButtonIcon} />
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                            <View style={styles.divider} />
                        </View>

                        <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="finger-print" size={28} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="happy-outline" size={28} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={navigateToSignup}>
                                <Text style={styles.signupText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: width,
        height: height,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    glassContainer: {
        backgroundColor: 'rgba(30, 40, 30, 0.7)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#AAAAAA',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: '#FFFFFF',
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 50, // Pill shape
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#FFD700', // Gold/Yellow
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#FFD700', // Gold/Yellow
        borderRadius: 50,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    loginButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    loginButtonIcon: {
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        color: '#888',
        paddingHorizontal: 16,
        fontSize: 12,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 30,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: '#AAA',
        fontSize: 14,
    },
    signupText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
