
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signup, SignupData } from '../services/auth';
import { requestLocationPermission, hasLocationPermission } from '../services/location';
import { BUNDLE_VERSION } from '../constants/bundleVersion';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [sex, setSex] = useState<'MALE' | 'FEMALE'>('MALE');
    const [district, setDistrict] = useState('');
    const [sector, setSector] = useState('');
    const [village, setVillage] = useState('');
    const [cell, setCell] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [locationGranted, setLocationGranted] = useState(false);

    // Request location permission as soon as the signup screen opens
    useEffect(() => {
        (async () => {
            // Silent check first — no dialog if already granted
            const alreadyGranted = await hasLocationPermission();
            if (alreadyGranted) {
                setLocationGranted(true);
                return;
            }
            // Not granted yet — ask
            const result = await requestLocationPermission();
            if (result.granted) {
                setLocationGranted(true);
            } else if (!result.canAskAgain) {
                Alert.alert(
                    'Location Required',
                    'Match needs your location to connect you with nearby farmers. Please enable it in your device Settings.',
                    [
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        { text: 'Cancel', style: 'cancel' },
                    ],
                );
            }
        })();
    }, []);

    // Password strength visual logic
    const getPasswordStrength = (pass: string) => {
        if (pass.length === 0) return 0;
        if (pass.length < 6) return 0.3;
        if (pass.length < 10) return 0.6;
        return 1;
    };

    const passwordStrength = getPasswordStrength(password);

    const handleSignup = async () => {
        // Validation
        if (!fullName.trim() || !phone.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!district.trim() || !sector.trim() || !village.trim() || !cell.trim()) {
            Alert.alert('Error', 'Please fill in all location details');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        // Guard: if permission still not granted, re-request before the API call
        if (!locationGranted) {
            const result = await requestLocationPermission();
            if (!result.granted) {
                if (!result.canAskAgain) {
                    Alert.alert(
                        'Location Required',
                        'Please enable location access for Match in your device Settings and try again.',
                        [
                            { text: 'Open Settings', onPress: () => Linking.openSettings() },
                            { text: 'Cancel', style: 'cancel' },
                        ],
                    );
                } else {
                    Alert.alert('Location Required', 'Please allow location access to sign up.');
                }
                return;
            }
            setLocationGranted(true);
        }

        setLoading(true);

        const signupData: SignupData = {
            name: fullName.trim(),
            sex,
            password,
            phone_number: phone.trim(),
            email: email.trim() || undefined,
            district: district.trim(),
            sector: sector.trim(),
            village: village.trim(),
            cell: cell.trim(),
        };

        const result = await signup(signupData);

        setLoading(false);

        if (result.success) {
            // Show success notification and redirect to home
            Alert.alert(
                '🎉 Welcome!', 
                'Account created successfully!',
                [{ text: 'Continue', onPress: () => router.replace('/(tabs)/home') }],
                { cancelable: false }
            );
        } else {
            Alert.alert('Signup Failed', result.message || 'Please try again');
        }
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
                        <Text style={styles.headerTitle}>{t('signup.header', 'Sign Up')}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.stepIndicator}>
                        <View style={[styles.stepDot, styles.activeStep]} />
                        <View style={styles.stepDot} />
                        <View style={styles.stepDot} />
                    </View>

                    <Text style={styles.title}>{t('signup.createAccount', 'Create Account')}</Text>
                    <Text style={styles.subtitle}>{t('signup.premiumNetwork', 'Join the premium network for genetic matching.')}</Text>

                    <View style={styles.formContainer}>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('signup.fullName', 'Full Name')}</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('signup.phoneNumber', 'Phone Number')}</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholder="Enter phone number"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('signup.email', 'Email (Optional)')}</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="Enter email"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('signup.sex', 'Gender')}</Text>
                            <View style={styles.genderContainer}>
                                <TouchableOpacity
                                    style={[styles.genderButton, sex === 'MALE' && styles.genderButtonActive]}
                                    onPress={() => setSex('MALE')}
                                >
                                    <Text style={[styles.genderText, sex === 'MALE' && styles.genderTextActive]}>
                                        Male
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.genderButton, sex === 'FEMALE' && styles.genderButtonActive]}
                                    onPress={() => setSex('FEMALE')}
                                >
                                    <Text style={[styles.genderText, sex === 'FEMALE' && styles.genderTextActive]}>
                                        Female
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('signup.district', 'District')}</Text>
                            <TextInput
                                style={styles.input}
                                value={district}
                                onChangeText={setDistrict}
                                placeholder="Enter district"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('signup.sector', 'Sector')}</Text>
                            <TextInput
                                style={styles.input}
                                value={sector}
                                onChangeText={setSector}
                                placeholder="Enter sector"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('signup.cell', 'Cell')}</Text>
                            <TextInput
                                style={styles.input}
                                value={cell}
                                onChangeText={setCell}
                                placeholder="Enter cell"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('signup.village', 'Village')}</Text>
                            <TextInput
                                style={styles.input}
                                value={village}
                                onChangeText={setVillage}
                                placeholder="Enter village"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('signup.password', 'Password')}</Text>
                            <View style={styles.passwordInputWrapper}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholder="Enter password"
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity 
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons 
                                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                        size={20} 
                                        color="#666" 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthRow}>
                                <Text style={[styles.strengthText, { color: passwordStrength > 0.6 ? '#4ADE80' : '#888' }]}> 
                                    {passwordStrength > 0.6 ? t('signup.strong', 'Strong') : t('signup.weak', 'Weak')}
                                </Text>
                                <Text style={styles.strengthLabel}>{t('signup.passwordStrength', 'Password Strength')}</Text>
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

                    <TouchableOpacity 
                        style={[styles.createAccountButton, loading && styles.buttonDisabled]} 
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.createAccountText}>{t('signup.createAccount', 'Create Account')}</Text>
                        )}
                    </TouchableOpacity>

                    {/* ── Debug stamp ── */}
                    <Text style={styles.debugStamp}>
                        {BUNDLE_VERSION} · loc:{locationGranted ? '✅' : '❌'}
                    </Text>

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
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    genderButtonActive: {
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    genderText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    genderTextActive: {
        color: '#22C55E',
        fontWeight: 'bold',
    },
    passwordInputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    debugStamp: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.35)',
        fontSize: 10,
        fontFamily: 'monospace',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
});
