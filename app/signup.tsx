
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // Password strength visual logic (simple mock)
    const getPasswordStrength = (pass: string) => {
        if (pass.length === 0) return 0;
        if (pass.length < 6) return 0.3;
        if (pass.length < 10) return 0.6;
        return 1;
    };

    const passwordStrength = getPasswordStrength(password);

    const handleSignup = () => {
        // Should navigate to home or verify
        router.replace('/(tabs)/home');
    };

    const navigateToLogin = () => {
        router.back();
    };

    return (
        <ImageBackground
            source={require('../assets/images/splash-icon.png')}
            style={styles.backgroundImage}
            blurRadius={15}
        >
            <LinearGradient
                colors={['rgba(15, 30, 15, 0.95)', 'rgba(26, 46, 26, 0.85)']} // Darker green for signup as per image
                style={styles.gradientOverlay}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Sign Up</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.stepIndicator}>
                        <View style={[styles.stepDot, styles.activeStep]} />
                        <View style={styles.stepDot} />
                        <View style={styles.stepDot} />
                    </View>

                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the premium network for genetic matching.</Text>

                    <View style={styles.formContainer}>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthRow}>
                                <Text style={[styles.strengthText, { color: passwordStrength > 0.6 ? '#4ADE80' : '#888' }]}>
                                    {passwordStrength > 0.6 ? 'Strong' : 'Weak'}
                                </Text>
                                <Text style={styles.strengthLabel}>Password Strength</Text>
                            </View>
                            <View style={styles.strengthBarBg}>
                                <LinearGradient
                                    colors={['#FFA500', '#4ADE80']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.strengthBarFill, { width: `${passwordStrength * 100}%` }]}
                                />
                            </View>
                        </View>

                    </View>

                    <TouchableOpacity style={styles.createAccountButton} onPress={handleSignup}>
                        <Text style={styles.createAccountText}>Create Account</Text>
                    </TouchableOpacity>

                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={navigateToLogin}>
                            <Text style={styles.signinText}>Sign In</Text>
                        </TouchableOpacity>
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
        padding: 24,
        paddingTop: 60,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 8,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    activeStep: {
        backgroundColor: '#FFFFFF',
        width: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#AAA',
        marginBottom: 30,
        lineHeight: 22,
    },
    formContainer: {
        backgroundColor: 'rgba(30, 40, 30, 0.6)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: '#EEE',
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 50, // Pill shape like in design
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
        height: 50,
    },
    strengthContainer: {
        marginTop: 5,
    },
    strengthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
    },
    strengthLabel: {
        color: '#888',
        fontSize: 12,
    },
    strengthBarBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    createAccountButton: {
        backgroundColor: '#22C55E', // Bright green
        borderRadius: 50,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    createAccountText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        color: '#888',
        fontSize: 14,
    },
    signinText: {
        color: '#22C55E',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
