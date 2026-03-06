import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { BUNDLE_VERSION } from '../../../constants/bundleVersion';

const { width } = Dimensions.get('window');

const GlassView = ({ children, style }: { children: React.ReactNode, style?: any }) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.glass, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder, borderWidth: 1 }, style]}>
            {children}
        </View>
    );
};

export default function GeneticsIndexScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const cards = [
        {
            title: 'Genetic Lineage',
            subtitle: 'View pedigree tree, ancestry & breed purity scores',
            icon: <MaterialCommunityIcons name="graph-outline" size={30} color="#11d41e" />,
            route: '/(tabs)/(genetics)/pedigree',
            tag: 'PEDIGREE',
        },
        {
            title: 'Lineage Verification',
            subtitle: 'Biometric DNA scan to verify parent-child relationships',
            icon: <MaterialCommunityIcons name="dna" size={30} color="#FFD700" />,
            route: '/(tabs)/(genetics)/lineage-verification',
            tag: 'BIOMETRIC',
            gold: true,
        },
        {
            title: 'Siamese Analysis',
            subtitle: 'AI-powered match probability & shared marker comparison',
            icon: <MaterialCommunityIcons name="atom" size={30} color="#11d41e" />,
            route: '/(tabs)/(genetics)/siamese-analysis',
            tag: 'AI MODEL',
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/home' as any)}
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headline}>Genetics</Text>
                    <Text style={styles.subHeadline}>Lineage, Verification & AI Analysis</Text>
                </View>
                <View style={[styles.dnaIconWrapper, { backgroundColor: 'rgba(17, 212, 30, 0.08)', borderColor: 'rgba(17, 212, 30, 0.2)' }]}>
                    <MaterialCommunityIcons name="dna" size={28} color="#11d41e" />
                </View>
            </View>

            {/* Cards */}
            <View style={styles.cardsList}>
                {cards.map((card, i) => (
                    <TouchableOpacity
                        key={i}
                        activeOpacity={0.8}
                        onPress={() => router.push(card.route as any)}
                    >
                        <GlassView style={[styles.card, card.gold && styles.cardGold]}>
                            {/* Glow */}
                            <View style={[styles.cardGlow, { backgroundColor: card.gold ? 'rgba(255, 215, 0, 0.04)' : 'rgba(17, 212, 30, 0.04)' }]} />

                            <View style={[styles.iconBox, { backgroundColor: card.gold ? 'rgba(255, 215, 0, 0.08)' : 'rgba(17, 212, 30, 0.08)', borderColor: card.gold ? 'rgba(255, 215, 0, 0.2)' : 'rgba(17, 212, 30, 0.2)' }]}>
                                {card.icon}
                            </View>

                            <View style={styles.cardBody}>
                                <View style={styles.cardTitleRow}>
                                    <Text style={styles.cardTitle}>{card.title}</Text>
                                    <View style={[styles.tagPill, { backgroundColor: card.gold ? 'rgba(255, 215, 0, 0.12)' : 'rgba(17, 212, 30, 0.12)' }]}>
                                        <Text style={[styles.tagText, { color: card.gold ? '#FFD700' : '#11d41e' }]}>{card.tag}</Text>
                                    </View>
                                </View>
                                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                            </View>

                            <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.3)" />
                        </GlassView>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bottom hint */}
            <Text style={styles.hint}>Powered by Siamese Neural Network · {BUNDLE_VERSION}</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#081209',
        paddingHorizontal: 20,
    },
    glass: {
        borderRadius: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 32,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        paddingHorizontal: 12,
    },
    headline: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subHeadline: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '500',
    },
    dnaIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    cardsList: {
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 20,
        gap: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    cardGold: {
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    cardGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    cardBody: {
        flex: 1,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
        flexWrap: 'wrap',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tagPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    tagText: {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    cardSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        lineHeight: 18,
    },
    hint: {
        position: 'absolute',
        bottom: 32,
        alignSelf: 'center',
        color: 'rgba(255,255,255,0.2)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
