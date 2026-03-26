import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Dimensions, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAnimal, Animal, getSpeciesLabel } from '../../services/animals';

const PRIMARY      = '#ec5b13';
const BG           = '#221610';
const CARD_BG      = 'rgba(255,255,255,0.04)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const TEXT         = '#f1f5f9';
const TEXT_MUTED   = '#94a3b8';

const { width } = Dimensions.get('window');

// ── helpers ──────────────────────────────────────────────────────────────────

function calcAge(birthDate?: string): string {
    if (!birthDate) return '—';
    const ms    = Date.now() - new Date(birthDate).getTime();
    const years = ms / (1000 * 60 * 60 * 24 * 365.25);
    if (years < 1) return `${Math.floor(years * 12)} months`;
    return `${years.toFixed(1)} years`;
}

function statusColor(status?: string): string {
    switch (status) {
        case 'PREGNANT': return '#f59e0b';
        case 'DECEASED': return '#ef4444';
        case 'SOLD':     return '#6366f1';
        default:         return '#22c55e';
    }
}

// ── sub-components ────────────────────────────────────────────────────────────

function MetaCard({ label, icon, value }: { label: string; icon: string; value: string }) {
    return (
        <View style={styles.metaCard}>
            <MaterialIcons name={icon as any} size={20} color={PRIMARY} />
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue} numberOfLines={2}>{value}</Text>
        </View>
    );
}

function ParentCard({
    label, animal, parentId, onPress,
}: {
    label: string;
    animal?: Animal | null;
    parentId?: string;
    onPress?: () => void;
}) {
    const hasData = !!animal;
    const name    = animal?.name ?? (parentId ? `#${parentId.slice(-6)}` : 'Unknown');

    return (
        <TouchableOpacity
            style={[styles.parentCard, !hasData && { opacity: 0.5 }]}
            onPress={hasData ? onPress : undefined}
            activeOpacity={hasData ? 0.8 : 1}
        >
            <View style={styles.parentAvatar}>
                {animal?.profilePhoto ? (
                    <Image source={{ uri: animal.profilePhoto }} style={styles.parentAvatarImg} contentFit="cover" />
                ) : (
                    <MaterialIcons
                        name={label === 'MOTHER' ? 'female' : 'male'}
                        size={24}
                        color={PRIMARY + '88'}
                    />
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.parentLabel}>{label}</Text>
                <Text style={styles.parentName} numberOfLines={1}>{name}</Text>
                {animal?.specie && (
                    <Text style={styles.parentSub} numberOfLines={1}>{getSpeciesLabel(animal.specie)}</Text>
                )}
            </View>
            {hasData && <MaterialIcons name="chevron-right" size={18} color={TEXT_MUTED} />}
        </TouchableOpacity>
    );
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function AnimalDetailScreen() {
    const router          = useRouter();
    const { id }          = useLocalSearchParams<{ id: string }>();
    const [animal, setAnimal]   = useState<Animal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!id) { setError('No animal ID'); setLoading(false); return; }
        setLoading(true);
        setError(null);
        getAnimal(id)
            .then(setAnimal)
            .catch(e => {
                const status = e?.response?.status;
                if (status === 503 || status === 502 || status === 504) {
                    setError('Server is starting up. Please try again in a moment.');
                } else if (!e?.response) {
                    setError('Network error — check your connection.');
                } else {
                    setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load animal');
                }
            })
            .finally(() => setLoading(false));
    }, [id, retryCount]);

    // ── loading / error states ─────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={PRIMARY} />
            </View>
        );
    }

    if (error || !animal) {
        return (
            <View style={styles.center}>
                <MaterialIcons name="error-outline" size={52} color="#ef4444" />
                <Text style={styles.errorText}>{error ?? 'Animal not found'}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => setRetryCount(c => c + 1)}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── derived display values ─────────────────────────────────────────────
    const name        = animal.name ?? `Animal #${animal.animalId.slice(-6)}`;
    const species     = getSpeciesLabel(animal.specie);
    const age         = calcAge(animal.birthDate);
    const sex         = animal.sex === 'MALE' ? 'Male' : 'Female';
    const sexIcon     = animal.sex === 'MALE' ? 'male' : 'female';
    const confidence  = Math.round((animal.breed_confidence ?? 0) * 100);
    const sColor      = statusColor(animal.status);
    const initials    = animal.name ? animal.name.slice(0, 2).toUpperCase() : animal.type[0] + '?';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />

            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color={TEXT} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Animal Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero ──────────────────────────────────────────────── */}
                <View style={styles.hero}>
                    <View style={styles.avatarRing}>
                        {animal.profilePhoto ? (
                            <Image
                                source={{ uri: animal.profilePhoto }}
                                style={styles.avatarImg}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitials}>{initials}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.animalName}>{name}</Text>
                    <Text style={styles.animalSpecies}>{species}</Text>

                    <View style={[styles.statusPill, { backgroundColor: sColor + '22', borderColor: sColor + '55' }]}>
                        <View style={[styles.statusDot, { backgroundColor: sColor }]} />
                        <Text style={[styles.statusText, { color: sColor }]}>
                            {animal.status ?? 'ALIVE'}
                        </Text>
                    </View>
                </View>

                {/* ── Meta grid ─────────────────────────────────────────── */}
                <View style={styles.metaGrid}>
                    <MetaCard label="Sex"    icon={sexIcon}       value={sex} />
                    <MetaCard label="Age"    icon="event-note"    value={age} />
                    <MetaCard label="Breed"  icon="pets"          value={species} />
                    <MetaCard label="Conf."  icon="verified"      value={`${confidence}%`} />
                </View>

                {/* ── Details card ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    <View style={styles.detailsCard}>
                        <DetailRow label="ID"       value={animal.animalId} />
                        <DetailRow label="Type"     value={animal.type} />
                        {animal.birthDate && (
                            <DetailRow
                                label="Born"
                                value={new Date(animal.birthDate).toLocaleDateString()}
                            />
                        )}
                        <DetailRow
                            label="Recommendable"
                            value={animal.recommendable ? 'Yes' : 'No'}
                            highlight={animal.recommendable}
                        />
                        {animal.breed_confidence !== undefined && (
                            <DetailRow
                                label="Breed Confidence"
                                value={`${confidence}%`}
                            />
                        )}
                    </View>
                </View>

                {/* ── Lineage ───────────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Lineage</Text>
                    <View style={styles.lineageRow}>
                        <ParentCard
                            label="MOTHER"
                            animal={animal.mother}
                            parentId={animal.motherId}
                            onPress={() => animal.mother && router.push(`/animal/${animal.mother.animalId}` as any)}
                        />
                        <ParentCard
                            label="FATHER"
                            animal={animal.father}
                            parentId={animal.fatherId}
                            onPress={() => animal.father && router.push(`/animal/${animal.father.animalId}` as any)}
                        />
                    </View>
                </View>

                {/* ── Action ────────────────────────────────────────────── */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.perfBtn}
                        onPress={() => router.push('/(tabs)/animal-performance' as any)}
                    >
                        <MaterialIcons name="bar-chart" size={20} color={BG} />
                        <Text style={styles.perfBtnText}>View Performance</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({
    label, value, highlight,
}: {
    label: string; value: string; highlight?: boolean;
}) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, highlight && { color: PRIMARY }]}>{value}</Text>
        </View>
    );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    center: {
        flex: 1,
        backgroundColor: BG,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
        padding: 24,
    },
    errorText:   { color: '#ef4444', fontSize: 15, textAlign: 'center' },
    retryBtn: {
        marginTop: 8,
        backgroundColor: PRIMARY,
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 999,
    },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    backBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    backBtnText: { color: '#94a3b8', fontWeight: '600' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: GLASS_BORDER,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: CARD_BG,
        borderWidth: 1, borderColor: GLASS_BORDER,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },

    scroll: { paddingBottom: 40 },

    hero: {
        alignItems: 'center',
        paddingTop: 28,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    avatarRing: {
        width: 120, height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: PRIMARY + '55',
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: CARD_BG,
    },
    avatarImg:         { width: '100%', height: '100%' },
    avatarPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PRIMARY + '18',
    },
    avatarInitials: { fontSize: 36, fontWeight: '900', color: PRIMARY },
    animalName:     { fontSize: 26, fontWeight: '800', color: TEXT, textAlign: 'center' },
    animalSpecies:  { fontSize: 14, color: TEXT_MUTED, marginTop: 4, marginBottom: 12 },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
    },
    statusDot:  { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    metaCard: {
        width: (width - 52) / 2,
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 16,
        padding: 16,
        gap: 6,
    },
    metaLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    metaValue: { fontSize: 17, fontWeight: '800', color: TEXT },

    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: {
        fontSize: 16, fontWeight: '800', color: TEXT,
        marginBottom: 12, letterSpacing: -0.3,
    },

    detailsCard: {
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 16,
        overflow: 'hidden',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: GLASS_BORDER,
    },
    detailLabel: { fontSize: 14, color: TEXT_MUTED },
    detailValue: { fontSize: 14, fontWeight: '600', color: TEXT, maxWidth: '60%', textAlign: 'right' },

    lineageRow: { flexDirection: 'row', gap: 10 },
    parentCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 16,
        padding: 12,
    },
    parentAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: PRIMARY + '18',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    parentAvatarImg: { width: '100%', height: '100%' },
    parentLabel:  { fontSize: 9, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 1, textTransform: 'uppercase' },
    parentName:   { fontSize: 13, fontWeight: '700', color: TEXT, marginTop: 2 },
    parentSub:    { fontSize: 11, color: TEXT_MUTED, marginTop: 1 },

    perfBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: PRIMARY,
        borderRadius: 14,
        paddingVertical: 14,
    },
    perfBtnText: { fontSize: 15, fontWeight: '700', color: BG },
});
