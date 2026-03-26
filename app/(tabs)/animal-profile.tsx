import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAnimal, Animal, getSpeciesLabel } from '../../services/animals';

const PRIMARY = '#11d41e';
const BG_DARK = '#102211';
const GLASS_BG = 'rgba(255,255,255,0.03)';
const GLASS_BORDER = 'rgba(255,255,255,0.08)';
const SLATE_400 = 'rgba(148,163,184,1)';
const SLATE_500 = 'rgba(100,116,139,1)';

const { width } = Dimensions.get('window');

const Glass = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View style={[styles.glass, style]}>{children}</View>
);

function calcAge(birthDate?: string): string {
    if (!birthDate) return 'Unknown';
    const diff = Date.now() - new Date(birthDate).getTime();
    const years = diff / (1000 * 60 * 60 * 24 * 365.25);
    if (years < 1) return `${Math.floor(years * 12)} mo`;
    return `${years.toFixed(1)} yrs`;
}

// A simple circular progress indicator via a ring overlay
const BreedConfidenceCircle = ({ percent }: { percent: number }) => (
    <View style={styles.confidenceCircle}>
        <View style={styles.confidenceCircleInner}>
            <Text style={styles.confidenceCircleText}>{percent}%</Text>
        </View>
    </View>
);

export default function AnimalProfile() {
    const router = useRouter();
    const { animalId } = useLocalSearchParams<{ animalId: string }>();

    const [animal, setAnimal]   = useState<Animal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        if (!animalId) {
            setError('No animal ID provided');
            setLoading(false);
            return;
        }
        getAnimal(animalId)
            .then(setAnimal)
            .catch(e => setError(e.message ?? 'Failed to load animal'))
            .finally(() => setLoading(false));
    }, [animalId]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={PRIMARY} />
            </View>
        );
    }

    if (error || !animal) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 }]}>
                <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontSize: 15, textAlign: 'center' }}>
                    {error ?? 'Animal not found'}
                </Text>
                <TouchableOpacity onPress={() => router.navigate('/(tabs)/my-herd' as any)}>
                    <Text style={{ color: PRIMARY, fontSize: 14 }}>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const displayName   = animal.name ?? `Animal #${animal.animalId.slice(-6)}`;
    const speciesLabel  = getSpeciesLabel(animal.specie);
    const confidence    = Math.round((animal.breed_confidence ?? 0) * 100);
    const age           = calcAge(animal.birthDate);
    const sexLabel      = animal.sex === 'MALE' ? 'Male' : 'Female';
    const sexIcon       = animal.sex === 'MALE' ? 'male' : 'female';

    return (
        <View style={styles.container}>
            {/* Top Navigation */}
            <View style={styles.nav}>
                <View style={styles.navLeft}>
                    <TouchableOpacity style={styles.navIconBtn} onPress={() => router.navigate('/(tabs)/my-herd' as any)}>
                        <MaterialIcons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>Animal Profile</Text>
                </View>
                <View style={styles.navRight}>
                    <View style={styles.matchBadge}>
                        <MaterialIcons name="verified" size={14} color={PRIMARY} />
                        <Text style={styles.matchBadgeText}>MATCHING READY</Text>
                    </View>
                    <TouchableOpacity style={styles.navIconBtn}>
                        <MaterialIcons name="more-vert" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarGlow} />
                        <View style={styles.avatarBorder}>
                            {animal.profilePhoto ? (
                                <Image source={{ uri: animal.profilePhoto }} style={styles.avatarImage} />
                            ) : (
                                <View style={[styles.avatarImage, { backgroundColor: 'rgba(17,212,30,0.1)', alignItems: 'center', justifyContent: 'center' }]}>
                                    <MaterialIcons name="pets" size={56} color={PRIMARY + '88'} />
                                </View>
                            )}
                        </View>
                        <View style={styles.checkBadge}>
                            <MaterialIcons name="check" size={14} color={BG_DARK} />
                        </View>
                    </View>

                    <Text style={styles.animalName}>{displayName}</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.aliveIndicator}>
                            <View style={styles.aliveDot} />
                            <Text style={styles.aliveText}>{animal.status ?? 'ALIVE'}</Text>
                        </View>
                        <Text style={styles.statusDot}>•</Text>
                        <Text style={styles.gradeText}>{speciesLabel}</Text>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.primaryActionBtn} onPress={() => router.push('/(tabs)/animal-performance' as any)}>
                            <MaterialIcons name="bar-chart" size={20} color={BG_DARK} />
                            <Text style={styles.primaryActionText}>Performance</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryActionBtn}>
                            <MaterialIcons name="edit" size={20} color="#fff" />
                            <Text style={styles.secondaryActionText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Metadata Grid */}
                <View style={styles.metaGrid}>
                    <Glass style={styles.metaCard}>
                        <Text style={styles.metaLabel}>SEX</Text>
                        <View style={styles.metaValue}>
                            <MaterialIcons name={sexIcon as any} size={20} color={PRIMARY} />
                            <Text style={styles.metaValueText}>{sexLabel}</Text>
                        </View>
                    </Glass>
                    <Glass style={styles.metaCard}>
                        <Text style={styles.metaLabel}>AGE</Text>
                        <View style={styles.metaValue}>
                            <MaterialIcons name="event-note" size={20} color={PRIMARY} />
                            <Text style={styles.metaValueText}>{age}</Text>
                        </View>
                    </Glass>
                    <Glass style={styles.metaCard}>
                        <Text style={styles.metaLabel}>SPECIE</Text>
                        <View style={styles.metaValue}>
                            <MaterialIcons name="pets" size={20} color={PRIMARY} />
                            <Text style={styles.metaValueText} numberOfLines={1}>{speciesLabel}</Text>
                        </View>
                    </Glass>
                    <Glass style={styles.metaCard}>
                        <Text style={styles.metaLabel}>BREED CONFIDENCE</Text>
                        <View style={styles.metaValue}>
                            <BreedConfidenceCircle percent={confidence} />
                            <Text style={styles.metaValueText}>{confidence}%</Text>
                        </View>
                    </Glass>
                </View>

                {/* Lineage Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialIcons name="account-tree" size={20} color={PRIMARY} />
                            <Text style={styles.sectionTitle}>Lineage</Text>
                        </View>
                    </View>

                    <View style={styles.parentsRow}>
                        {/* Mother */}
                        <TouchableOpacity
                            style={styles.parentCard}
                            activeOpacity={animal.mother ? 0.8 : 1}
                            onPress={animal.mother ? () => router.push({
                                pathname: '/(tabs)/animal-profile' as any,
                                params: { animalId: animal.mother!.animalId },
                            }) : undefined}
                        >
                            <View style={styles.parentAvatarWrapper}>
                                {animal.mother?.profilePhoto ? (
                                    <Image source={{ uri: animal.mother.profilePhoto }} style={styles.parentAvatar} />
                                ) : (
                                    <View style={[styles.parentAvatar, { backgroundColor: 'rgba(17,212,30,0.1)', alignItems: 'center', justifyContent: 'center' }]}>
                                        <MaterialIcons name="female" size={20} color={PRIMARY + '88'} />
                                    </View>
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.parentLabel}>MOTHER</Text>
                                <Text style={styles.parentName} numberOfLines={1}>
                                    {animal.mother?.name ?? (animal.motherId ? `#${animal.motherId.slice(-6)}` : 'Unknown')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Father */}
                        <TouchableOpacity
                            style={styles.parentCard}
                            activeOpacity={animal.father ? 0.8 : 1}
                            onPress={animal.father ? () => router.push({
                                pathname: '/(tabs)/animal-profile' as any,
                                params: { animalId: animal.father!.animalId },
                            }) : undefined}
                        >
                            <View style={styles.parentAvatarWrapper}>
                                {animal.father?.profilePhoto ? (
                                    <Image source={{ uri: animal.father.profilePhoto }} style={styles.parentAvatar} />
                                ) : (
                                    <View style={[styles.parentAvatar, { backgroundColor: 'rgba(17,212,30,0.1)', alignItems: 'center', justifyContent: 'center' }]}>
                                        <MaterialIcons name="male" size={20} color={PRIMARY + '88'} />
                                    </View>
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.parentLabel}>FATHER</Text>
                                <Text style={styles.parentName} numberOfLines={1}>
                                    {animal.father?.name ?? (animal.fatherId ? `#${animal.fatherId.slice(-6)}` : 'Unknown')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.navigate('/(tabs)/home' as any)}>
                    <MaterialIcons name="home" size={24} color={SLATE_400} />
                    <Text style={styles.navItemText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.navigate('/(tabs)/my-herd' as any)}>
                    <MaterialIcons name="groups" size={24} color={SLATE_400} />
                    <Text style={styles.navItemText}>Herd</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="account-tree" size={24} color={PRIMARY} />
                    <Text style={[styles.navItemText, { color: PRIMARY }]}>Breeding</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="person" size={24} color={SLATE_400} />
                    <Text style={styles.navItemText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_DARK,
    },
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        backgroundColor: GLASS_BG,
        borderBottomWidth: 1,
        borderBottomColor: GLASS_BORDER,
    },
    navLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    navRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(17,212,30,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(17,212,30,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    matchBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: PRIMARY,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    avatarWrapper: {
        position: 'relative',
        width: 144,
        height: 144,
    },
    avatarGlow: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 999,
        backgroundColor: 'rgba(17,212,30,0.2)',
        // React Native doesn't support CSS blur, so we simulate glow with opacity
    },
    avatarBorder: {
        width: 144,
        height: 144,
        borderRadius: 72,
        borderWidth: 4,
        borderColor: 'rgba(17,212,30,0.3)',
        overflow: 'hidden',
        backgroundColor: BG_DARK,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    checkBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: BG_DARK,
    },
    animalName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    aliveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    aliveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: PRIMARY,
    },
    aliveText: {
        fontSize: 12,
        fontWeight: '600',
        color: PRIMARY,
    },
    statusDot: {
        color: SLATE_400,
        fontSize: 12,
    },
    gradeText: {
        fontSize: 12,
        color: SLATE_400,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        maxWidth: 400,
        marginTop: 24,
    },
    primaryActionBtn: {
        flex: 1,
        height: 48,
        backgroundColor: PRIMARY,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryActionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: BG_DARK,
    },
    secondaryActionBtn: {
        flex: 1,
        height: 48,
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    secondaryActionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    glass: {
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 16,
    },
    metaCard: {
        width: (width - 44) / 2,
        padding: 16,
    },
    metaLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        color: SLATE_400,
        textTransform: 'uppercase',
    },
    metaValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    metaValueText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    confidenceCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BG_DARK,
    },
    confidenceCircleInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    confidenceCircleText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: PRIMARY,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    sectionAction: {
        fontSize: 13,
        fontWeight: '600',
        color: PRIMARY,
    },
    parentsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    parentCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 14,
        padding: 12,
    },
    parentAvatarWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: BG_DARK,
    },
    parentAvatar: {
        width: '100%',
        height: '100%',
        opacity: 0.85,
    },
    parentLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1,
        color: SLATE_400,
        textTransform: 'uppercase',
    },
    parentName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
    },
    offspringTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        color: SLATE_400,
        marginBottom: 12,
    },
    offspringList: {
        gap: 8,
    },
    calfRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 14,
        padding: 12,
    },
    calfIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(17,212,30,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calfInfo: {
        flex: 1,
    },
    calfName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    calfBorn: {
        fontSize: 11,
        color: SLATE_500,
        marginTop: 2,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: 'rgba(16,34,17,0.85)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 24,
        paddingTop: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    navItemText: {
        fontSize: 10,
        fontWeight: '500',
        color: SLATE_400,
    },
});
