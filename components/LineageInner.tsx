/**
 * lineage-inner.tsx  –  Full biometric screen
 * Loaded lazily by lineage-verification.tsx (the safe shell).
 * All heavy imports live here so any native-module or asset failure
 * shows as a visible error message rather than a grey blank screen.
 */
import React, { useState, Component } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Dimensions, Alert, ActivityIndicator,
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
import { useMLModel } from '../hooks/useMLModel';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const MODEL_ASSET = require('../assets/models/siamese_embedding.tflite');

// ─── Error boundary ────────────────────────────────────────────────────────────
class RenderErrorBoundary extends Component<
    { children: React.ReactNode },
    { error: string | null }
> {
    state = { error: null };
    static getDerivedStateFromError(e: any) { return { error: e?.message ?? String(e) }; }
    componentDidCatch(e: any, info: any) { console.error('[LineageInner] render error:', e, info); }
    render() {
        if (this.state.error) {
            const bv = require('../constants/bundleVersion').BUNDLE_VERSION;
            return (
                <View style={{ flex: 1, backgroundColor: '#100000', padding: 24, justifyContent: 'center' }}>
                    <Text style={{ color: '#ff5555', fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 10 }}>
                        ❌ RENDER ERROR
                    </Text>
                    <Text style={{ color: '#ffaaaa', fontSize: 11, fontFamily: 'monospace', lineHeight: 18 }}>
                        {this.state.error}
                    </Text>
                    <Text style={{ color: '#11d41e', fontSize: 10, fontFamily: 'monospace', marginTop: 16 }}>
                        BUNDLE: {bv}
                    </Text>
                </View>
            );
        }
        return this.props.children;
    }
}

// ─── Glass helper ────────────────────────────────────────────────────────────
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
    label: string; sublabel: string; uri: string | null;
    onPickGallery: () => void; onPickCamera: () => void;
    loading: boolean; result: string | null;
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

// ─── Main inner screen ────────────────────────────────────────────────────────
function LineageVerificationInner() {
    const router = useRouter();
    const { colors } = useTheme();

    const [uriA, setUriA] = useState<string | null>(null);
    const [uriB, setUriB] = useState<string | null>(null);
    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);
    const [resultA, setResultA] = useState<string | null>(null);
    const [resultB, setResultB] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [debugLines, setDebugLines] = useState<string[]>([]);

    const { runInferenceWithRetry, isReady, preparationError } = useMLModel(MODEL_ASSET, { preferAsync: true });
    const bundleVersion = require('../constants/bundleVersion').BUNDLE_VERSION;

    const addDebug = (line: string) => {
        const ts = new Date().toLocaleTimeString('en', { hour12: false });
        setDebugLines(prev => [`[${ts}] ${line}`, ...prev].slice(0, 40));
    };

    const requestPermission = async (type: 'camera' | 'gallery') => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            return status === 'granted';
        }
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
    };

    const pickImage = async (source: 'camera' | 'gallery'): Promise<string | null> => {
        const ok = await requestPermission(source);
        if (!ok) {
            Alert.alert('Permission denied', `Please allow access to ${source === 'camera' ? 'the camera' : 'your photo library'} in Settings.`);
            return null;
        }
        const opts: ImagePicker.ImagePickerOptions = {
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9,
        };
        const result = source === 'camera'
            ? await ImagePicker.launchCameraAsync(opts)
            : await ImagePicker.launchImageLibraryAsync(opts);
        if (!result.canceled && result.assets.length > 0) return result.assets[0].uri;
        return null;
    };

    const runSingleInference = async (uri: string): Promise<Float32Array> => {
        const { embedding, debug } = await runInferenceWithRetry(uri);
        addDebug(`embed dim:${debug.outputDim} norm:${debug.outputNorm.toFixed(4)} sample:[${debug.outputSample}]`);
        return embedding;
    };

    const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
        let dot = 0, nA = 0, nB = 0;
        for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; nA += a[i] * a[i]; nB += b[i] * b[i]; }
        return dot / (Math.sqrt(nA) * Math.sqrt(nB));
    };

    const handlePickA = async (source: 'camera' | 'gallery') => {
        const uri = await pickImage(source);
        if (!uri) return;
        setUriA(uri); setResultA(null);
    };
    const handlePickB = async (source: 'camera' | 'gallery') => {
        const uri = await pickImage(source);
        if (!uri) return;
        setUriB(uri); setResultB(null);
    };

    const handleAnalyze = async () => {
        if (!uriA || !uriB) { Alert.alert('Missing Images', 'Please select photos for both subjects.'); return; }
        if (!isReady) { Alert.alert('Model Loading', 'The AI model is still loading. Please wait.'); return; }
        setAnalyzing(true);
        try {
            setLoadingA(true); setLoadingB(true);
            const embeddingA = await runSingleInference(uriA);
            const embeddingB = await runSingleInference(uriB);
            const similarity = cosineSimilarity(embeddingA, embeddingB);
            let sqA = 0, sqB = 0;
            for (let i = 0; i < embeddingA.length; i++) sqA += embeddingA[i] * embeddingA[i];
            for (let i = 0; i < embeddingB.length; i++) sqB += embeddingB[i] * embeddingB[i];
            const normA = Math.sqrt(sqA), normB = Math.sqrt(sqB);
            addDebug(`normA:${normA.toFixed(4)} normB:${normB.toFixed(4)}`);
            addDebug(`RAW cosine: ${similarity.toFixed(6)}`);
            const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
            const matchScore = Math.round(sigmoid((similarity - 0.75) * 30) * 100);
            addDebug(`matchScore: ${matchScore}%`);
            setLoadingA(false); setLoadingB(false);
            setResultA(`norm:${normA.toFixed(3)}`); setResultB(`norm:${normB.toFixed(3)}`);
            await new Promise(r => setTimeout(r, 800));
            router.push({
                pathname: '/(tabs)/(genetics)/siamese-analysis' as any,
                params: { imageA: uriA, imageB: uriB, matchScore: String(matchScore) },
            });
        } catch (e: any) {
            Alert.alert('Analysis Failed', e.message ?? 'Unknown error. Please try again.');
        } finally {
            setAnalyzing(false); setLoadingA(false); setLoadingB(false);
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

                <SubjectSlot label="SUBJECT A" sublabel="Parent / Ancestor"
                    uri={uriA} loading={loadingA} result={resultA}
                    onPickGallery={() => handlePickA('gallery')} onPickCamera={() => handlePickA('camera')} />

                <View style={styles.vsContainer}>
                    <View style={styles.vsLine} />
                    <GlassView style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></GlassView>
                    <View style={styles.vsLine} />
                </View>

                <SubjectSlot label="SUBJECT B" sublabel="Child / Self"
                    uri={uriB} loading={loadingB} result={resultB}
                    onPickGallery={() => handlePickB('gallery')} onPickCamera={() => handlePickB('camera')} />

                {/* Analyze Button */}
                <TouchableOpacity
                    activeOpacity={0.85} onPress={handleAnalyze}
                    disabled={analyzing || !isReady}
                    style={[styles.analyzeButton, (!bothReady || analyzing || !isReady) && styles.analyzeButtonDim]}
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

                {/* Model status */}
                {!isReady && !preparationError && (
                    <View style={styles.modelStatus}>
                        <ActivityIndicator size="small" color="#11d41e" />
                        <Text style={styles.modelStatusText}>Loading biometric model…</Text>
                    </View>
                )}
                {preparationError && (
                    <View style={styles.modelStatus}>
                        <MaterialIcons name="error-outline" size={14} color="#ff4444" />
                        <Text style={[styles.modelStatusText, { color: '#ff4444' }]} numberOfLines={5}>
                            ❌ {preparationError}
                        </Text>
                    </View>
                )}

                {/* Bundle stamp */}
                <View style={styles.bundleStamp}>
                    <Text style={styles.bundleStampText}>BUNDLE: {bundleVersion}</Text>
                </View>

                {/* Debug panel */}
                <TouchableOpacity style={styles.debugToggle} onPress={() => setShowDebug(v => !v)}>
                    <MaterialIcons name="bug-report" size={14} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.debugToggleText}>{showDebug ? 'Hide' : 'Show'} debug</Text>
                </TouchableOpacity>
                {showDebug && (
                    <View style={styles.debugPanel}>
                        <Text style={styles.debugTitle}>MODEL</Text>
                        <Text style={styles.debugRow}>bundle: {bundleVersion}</Text>
                        <Text style={styles.debugRow}>status: {isReady ? '✅ ready' : preparationError ? '❌ error' : '⏳ loading'}</Text>
                        <Text style={styles.debugRow}>strategy: react-native-fast-tflite</Text>
                        <Text style={styles.debugRow} numberOfLines={3}>shapes: float32:[1,224,224,3] → [1,512]</Text>
                        {debugLines.length > 0 && (
                            <>
                                <Text style={[styles.debugTitle, { marginTop: 8 }]}>INFERENCE LOG</Text>
                                {debugLines.map((line, i) => (<Text key={i} style={styles.debugRow}>{line}</Text>))}
                            </>
                        )}
                    </View>
                )}

                <Text style={styles.footerText}>HIGH FIDELITY MATCHING ENGINE · {bundleVersion}</Text>
                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#081209' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    glass: { borderRadius: 24 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    titleContainer: { alignItems: 'center', marginTop: 8, marginBottom: 28 },
    subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    hint: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
    subjectBlock: { marginBottom: 8 },
    subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 2 },
    subjectLabel: { color: '#11d41e', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
    subjectSubLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500' },
    uploadCard: { height: 200, borderColor: 'rgba(17,212,30,0.25)', borderWidth: 1, overflow: 'hidden', backgroundColor: 'rgba(17,212,30,0.04)' },
    emptySlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pickBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    pickBtn: { alignItems: 'center', gap: 8, padding: 12 },
    pickBtnLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
    pickDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
    previewImage: { width: '100%', height: '100%' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,18,9,0.7)', alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: '#11d41e', marginTop: 12, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    resultOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(8,18,9,0.85)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
    resultText: { color: '#11d41e', fontSize: 13, fontWeight: 'bold', flex: 1 },
    repickBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    scanLineBar: { height: 2, backgroundColor: '#11d41e', shadowColor: '#11d41e', shadowOpacity: 0.8, shadowRadius: 8 },
    vsContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
    vsLine: { width: 1, height: 16, backgroundColor: 'rgba(17,212,30,0.2)' },
    vsCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f1f10', borderColor: '#FFD700', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    vsText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
    analyzeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e3b854', gap: 10, borderRadius: 999, paddingVertical: 18, marginTop: 28, marginBottom: 16 },
    analyzeButtonDim: { opacity: 0.5 },
    analyzeButtonText: { color: '#081209', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    modelStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
    modelStatusText: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
    debugToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 6 },
    debugToggleText: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
    debugPanel: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    debugTitle: { color: '#11d41e', fontSize: 9, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 4 },
    debugRow: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontFamily: 'monospace', marginBottom: 2 },
    bundleStamp: { alignSelf: 'center', backgroundColor: 'rgba(17,212,30,0.12)', borderWidth: 1, borderColor: 'rgba(17,212,30,0.35)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
    bundleStampText: { color: '#11d41e', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, fontFamily: 'monospace' },
    footerText: { textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
});

export default function LineageInner() {
    return (
        <RenderErrorBoundary>
            <LineageVerificationInner />
        </RenderErrorBoundary>
    );
}
