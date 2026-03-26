import React from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getScanImageUri } from '../../services/scanStore';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { GlassView } from '../../components/GlassView';

const { width, height } = Dimensions.get('window');

const GeneticBar = ({ label, percentage, color = '#11d41e', subLabel }: { label: string, percentage: number, color?: string, subLabel?: string }) => (
    <View style={styles.geneticBarItem}>
        <View style={styles.geneticBarHeader}>
            <Text style={styles.geneticBarLabel}>{label}</Text>
            <Text style={[styles.geneticBarValue, { color }]}>{percentage}%</Text>
        </View>
        <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        {subLabel && <Text style={styles.geneticBarSub}>{subLabel}</Text>}
    </View>
);

const TraitBadge = ({ icon, label, type = 'default' }: { icon: string, label: string, type?: 'default' | 'premium' }) => (
    <View style={[styles.traitBadge, type === 'premium' && styles.traitBadgePremium]}>
        {type === 'premium' ? (
            <MaterialIcons name="verified" size={14} color="#EAB308" />
        ) : (
            <MaterialCommunityIcons name={icon as any} size={14} color="#11d41e" />
        )}
        <Text style={[styles.traitBadgeText, type === 'premium' && styles.traitBadgeTextPremium]}>{label}</Text>
    </View>
);

export default function ResultScreen() {
    const router = useRouter();
    const { breed, confidence, animalType, species } = useLocalSearchParams();

    const displayBreed = (breed as string) || 'Identifying...';
    const displayConfidence = parseInt(confidence as string) || 0;
    // Read from scanStore — avoids expo-router file:// URI encoding issues
    const displayImage = getScanImageUri();
    const detectedType = (animalType as string) || '';
    const detectedSpecies = (species as string) || '';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background Image with Overlay */}
            {displayImage ? (
                <Image
                    source={{ uri: displayImage }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="none"
                />
            ) : null}
            <LinearGradient
                colors={['rgba(8, 18, 9, 0.4)', 'rgba(8, 18, 9, 0.95)']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header Controls */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>

                <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>AI SCAN ACTIVE</Text>
                </View>

                <TouchableOpacity style={styles.iconBtn}>
                    <MaterialIcons name="stars" size={24} color="#EAB308" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Result Card */}
                <GlassView style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                        <View>
                            <Text style={styles.resultLabel}>RESULT IDENTIFIED</Text>
                            <Text style={styles.breedTitle}>{displayBreed}</Text>
                        </View>
                        <View style={styles.confidenceBox}>
                            <Text style={styles.confidenceValue}>{displayConfidence}<Text style={styles.percentageSymbol}>%</Text></Text>
                            <Text style={styles.confidenceLabel}>CONFIDENCE</Text>
                        </View>
                    </View>

                    <View style={styles.accuracySection}>
                        <View style={styles.accuracyHeader}>
                            <Text style={styles.accuracyLabel}>GENETIC ACCURACY</Text>
                            <Text style={styles.accuracyValue}>HIGH FIDELITY</Text>
                        </View>
                        <View style={styles.accuracyBarTrack}>
                            <LinearGradient
                                colors={['#11d41e', '#0b8a14']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.accuracyBarFill, { width: `${displayConfidence}%` }]}
                            />
                        </View>
                    </View>

                    <View style={styles.breakdownSection}>
                        <View style={styles.breakdownHeader}>
                            <MaterialIcons name="analytics" size={18} color="#EAB308" />
                            <Text style={styles.breakdownTitle}>GENETIC BREAKDOWN</Text>
                        </View>

                        <GeneticBar label={`${displayBreed} Purebred`} percentage={displayConfidence} />
                        <GeneticBar label="Regional Influence" percentage={100 - displayConfidence} color="rgba(255,255,255,0.3)" />
                    </View>

                    <View style={styles.traitsRow}>
                        <TraitBadge icon="leaf" label="High Milk Yield" />
                        <TraitBadge icon="terrain" label="Highland Suited" />
                        <TraitBadge icon="verified" label="Premium Pedigree" type="premium" />
                    </View>

                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={() => router.replace({
                            pathname: '/(tabs)/register-animal',
                            params: {
                                initialType: detectedType,
                                initialSpecies: detectedSpecies,
                                initialImage: displayImage,
                                initialConfidence: String(displayConfidence),
                            },
                        } as any)}
                    >
                        <Text style={styles.saveBtnText}>CONFIRM & SAVE TO HERD</Text>
                        <Ionicons name="arrow-forward" size={18} color="#000" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tryAgainBtn} onPress={() => router.back()}>
                        <Ionicons name="refresh" size={18} color="white" />
                        <Text style={styles.tryAgainText}>TRY AGAIN</Text>
                    </TouchableOpacity>

                    <Text style={styles.footerNote}>
                        AI ANALYSIS PROCESSED VIA RWANDAN GENOMIC{"\n"}DATABASE V4.2{"\n"}
                        RESULTS ARE 99.2% STATISTICALLY SIGNIFICANT.
                    </Text>
                </GlassView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        zIndex: 10,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 34, 17, 0.8)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(17, 212, 30, 0.4)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#11d41e',
    },
    statusText: {
        color: '#11d41e',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingTop: 100,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    resultCard: {
        padding: 24,
        borderRadius: 32,
        backgroundColor: 'rgba(16, 34, 17, 0.85)',
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    resultLabel: {
        color: '#11d41e',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    breedTitle: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 4,
    },
    confidenceBox: {
        alignItems: 'flex-end',
    },
    confidenceValue: {
        color: 'white',
        fontSize: 36,
        fontWeight: '900',
    },
    percentageSymbol: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.5)',
    },
    confidenceLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: -4,
    },
    accuracySection: {
        marginBottom: 32,
    },
    accuracyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    accuracyLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: 'bold',
    },
    accuracyValue: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    accuracyBarTrack: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    accuracyBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    breakdownSection: {
        marginBottom: 32,
    },
    breakdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    breakdownTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    geneticBarItem: {
        marginBottom: 16,
    },
    geneticBarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    geneticBarLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
    },
    geneticBarValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    barTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    traitsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 32,
    },
    traitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 212, 30, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(17, 212, 30, 0.2)',
    },
    traitBadgePremium: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderColor: 'rgba(234, 179, 8, 0.3)',
    },
    traitBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
    },
    traitBadgeTextPremium: {
        color: '#EAB308',
    },
    saveBtn: {
        backgroundColor: '#11d41e',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        shadowColor: '#11d41e',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    saveBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    tryAgainBtn: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 32,
    },
    tryAgainText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    geneticBarSub: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        marginTop: 4,
    },
    footerNote: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 16,
        letterSpacing: 1,
    }
});
