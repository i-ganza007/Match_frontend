import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Dimensions, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat, withSequence,
    withTiming, Easing,
} from 'react-native-reanimated';
import { useMLModel } from '../../../hooks/useMLModel.native';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

// ─── ML Setup (Siamese network for embeddings) ─────────────────────────────
const MODEL_ASSET = require('../../../assets/models/livestock_biometric_float16.tflite');

// ─── Glass helper ───────────────────────────────────────────────────────────
const GlassView = ({ children, style, bright = false }: {
    children: React.ReactNode; style?: any; bright?: boolean;
}) => {
    const { colors, isDark } = useTheme();
    return (
        <View style={[
            styles.glass,
            {
                backgroundColor: bright
                    ? (isDark ? 'rgba(17,212,30,0.15)' : 'rgba(17,212,30,0.2)')
                    : colors.glassBackground,
                borderColor: bright
                    ? (isDark ? 'rgba(17,212,30,0.3)' : 'rgba(17,212,30,0.4)')
                    : colors.glassBorder,
                borderWidth: 1,
            },
            style,
        ]}>
            {children}
        </View>
    );
};

// ─── Animated scan line ──────────────────────────────────────────────────────
const ScanLine = ({ active }: { active: boolean }) => {
    const y = useSharedValue(0);
    React.useEffect(() => {
        if (active) {
            y.value = withRepeat(
                withSequence(
                    withTiming(180, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                ), -1, false,
            );
        }
    }, [active]);
    const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
    if (!active) return null;
    return (
        <Animated.View style={[StyleSheet.absoluteFill, style, { zIndex: 10 }]}>
            <View style={styles.scanLineBar} />
        </Animated.View>
    );
};

// ─── Subject slot ────────────────────────────────────────────────────────────
type SubjectSlotProps = {
    label: string;
    sublabel: string;
    uri: string | null;
    onPickGallery: () => void;
    onPickCamera: () => void;
    loading: boolean;
    result: string | null;
};

const SubjectSlot = ({ label, sublabel, uri, onPickGallery, onPickCamera, loading, result }: SubjectSlotProps) => (
    <View style={styles.subjectBlock}>
        <View style={styles.subjectHeader}>
            <Text style={styles.subjectLabel}>{label}</Text>
            <Text style={styles.subjectSubLabel}>{sublabel}</Text>
        </View>

        <GlassView style={styles.uploadCard}>
            {uri ? (
                <View style={{ width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden' }}>
                    <Image source={{ uri }} style={styles.previewImage} contentFit="cover" />
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ScanLine active />
                            <ActivityIndicator color="#11d41e" size="large" style={{ marginTop: 60 }} />
                            <Text style={styles.loadingText}>Analyzing...</Text>
                        </View>
                    )}
                    {result && !loading && (
                        <View style={styles.resultOverlay}>
                            <MaterialIcons name="check-circle" size={20} color="#11d41e" />
                            <Text style={styles.resultText}>{result}</Text>
                        </View>
                    )}
                    {/* Re-pick overlay button */}
                    {!loading && (
                        <TouchableOpacity style={styles.repickBtn} onPress={onPickGallery}>
                            <MaterialIcons name="edit" size={16} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View style={styles.emptySlot}>
                    <View style={styles.pickBtnRow}>
                        <TouchableOpacity style={styles.pickBtn} onPress={onPickCamera}>
                            <MaterialIcons name="camera-alt" size={24} color="#11d41e" />
                            <Text style={styles.pickBtnLabel}>Camera</Text>
                        </TouchableOpacity>
                        <View style={styles.pickDivider} />
                        <TouchableOpacity style={styles.pickBtn} onPress={onPickGallery}>
                            <MaterialIcons name="photo-library" size={24} color="#11d41e" />
                            <Text style={styles.pickBtnLabel}>Gallery</Text>
                        </TouchableOpacity>
                    </View>
                    <MaterialCommunityIcons name="dna" size={22} color="rgba(17,212,30,0.15)"
                        style={{ position: 'absolute', bottom: 12, right: 12 }} />
                </View>
            )}
        </GlassView>
    </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function LineageVerificationScreen() {
    const router = useRouter();
    const { colors } = useTheme();

    const [uriA, setUriA] = useState<string | null>(null);
    const [uriB, setUriB] = useState<string | null>(null);
    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);
    const [resultA, setResultA] = useState<string | null>(null);
    const [resultB, setResultB] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const { runInferenceWithRetry, isReady } = useMLModel(MODEL_ASSET);

    // ── helpers ──
    const requestPermission = async (type: 'camera' | 'gallery') => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            return status === 'granted';
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            return status === 'granted';
        }
    };

    const pickImage = async (source: 'camera' | 'gallery'): Promise<string | null> => {
        const ok = await requestPermission(source);
        if (!ok) {
            Alert.alert('Permission denied', `Please allow access to ${source === 'camera' ? 'the camera' : 'your photo library'} in Settings.`);
            return null;
        }
        const opts: ImagePicker.ImagePickerOptions = {
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        };
        const result = source === 'camera'
            ? await ImagePicker.launchCameraAsync(opts)
            : await ImagePicker.launchImageLibraryAsync(opts);

        if (!result.canceled && result.assets.length > 0) return result.assets[0].uri;
        return null;
    };

    const runSingleInference = async (uri: string): Promise<Float32Array> => {
        const embedding = await runInferenceWithRetry(uri);
        return embedding; // Returns 512-dim embedding vector
    };

    const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    // ── pick handlers ──
    const handlePickA = async (source: 'camera' | 'gallery') => {
        const uri = await pickImage(source);
        if (!uri) return;
        setUriA(uri);
        setResultA(null);
    };

    const handlePickB = async (source: 'camera' | 'gallery') => {
        const uri = await pickImage(source);
        if (!uri) return;
        setUriB(uri);
        setResultB(null);
    };

    // ── main analyze ──
    const handleAnalyze = async () => {
        if (!uriA || !uriB) {
            Alert.alert('Missing Images', 'Please select or capture photos for both subjects before analyzing.');
            return;
        }
        setAnalyzing(true);

        try {
            setLoadingA(true);
            setLoadingB(true);

            const [embeddingA, embeddingB] = await Promise.all([
                runSingleInference(uriA),
                runSingleInference(uriB),
            ]);

            const similarity = cosineSimilarity(embeddingA, embeddingB);
            const matchScore = Math.round(Math.max(0, Math.min(100, similarity * 100)));

            setLoadingA(false);
            setLoadingB(false);
            setResultA(`Embedding: ${embeddingA.length}D`);
            setResultB(`Embedding: ${embeddingB.length}D`);

            await new Promise(r => setTimeout(r, 800));

            router.push({
                pathname: '/(tabs)/(genetics)/siamese-analysis' as any,
                params: {
                    imageA: uriA,
                    imageB: uriB,
                    matchScore: String(matchScore),
                },
            });

        } catch (e: any) {
            Alert.alert('Analysis Failed', e.message ?? 'Unknown error. Please try again.');
        } finally {
            setAnalyzing(false);
            setLoadingA(false);
            setLoadingB(false);
        }
    };

    const bothReady = !!uriA && !!uriB;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="#fff" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Lineage Verification</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Subtitle */}
                <View style={styles.titleContainer}>
                    <Text style={styles.subtitle}>BIOMETRIC SCAN</Text>
                    <Text style={styles.title}>
                        <Text style={{ color: '#11d41e' }}>Analyze DNA </Text>
                        <Text style={{ color: '#FFD700' }}>Markers</Text>
                    </Text>
                    <Text style={styles.hint}>Upload or capture photos of both animals to begin</Text>
                </View>

                {/* Subject A */}
                <SubjectSlot
                    label="SUBJECT A"
                    sublabel="Parent / Ancestor"
                    uri={uriA}
                    loading={loadingA}
                    result={resultA}
                    onPickGallery={() => handlePickA('gallery')}
                    onPickCamera={() => handlePickA('camera')}
                />

                {/* VS separator */}
                <View style={styles.vsContainer}>
                    <View style={styles.vsLine} />
                    <GlassView style={styles.vsCircle}>
                        <Text style={styles.vsText}>VS</Text>
                    </GlassView>
                    <View style={styles.vsLine} />
                </View>

                {/* Subject B */}
                <SubjectSlot
                    label="SUBJECT B"
                    sublabel="Child / Self"
                    uri={uriB}
                    loading={loadingB}
                    result={resultB}
                    onPickGallery={() => handlePickB('gallery')}
                    onPickCamera={() => handlePickB('camera')}
                />

                {/* Analyze Button */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleAnalyze}
                    disabled={analyzing || !isReady}
                    style={[styles.analyzeButton, (!bothReady || analyzing) && styles.analyzeButtonDim]}
                >
                    {analyzing ? (
                        <ActivityIndicator color="#081209" size="small" />
                    ) : (
                        <>
                            <Text style={styles.analyzeButtonText}>
                                {!bothReady ? 'ADD BOTH PHOTOS TO ANALYZE' : 'ANALYZE RELATIONSHIP'}
                            </Text>
                            {bothReady && <MaterialCommunityIcons name="lightning-bolt" size={20} color="#081209" />}
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.footerText}>HIGH FIDELITY MATCHING ENGINE V2.4</Text>
                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#081209' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    glass: { borderRadius: 24 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, justifyContent: 'space-between',
    },
    backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Title
    titleContainer: { alignItems: 'center', marginTop: 8, marginBottom: 28 },
    subtitle: {
        color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 'bold',
        letterSpacing: 2, marginBottom: 8,
    },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    hint: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },

    // Subject block
    subjectBlock: { marginBottom: 8 },
    subjectHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10, paddingHorizontal: 2,
    },
    subjectLabel: { color: '#11d41e', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
    subjectSubLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500' },

    // Upload / preview card
    uploadCard: {
        height: 200,
        borderColor: 'rgba(17,212,30,0.25)', borderWidth: 1,
        overflow: 'hidden', position: 'relative',
        backgroundColor: 'rgba(17,212,30,0.04)',
    },
    emptySlot: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        position: 'relative',
    },
    pickBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    pickBtn: { alignItems: 'center', gap: 8, padding: 12 },
    pickBtnLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
    pickDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },

    // After picking
    previewImage: { width: '100%', height: '100%' },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8,18,9,0.7)',
        alignItems: 'center', justifyContent: 'center',
    },
    loadingText: { color: '#11d41e', marginTop: 12, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    resultOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(8,18,9,0.85)',
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingVertical: 10,
    },
    resultText: { color: '#11d41e', fontSize: 13, fontWeight: 'bold', flex: 1 },
    repickBtn: {
        position: 'absolute', top: 10, right: 10,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center', justifyContent: 'center',
    },

    // Scan line
    scanLineBar: {
        height: 2, backgroundColor: '#11d41e',
        shadowColor: '#11d41e', shadowOpacity: 0.8, shadowRadius: 8,
    },

    // VS
    vsContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
    vsLine: { width: 1, height: 16, backgroundColor: 'rgba(17,212,30,0.2)' },
    vsCircle: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#0f1f10',
        borderColor: '#FFD700', borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    vsText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },

    // Analyze button
    analyzeButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#e3b854', gap: 10,
        borderRadius: 999, paddingVertical: 18, marginTop: 28, marginBottom: 16,
    },
    analyzeButtonDim: { opacity: 0.5 },
    analyzeButtonText: { color: '#081209', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

    footerText: {
        textAlign: 'center', color: 'rgba(255,255,255,0.25)',
        fontSize: 10, fontWeight: 'bold', letterSpacing: 2,
    },
});
