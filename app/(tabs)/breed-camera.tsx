import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

const GlassPanel = ({ children, style, className }: { children: React.ReactNode, style?: any, className?: string }) => (
    <View style={[styles.glassPanel, style]}>
        {children}
    </View>
);

export default function BreedCamera() {
    const router = useRouter();
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(true);

    // Animation values
    const scanLineY = useSharedValue(0);
    const pulseOpacity = useSharedValue(1);

    useEffect(() => {
        // Start scanning animation
        scanLineY.value = withRepeat(
            withTiming(280, { duration: 2000, easing: Easing.linear }),
            -1,
            false
        );

        pulseOpacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const scanLineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanLineY.value }],
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        opacity: pulseOpacity.value,
    }));

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
                    <Text style={styles.permButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <CameraView style={styles.camera} facing={facing}>
                {/* Dark Overlay Gradient simulation */}
                <View style={styles.gradientOverlay} />

                {/* Top Status Bar Area */}
                <View style={styles.topBar}>
                    <View style={styles.topBarLeft}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                            <MaterialIcons name="arrow-back-ios-new" size={20} color="rgba(255,255,255,0.9)" />
                        </TouchableOpacity>

                        <GlassPanel style={styles.statusPill}>
                            <Animated.View style={[styles.statusDot, pulseStyle]} />
                            <Text style={styles.statusText}>Live AI Detect</Text>
                        </GlassPanel>
                    </View>

                    <View style={styles.topBarRight}>
                        <TouchableOpacity style={styles.iconButton}>
                            <MaterialIcons name="flash-on" size={20} color="#2bee38" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <MaterialIcons name="settings" size={20} color="rgba(255,255,255,0.9)" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Floating Tip Context */}
                <View style={styles.tipContainer}>
                    <GlassPanel style={styles.tipBubble}>
                        <MaterialIcons name="lightbulb" size={16} color="#2bee38" />
                        <Text style={styles.tipText}>Ensure good lighting for better accuracy</Text>
                    </GlassPanel>
                </View>

                {/* Scanning Frame (Center) */}
                <View style={styles.scannerContainer}>
                    <View style={styles.scannerFrame}>
                        {/* Corners */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />

                        {/* Scanning Line */}
                        <Animated.View style={[styles.scanLine, scanLineStyle]} />

                        {/* Detection Label */}
                        <GlassPanel style={styles.detectionLabel}>
                            <Text style={styles.detectionHeading}>TARGET:</Text>
                            <Text style={styles.detectionValue}>Goat Detected 89%</Text>
                        </GlassPanel>
                    </View>
                </View>

                {/* Side Indicators */}
                <View style={styles.sideIndicators}>
                    <View style={styles.sideItem}>
                        <GlassPanel style={styles.sideIcon}>
                            <MaterialIcons name="straighten" size={24} color="rgba(43, 238, 56, 0.8)" />
                        </GlassPanel>
                        <Text style={styles.sideLabel}>MEASURE</Text>
                    </View>
                    <View style={styles.sideItem}>
                        <GlassPanel style={styles.sideIcon}>
                            <MaterialIcons name="history" size={24} color="rgba(255, 255, 255, 0.6)" />
                        </GlassPanel>
                        <Text style={styles.sideLabel}>HISTORY</Text>
                    </View>
                    <View style={styles.sideItem}>
                        <GlassPanel style={styles.sideIcon}>
                            <MaterialIcons name="analytics" size={24} color="rgba(255, 255, 255, 0.6)" />
                        </GlassPanel>
                        <Text style={styles.sideLabel}>GENETICS</Text>
                    </View>
                </View>

                {/* Bottom UI Controls */}
                <View style={styles.bottomControls}>
                    {/* Species Selector */}
                    <GlassPanel style={styles.speciesSelector}>
                        <TouchableOpacity style={styles.speciesBtn}>
                            <Text style={styles.speciesText}>Cow</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.speciesBtnActive}>
                            <Text style={styles.speciesTextActive}>Goat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.speciesBtn}>
                            <Text style={styles.speciesText}>Sheep</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.speciesBtn}>
                            <Text style={styles.speciesText}>Pig</Text>
                        </TouchableOpacity>
                    </GlassPanel>

                    <View style={styles.actionRow}>
                        {/* Gallery Preview */}
                        <TouchableOpacity style={styles.galleryPreview}>
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABpGd8_TkoKXqsqOt_psubeT1jsCR8B-ziz-WTpR9qCuB-8dTkpy84UmVdO8DyNTz08faFm8Fdgm1re7OOXCiCkZ_GJxzi51w4GRQIggWf6LKksJe3SR3rr7bhbwIOQd-p8D0291fblNFGXFHa2Boe_UavBOpli_1O4Cb0fdmfqsABBnC5LV1qtWSd14WrHqtfRUe1ofaliu6sTrQftVIebVkyki62PWNYg-MaWf40gOLA15j-zI9ZTc2i0YGfifMpp6JQoxVln7o' }}
                                style={styles.galleryImage}
                            />
                        </TouchableOpacity>

                        {/* Shutter Button */}
                        <View style={styles.shutterOuter}>
                            <TouchableOpacity style={styles.shutterInner} activeOpacity={0.8}>
                                <View style={styles.shutterCore}>
                                    <View style={styles.shutterIcon}>
                                        <MaterialCommunityIcons name="dna" size={24} color="#000" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Flip Camera */}
                        <TouchableOpacity style={styles.flipBtn} onPress={toggleCameraFacing}>
                            <MaterialIcons name="flip-camera-ios" size={24} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>

                    {/* Home Indicator Spacer */}
                    <View style={{ height: 20 }} />
                </View>

            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    camera: {
        flex: 1,
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: '#fff',
    },
    permButton: {
        backgroundColor: '#2bee38',
        padding: 12,
        borderRadius: 8,
        alignSelf: 'center',
    },
    permButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    glassPanel: {
        backgroundColor: 'rgba(16, 34, 17, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderRadius: 999, // default to pill shape
    },
    topBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        zIndex: 20,
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    topBarRight: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(16, 34, 17, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2bee38',
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tipContainer: {
        position: 'absolute',
        top: 100, // Adjust based on topBar
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
    },
    tipBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 8,
        gap: 8,
        borderColor: 'rgba(43, 238, 56, 0.2)',
    },
    tipText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        fontWeight: '500',
    },
    scannerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
    },
    scannerFrame: {
        width: width * 0.75,
        height: width * 0.85,
        position: 'relative',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(43, 238, 56, 0.5)',
        // box-shadow simulation handled by styles/elevation if needed, 
        // but simplistic border is fine for RN
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#2bee38',
    },
    cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
    cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
    cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
    cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(43, 238, 56, 0.6)',
        shadowColor: '#2bee38',
        shadowRadius: 10,
        shadowOpacity: 1,
        elevation: 5,
    },
    detectionLabel: {
        position: 'absolute',
        bottom: -20,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        gap: 8,
        borderColor: 'rgba(43, 238, 56, 0.3)',
    },
    detectionHeading: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    detectionValue: {
        color: '#2bee38',
        fontSize: 12,
        fontWeight: 'bold',
    },
    sideIndicators: {
        position: 'absolute',
        right: 24,
        top: '50%',
        transform: [{ translateY: -50 }],
        gap: 24,
        zIndex: 20,
        alignItems: 'center',
    },
    sideItem: {
        alignItems: 'center',
        gap: 4,
    },
    sideIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0, // reset
    },
    sideLabel: {
        fontSize: 8,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
        zIndex: 30,
        gap: 32,
    },
    speciesSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 6,
        borderRadius: 999,
    },
    speciesBtn: {
        paddingVertical: 10,
        flex: 1,
        alignItems: 'center',
    },
    speciesBtnActive: {
        paddingVertical: 10,
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#2bee38',
        borderRadius: 999,
        shadowColor: '#2bee38',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    speciesText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: '600',
    },
    speciesTextActive: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    galleryPreview: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    shutterOuter: {
        padding: 4,
        borderRadius: 999,
        borderColor: 'rgba(212, 175, 55, 0.4)', // Gold tint
        borderWidth: 2,
    },
    shutterInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterCore: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(43, 238, 56, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(43, 238, 56, 0.4)',
    },
    shutterIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2bee38',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flipBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(16, 34, 17, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
