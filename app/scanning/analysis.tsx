import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { useMLModel } from '../../hooks/useMLModel.native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getScanImageUri } from '../../services/scanStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';


const { width } = Dimensions.get('window');

// Labels sorted as per model training (must match BREED_LABELS in register-animal.tsx)
const LABELS = [
    'brown_swiss_cow',
    'dorper_sheep',
    'duroc_pig',
    'fresian_cow',
    'girolando_cow',
    'indigenous_ankole_cow',
    'indigenous_goat',
    'indigenous_pig',
    'jersey_cow',
    'landrace_pig',
    'large_white_pig',
    'merino_sheep',
    'pietrain_pig',
    'sahiwal_cow',
] as const;

// Maps model label → AnimalSpecies + AnimalType (same as in register-animal.tsx)
const LABEL_MAP: Record<string, { species: string; type: string; displayLabel: string }> = {
    brown_swiss_cow:       { type: 'COW',   species: 'BROWN_SWISS_COW',  displayLabel: 'Brown Swiss Cow'  },
    dorper_sheep:          { type: 'SHEEP', species: 'MERINO_SHEEP',      displayLabel: 'Dorper Sheep'     },
    duroc_pig:             { type: 'PIG',   species: 'DUROC_PIG',         displayLabel: 'Duroc Pig'        },
    fresian_cow:           { type: 'COW',   species: 'FREISIAN_COW',      displayLabel: 'Friesian Cow'     },
    girolando_cow:         { type: 'COW',   species: 'GIROLANDO_COW',     displayLabel: 'Girolando Cow'    },
    indigenous_ankole_cow: { type: 'COW',   species: 'ANKOLE_COW',        displayLabel: 'Ankole Cow'       },
    indigenous_goat:       { type: 'GOAT',  species: 'LOCAL_GOAT',        displayLabel: 'Local Goat'       },
    indigenous_pig:        { type: 'PIG',   species: 'DUROC_PIG',         displayLabel: 'Indigenous Pig'   },
    jersey_cow:            { type: 'COW',   species: 'JERSEY_COW',        displayLabel: 'Jersey Cow'       },
    landrace_pig:          { type: 'PIG',   species: 'LARGE_WHITE_PIG',   displayLabel: 'Landrace Pig'     },
    large_white_pig:       { type: 'PIG',   species: 'LARGE_WHITE_PIG',   displayLabel: 'Large White Pig'  },
    merino_sheep:          { type: 'SHEEP', species: 'MERINO_SHEEP',      displayLabel: 'Merino Sheep'     },
    pietrain_pig:          { type: 'PIG',   species: 'LARGE_WHITE_PIG',   displayLabel: 'Pietrain Pig'     },
    sahiwal_cow:           { type: 'COW',   species: 'HOLSTEIN_COW',      displayLabel: 'Sahiwal Cow'      },
};

const GlassBadge = ({ children, style }: { children: React.ReactNode, style?: any }) => (
    <View style={[styles.glassBadge, style]}>
        <View style={styles.badgeDot} />
        {children}
    </View>
);

// Single require so Metro bundles the asset; path works in dev and production
const MODEL_ASSET = require('../../assets/models/livestock_mobile_vnet_final.tflite');

export default function AnalysisScreen() {
    const router = useRouter();
    const { autoStart } = useLocalSearchParams();
    // Use scanStore to avoid expo-router double-encoding file:// URIs
    const imageUri = getScanImageUri() ?? undefined;
    const autoStartParam = Array.isArray(autoStart) ? autoStart[0] : autoStart;
    const [status, setStatus] = useState('Initializing AI...');
    const [progressText, setProgressText] = useState('0');
    const [hasStarted, setHasStarted] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>('');


    // Lifecycle logging
    useEffect(() => {
        console.log('--- AnalysisScreen DID MOUNT ---');
        console.log('🖼️ Image param:', imageUri);
        console.log('▶️ AutoStart param:', autoStartParam);
        return () => {
            console.log('--- AnalysisScreen WILL UNMOUNT ---');
        };
    }, []);

    const scanLineY = useSharedValue(0);
    const progress = useSharedValue(0);

    const { runInferenceWithRetry, state, isReady, preparationError } = useMLModel(MODEL_ASSET);

    useEffect(() => {
        const info = `Model: ${state} | Ready: ${isReady} | Error: ${preparationError || 'none'}`;
        setDebugInfo(info);
        console.log('📊 Model Status:', state);
        console.log('📦 Model available:', state === 'loaded');
        console.log('🚀 Model fully ready:', isReady);
        
        scanLineY.value = withRepeat(
            withTiming(260, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, [state, isReady]);

    const runInference = async () => {
        if (hasStarted || status === 'Analyzing...') {
            console.log('⚠️ Inference already running, skipping...');
            return;
        }

        try {
            console.log('--- STARTING REAL TFLITE INFERENCE ---');
            setHasStarted(true);
            setStatus('Loading Model...');
            progress.value = withTiming(0.3, { duration: 500 });
            setProgressText('30');

            if (!imageUri || typeof imageUri !== 'string') throw new Error('No image provided');

            // Check if TFLite model is ready
            if (state !== 'loaded') {
                console.log('⚠️ TFLite model not available, using fallback');
                console.log('📊 Current model state:', state);
                throw new Error('TFLite model not loaded');
            }

            console.log('✅ TFLite model loaded successfully');
            setStatus('Preprocessing Image...');
            progress.value = withTiming(0.5, { duration: 400 });
            setProgressText('50');

            console.log('🧠 Running real TFLite inference with Skia preprocessing...');
            
            setStatus('Running TFLite Inference...');
            progress.value = withTiming(0.7, { duration: 400 });
            setProgressText('70');
            
            // runInferenceWithRetry returns { embedding, debug }
            // For the breed model the "embedding" is actually the 14-class output vector
            const { embedding: logits, debug: inferDebug } = await runInferenceWithRetry(imageUri);
            console.log('📊 Breed inference debug:', JSON.stringify(inferDebug));

            if (!logits || logits.length === 0) {
                throw new Error('Invalid inference result: empty output');
            }

            console.log(`[Analysis] Output dim: ${logits.length}, expected: ${LABELS.length}`);
            if (logits.length !== LABELS.length) {
                console.warn(`[Analysis] ⚠️ Dim mismatch — model gave ${logits.length}, expected ${LABELS.length}. Using best-effort argmax.`);
            }

            // Softmax → proper probability (works for any output dim)
            let maxLogit = -Infinity;
            for (let i = 0; i < logits.length; i++) if (logits[i] > maxLogit) maxLogit = logits[i];
            const exps = Array.from(logits).map(l => Math.exp(l - maxLogit));
            const sumExp = exps.reduce((a, b) => a + b, 0);
            let maxProb = -Infinity, maxIndex = 0;
            for (let i = 0; i < exps.length; i++) {
                const p = exps[i] / sumExp;
                if (p > maxProb) { maxProb = p; maxIndex = i; }
            }

            const rawLabel: string | undefined = LABELS[maxIndex as number];
            const mapped = rawLabel ? LABEL_MAP[rawLabel] : undefined;
            const breedName = mapped?.displayLabel
                ?? (rawLabel ? rawLabel.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : `Class ${maxIndex}`)
            const confidence = Math.round(maxProb * 100);

            console.log(`🐄 Top label: ${rawLabel} → ${breedName} (${confidence}% confidence)`);
            setStatus('Classification Complete!');
            progress.value = withTiming(1, { duration: 500 });
            setProgressText('100');

            setTimeout(() => {
                // image URI is already in scanStore — no need to pass it as a param
                router.replace({
                    pathname: '/scanning/result',
                    params: {
                        breed: breedName,
                        confidence,
                        animalType: mapped?.type ?? '',
                        species: mapped?.species ?? '',
                    }
                } as any);
            }, 1000);

        } catch (e: any) {
            console.error('❌ TFLite inference error:', e.message);
            console.error('Stack:', e.stack);
            const errorMsg: string = e.message ?? 'Unknown inference error';
            setDebugInfo(`ERROR: ${errorMsg}`);
            setStatus('Failed: ' + errorMsg.substring(0, 40));
            setHasStarted(false); // allow retry
        }
    };

    // Redirect if no image in store after a tick
    useEffect(() => {
        const t = setTimeout(() => {
            if (!imageUri) {
                console.warn('No image in scanStore on analysis screen – redirecting back');
                router.replace('/(tabs)/breed-camera' as any);
            }
        }, 100);
        return () => clearTimeout(t);
    }, [imageUri]);

    // Auto-start inference when image is provided and model is ready
    useEffect(() => {
        if (!imageUri || typeof imageUri !== 'string') return;

        if (autoStartParam === 'true' && !hasStarted && isReady) {
            console.log('Model ready, auto-starting inference immediately...');
            const timer = setTimeout(() => {
                console.log('🎬 Triggering runInference now...');
                runInference();
            }, 500); // Small delay for UI to settle
            return () => {
                console.log('🧹 Cleaning up auto-start timer');
                clearTimeout(timer);
            };
        } else if (autoStartParam === 'true' && !hasStarted && !isReady) {
            console.log('⏳ Waiting for model to be ready...', { autoStart: autoStartParam, hasStarted, isReady });
        } else {
            console.log('⏸️ Not auto-starting:', { autoStart: autoStartParam, hasStarted, isReady });
        }
    }, [imageUri, autoStartParam, hasStarted, isReady]);

    const scanLineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanLineY.value }],
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#081209', '#0d1a0d', '#081209']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerLabel}>GENETIC MATCHER</Text>
                    <Text style={styles.headerTitle}>AI Analysis</Text>
                </View>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Scan Area */}
            <View style={styles.scanContainer}>
                {/* Status Badges */}
                <GlassBadge style={styles.badge1}>
                    <Text style={styles.badgeText}>{status}</Text>
                </GlassBadge>

                <GlassBadge style={styles.badge2}>
                    <Text style={styles.badgeText}>Neural Engine Probing...</Text>
                </GlassBadge>

                {/* Main Image Frame with AI Overlays */}
                <View style={styles.imageWrapper}>
                    {/* Corner Borders */}
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />

                    <Image
                        source={imageUri ? { uri: imageUri } : undefined}
                        style={styles.mainImage}
                        contentFit="cover"
                        cachePolicy="none"
                    />

                    {/* Animated Laser Scan Line */}
                    <Animated.View style={[styles.scanLine, scanLineStyle]}>
                        <LinearGradient
                            colors={['transparent', '#11d41e', 'transparent']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>

                    {/* Manual Trigger Overlay */}
                    {status === 'Initializing AI...' && !hasStarted && (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }]}>
                            <TouchableOpacity
                                style={{ backgroundColor: isReady ? '#11d41e' : '#666', padding: 16, borderRadius: 12, elevation: 5 }}
                                onPress={runInference}
                                disabled={!isReady}
                            >
                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16 }}>
                                    {isReady ? 'START AI SCAN' : 'LOADING MODEL...'}
                                </Text>
                            </TouchableOpacity>
                            {!isReady && (
                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8 }}>
                                    {preparationError ? `Model: ${preparationError}` : 'Preparing TensorFlow Lite model...'}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Progress Percentage Display */}
                    <View style={styles.percentageContainer}>
                        <Text style={styles.percentageText}>{progressText}</Text>
                        <Text style={styles.percentageSymbol}>%</Text>
                    </View>
                </View>

                {/* Debug Buttons */}
                <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
                    <TouchableOpacity
                        onPress={() => {
                            // image URI is in scanStore — no need to pass as param
                            router.replace({
                                pathname: '/scanning/result',
                                params: { breed: 'Sahiwal Cow (Debug)', confidence: 99 }
                            } as any);
                        }}
                        style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}
                    >
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>DEBUG: BYPASS AI</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.processingText}>PROBING KIGALI_GENOMIC_NODE</Text>
                
                {/* Debug Info Display */}
                <View style={{ marginTop: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8 }}>
                    <Text style={{ color: '#11d41e', fontSize: 10, fontFamily: 'monospace' }}>
                        {debugInfo}
                    </Text>
                </View>
            </View>

            {/* Bottom Progress UI */}
            <View style={styles.bottomSection}>
                <View style={styles.progressBarWrapper}>
                    <Animated.View style={[styles.progressBar, progressStyle]} />
                    <View style={styles.progressTrack} />
                </View>

                <Text style={styles.descriptionText}>
                    Using Rwanda-specific High-Yield genetic profiles to identify optimal breed matches for maximum farm productivity.
                </Text>

                <View style={styles.pillIndicator} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#081209',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    headerLabel: {
        color: '#11d41e',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    headerTitle: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 4,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    imageWrapper: {
        width: width * 0.7,
        height: width * 0.85,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(17, 212, 30, 0.2)',
    },
    mainImage: {
        width: '100%',
        height: '100%',
        opacity: 0.7,
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 2,
    },
    percentageContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    percentageText: {
        color: 'white',
        fontSize: 64,
        fontWeight: '900',
    },
    percentageSymbol: {
        color: '#11d41e',
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    glassBadge: {
        backgroundColor: 'rgba(16, 34, 17, 0.8)',
        borderColor: 'rgba(17, 212, 30, 0.3)',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#11d41e',
        marginRight: 10,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    badge1: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        marginRight: -20,
    },
    badge2: {
        alignSelf: 'flex-start',
        marginBottom: -40,
        marginLeft: -40,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#11d41e',
        zIndex: 5,
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 16 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 16 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 16 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 16 },
    processingText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 4,
        marginTop: 40,
    },
    bottomSection: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    progressBarWrapper: {
        height: 4,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginBottom: 20,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#11d41e',
        zIndex: 2,
    },
    progressTrack: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    descriptionText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    pillIndicator: {
        width: 60,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 30,
    }
});
