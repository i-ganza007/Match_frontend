import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { GlassView } from '../../components/GlassView';
import { getAllAnimals, Animal, AnimalType, getSpeciesLabel } from '../../services/animals';
import { BreedingRec } from '../../services/recommendations';
import SwipeRecsSheet from '../../components/SwipeRecsSheet';

const { width } = Dimensions.get('window');

// ── Accent colours ─────────────────────────────────────────────────────────────
const GREEN   = '#11d41e';
const ORANGE  = '#ec5b13';  // used only for matching/rec features

// ── Species filter ─────────────────────────────────────────────────────────────
const SPECIES = [
    { key: 'all',    label: 'All',   icon: 'grid-view'    as const, iconLib: 'material'  as const },
    { key: 'cattle', label: 'Cows',  icon: 'pets'         as const, iconLib: 'material'  as const },
    { key: 'goats',  label: 'Goats', icon: 'egg-outline'  as const, iconLib: 'community' as const },
    { key: 'sheep',  label: 'Sheep', icon: 'cloud'        as const, iconLib: 'material'  as const },
    { key: 'pigs',   label: 'Pigs',  icon: 'auto-awesome' as const, iconLib: 'material'  as const },
];

type PillKey = 'all' | 'cattle' | 'goats' | 'sheep' | 'pigs';

const PILL_TO_TYPE: Record<PillKey, AnimalType | null> = {
    all:    null,
    cattle: 'COW',
    goats:  'GOAT',
    sheep:  'SHEEP',
    pigs:   'PIG',
};

const TYPE_CONFIG: Record<AnimalType, {
    pillKey: PillKey;
    label: string;
    cardIcon: any;
    route: string;
}> = {
    COW:  { pillKey: 'cattle', label: 'Cows',  cardIcon: 'analytics',        route: '/(tabs)/cattle-herd'    },
    GOAT: { pillKey: 'goats',  label: 'Goats', cardIcon: 'medical-services', route: '/(tabs)/sheep-pig-herd' },
    SHEEP:{ pillKey: 'sheep',  label: 'Sheep', cardIcon: 'spatial-tracking', route: '/(tabs)/sheep-pig-herd' },
    PIG:  { pillKey: 'pigs',   label: 'Pigs',  cardIcon: 'monitoring',       route: '/(tabs)/sheep-pig-herd' },
};

interface HerdGroup {
    type: AnimalType;
    title: string;
    count: number;
    status: string;
    statusColor: string;
    image: string | null;
    icon: any;
    route: string;
    avatars: string[];
}

function statusColor(status?: string): string {
    switch (status) {
        case 'PREGNANT': return '#f59e0b';
        case 'DECEASED': return '#ef4444';
        case 'SOLD':     return '#6366f1';
        default:         return GREEN;
    }
}

function buildGroups(animals: Animal[]): HerdGroup[] {
    const buckets: Partial<Record<AnimalType, Animal[]>> = {};
    for (const a of animals) {
        if (!buckets[a.type]) buckets[a.type] = [];
        buckets[a.type]!.push(a);
    }
    return (Object.entries(buckets) as [AnimalType, Animal[]][])
        .filter(([, list]) => list.length > 0)
        .map(([type, list]) => {
            const cfg        = TYPE_CONFIG[type];
            const withPhoto  = list.find(a => a.profilePhoto);
            const hasPregnant= list.some(a => a.status === 'PREGNANT');
            const status     = hasPregnant ? 'Pregnant' : 'Healthy';
            const sColor     = hasPregnant ? '#f59e0b'  : GREEN;
            const shown      = list.slice(0, 2).map(a =>
                a.name ? a.name.slice(0, 2).toUpperCase() : type[0] + '?',
            );
            const rest    = list.length - shown.length;
            const avatars = rest > 0 ? [...shown, `+${rest}`] : shown;
            return {
                type, title: `Your ${cfg.label}`, count: list.length,
                status, statusColor: sColor,
                image: withPhoto?.profilePhoto ?? null,
                icon: cfg.cardIcon, route: cfg.route, avatars,
            };
        });
}

// ── Species pill ───────────────────────────────────────────────────────────────
function SpeciesPill({
    species, active, onPress,
}: { species: typeof SPECIES[number]; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[s.pill, active && s.pillActive]}
            activeOpacity={0.75}
        >
            {species.iconLib === 'community' ? (
                <MaterialCommunityIcons
                    name={species.icon as any}
                    size={15}
                    color={active ? '#081209' : 'rgba(255,255,255,0.4)'}
                />
            ) : (
                <MaterialIcons
                    name={species.icon as any}
                    size={15}
                    color={active ? '#081209' : 'rgba(255,255,255,0.4)'}
                />
            )}
            <Text style={[s.pillText, active && s.pillTextActive]}>{species.label}</Text>
        </TouchableOpacity>
    );
}

// ── Herd group card ────────────────────────────────────────────────────────────
function HerdCard({ item, onPress }: { item: HerdGroup; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1 }}>
            <GlassView style={s.herdCard}>
                {/* Watermark icon */}
                <MaterialIcons
                    name={item.icon}
                    size={80}
                    color="rgba(255,255,255,0.04)"
                    style={s.cardWatermark}
                />

                {/* Photo strip or placeholder */}
                {item.image ? (
                    <View style={s.cardPhotoWrap}>
                        <Image source={{ uri: item.image }} style={s.cardPhoto} contentFit="cover" />
                        <View style={s.cardPhotoOverlay} />
                    </View>
                ) : (
                    <View style={[s.cardPhotoWrap, s.cardPhotoPlaceholder]}>
                        <MaterialIcons name={item.icon} size={36} color={`${GREEN}33`} />
                    </View>
                )}

                {/* Status badge */}
                <View style={[s.statusBadge, { backgroundColor: item.statusColor + '28', borderColor: item.statusColor + '66' }]}>
                    <View style={[s.statusDot, { backgroundColor: item.statusColor }]} />
                    <Text style={[s.statusText, { color: item.statusColor }]}>{item.status}</Text>
                </View>

                {/* Info */}
                <Text style={s.herdCardTitle}>{item.title}</Text>
                <Text style={s.herdCardCount}>{item.count} animals</Text>

                {/* Footer */}
                <View style={s.herdCardFooter}>
                    <View style={s.avatarRow}>
                        {item.avatars.map((av, i) => (
                            <View key={i} style={[s.miniAvatar, { zIndex: 10 - i, marginLeft: i === 0 ? 0 : -8 }]}>
                                <Text style={s.miniAvatarText}>{av}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={s.viewLink}>
                        <Text style={s.viewLinkText}>View</Text>
                        <MaterialIcons name="arrow-forward" size={12} color={GREEN} />
                    </View>
                </View>
            </GlassView>
        </TouchableOpacity>
    );
}

// ── Individual animal card ─────────────────────────────────────────────────────
function AnimalCard({
    animal, onPress, onGetRecs,
}: { animal: Animal; onPress: () => void; onGetRecs: () => void }) {
    const initials = animal.name ? animal.name.slice(0, 2).toUpperCase() : animal.type[0] + '?';
    const color    = statusColor(animal.status);
    const canRec   = animal.recommendable;

    return (
        <GlassView style={s.animalCard}>
            <TouchableOpacity style={s.animalCardMain} onPress={onPress} activeOpacity={0.8}>
                {/* Avatar */}
                <View style={s.animalAvatarWrap}>
                    {animal.profilePhoto ? (
                        <Image source={{ uri: animal.profilePhoto }} style={s.animalAvatar} contentFit="cover" />
                    ) : (
                        <View style={[s.animalAvatar, s.animalAvatarFallback]}>
                            <Text style={s.animalInitials}>{initials}</Text>
                        </View>
                    )}
                    <View style={[s.onlineDot, { backgroundColor: color }]} />
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                    <Text style={s.animalName} numberOfLines={1}>
                        {animal.name ?? `#${animal.animalId.slice(-6)}`}
                    </Text>
                    <Text style={s.animalSub}>
                        {getSpeciesLabel(animal.specie)} · {animal.sex === 'MALE' ? 'Male' : 'Female'}
                    </Text>
                </View>

                {/* Status chip */}
                <View style={[s.statusChip, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                    <Text style={[s.statusChipText, { color }]}>
                        {animal.status ?? 'ALIVE'}
                    </Text>
                </View>

                <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>

            {/* Recommendations row */}
            <TouchableOpacity
                style={[s.recRow, !canRec && s.recRowDisabled]}
                onPress={canRec ? onGetRecs : undefined}
                activeOpacity={canRec ? 0.75 : 1}
            >
                <MaterialIcons name="auto-awesome" size={13} color={canRec ? ORANGE : 'rgba(255,255,255,0.2)'} />
                <Text style={[s.recRowText, !canRec && s.recRowTextDisabled]}>
                    {canRec ? 'Get Recommendations' : 'In active breeding'}
                </Text>
            </TouchableOpacity>
        </GlassView>
    );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function MyHerd() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [activeSpecies, setActiveSpecies]   = useState<PillKey>('all');
    const [animals, setAnimals]               = useState<Animal[]>([]);
    const [loading, setLoading]               = useState(true);
    const [recAnimal, setRecAnimal]           = useState<Animal | null>(null);
    const [recModalOpen, setRecModalOpen]     = useState(false);
    const [recsCache, setRecsCache]           = useState<Record<string, BreedingRec[]>>({});

    useFocusEffect(
        useCallback(() => {
            let active = true;
            setLoading(true);
            getAllAnimals()
                .then(data => { if (active) setAnimals(data); })
                .catch(console.error)
                .finally(() => { if (active) setLoading(false); });
            return () => { active = false; };
        }, [])
    );

    const groups         = buildGroups(animals);
    const filtered       = activeSpecies === 'all' ? groups : groups.filter(g => TYPE_CONFIG[g.type].pillKey === activeSpecies);
    const filteredAnimals= activeSpecies === 'all' ? animals : animals.filter(a => TYPE_CONFIG[a.type]?.pillKey === activeSpecies);
    const totalAnimals   = animals.length;
    const speciesCount   = groups.length;

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Header ── */}
                <View style={s.header}>
                    <GlassView style={s.headerLeft}>
                        <MaterialIcons name="grid-view" size={18} color={GREEN} />
                        <Text style={[s.headerTitle, { color: colors.text }]}>MY HERD</Text>
                    </GlassView>
                    <View style={s.headerRight}>
                        <TouchableOpacity style={s.iconBtn}>
                            <MaterialIcons name="search" size={20} color={colors.text} />
                        </TouchableOpacity>
                        <View style={s.iconBtnWrap}>
                            <TouchableOpacity style={s.iconBtn}>
                                <MaterialIcons name="notifications-none" size={20} color={colors.text} />
                            </TouchableOpacity>
                            {animals.length > 0 && <View style={s.notifDot} />}
                        </View>
                    </View>
                </View>

                {/* ── Species pills ── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.pillRow}
                >
                    {SPECIES.map(sp => (
                        <SpeciesPill
                            key={sp.key}
                            species={sp}
                            active={activeSpecies === sp.key}
                            onPress={() => setActiveSpecies(sp.key as PillKey)}
                        />
                    ))}
                </ScrollView>

                {/* ── Content ── */}
                {loading ? (
                    <View style={s.loadingWrap}>
                        <ActivityIndicator size="large" color={GREEN} />
                        <Text style={s.loadingText}>Loading your herd…</Text>
                    </View>
                ) : activeSpecies !== 'all' ? (
                    /* Individual animal list */
                    filteredAnimals.length === 0 ? (
                        <View style={s.emptyState}>
                            <View style={s.emptyIconWrap}>
                                <MaterialIcons name="pets" size={36} color={`${GREEN}66`} />
                            </View>
                            <Text style={[s.emptyTitle, { color: colors.text }]}>
                                No {SPECIES.find(sp => sp.key === activeSpecies)?.label ?? ''} yet
                            </Text>
                            <Text style={s.emptySub}>Register your first animal to get started</Text>
                            <TouchableOpacity
                                style={s.emptyBtn}
                                onPress={() => router.push('/(tabs)/register-animal' as any)}
                            >
                                <MaterialIcons name="add" size={16} color="#081209" />
                                <Text style={s.emptyBtnText}>Register Animal</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={s.animalList}>
                            {filteredAnimals.map(a => (
                                <AnimalCard
                                    key={a.animalId}
                                    animal={a}
                                    onPress={() => router.push(`/animal/${a.animalId}` as any)}
                                    onGetRecs={() => { setRecAnimal(a); setRecModalOpen(true); }}
                                />
                            ))}
                        </View>
                    )
                ) : (
                    /* Herd group cards */
                    filtered.length === 0 ? (
                        <View style={s.emptyState}>
                            <View style={s.emptyIconWrap}>
                                <MaterialIcons name="pets" size={36} color={`${GREEN}66`} />
                            </View>
                            <Text style={[s.emptyTitle, { color: colors.text }]}>No animals registered yet</Text>
                            <Text style={s.emptySub}>Add your first animal to start getting breeding matches</Text>
                            <TouchableOpacity
                                style={s.emptyBtn}
                                onPress={() => router.push('/(tabs)/register-animal' as any)}
                            >
                                <MaterialIcons name="add" size={16} color="#081209" />
                                <Text style={s.emptyBtnText}>Register Animal</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={s.cardGrid}>
                            {filtered.map((item, i) => {
                                const isOdd = filtered.length % 2 !== 0;
                                const isLast = i === filtered.length - 1;
                                if (isOdd && isLast) {
                                    return (
                                        <View key={item.type} style={{ width: '100%' }}>
                                            <HerdCard item={item} onPress={() => setActiveSpecies(TYPE_CONFIG[item.type].pillKey)} />
                                        </View>
                                    );
                                }
                                if (i % 2 === 0) {
                                    const next = filtered[i + 1];
                                    return (
                                        <View key={item.type} style={s.cardRow}>
                                            <HerdCard item={item} onPress={() => setActiveSpecies(TYPE_CONFIG[item.type].pillKey)} />
                                            {next && (
                                                <HerdCard key={next.type} item={next} onPress={() => setActiveSpecies(TYPE_CONFIG[next.type].pillKey)} />
                                            )}
                                        </View>
                                    );
                                }
                                return null;
                            })}
                        </View>
                    )
                )}

                {/* ── Quick Matches Map Banner ── */}
                {!loading && animals.length > 0 && (
                    <TouchableOpacity
                        style={s.mapBanner}
                        onPress={() => router.push('/(tabs)/quick-matches-map' as any)}
                        activeOpacity={0.85}
                    >
                        <View style={s.mapBannerIcon}>
                            <MaterialIcons name="my-location" size={20} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.mapBannerTitle, { color: colors.text }]}>Find Quick Matches Nearby</Text>
                            <Text style={s.mapBannerSub}>ML-scored breeding partners · GPS-powered</Text>
                        </View>
                        <View style={s.mapBannerArrow}>
                            <MaterialIcons name="arrow-forward" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                )}

                {/* ── Quick Stats ── */}
                {!loading && (
                    <View style={s.statsSection}>
                        <Text style={s.sectionLabel}>QUICK STATS</Text>
                        <View style={s.statsRow}>
                            {/* Total animals */}
                            <GlassView style={[s.statCard, { flex: 1 }]}>
                                <MaterialIcons name="grid-view" size={60} color="rgba(255,255,255,0.04)" style={s.statWatermark} />
                                <Text style={s.statCardLabel}>TOTAL ANIMALS</Text>
                                <View style={s.statCardRow}>
                                    <Text style={[s.statCardValue, { color: colors.text }]}>{String(totalAnimals).padStart(2, '0')}</Text>
                                    <Text style={s.statCardTrend}>HEAD</Text>
                                </View>
                            </GlassView>
                            {/* Species count */}
                            <GlassView style={[s.statCard, { flex: 1 }]}>
                                <MaterialIcons name="category" size={60} color="rgba(255,255,255,0.04)" style={s.statWatermark} />
                                <Text style={s.statCardLabel}>SPECIES</Text>
                                <View style={s.statCardRow}>
                                    <Text style={[s.statCardValue, { color: colors.text }]}>{String(speciesCount).padStart(2, '0')}</Text>
                                    <Text style={s.statCardSub}>types</Text>
                                </View>
                            </GlassView>
                        </View>

                        {/* Per-group stats */}
                        {groups.map(g => (
                            <View key={g.type} style={[s.statsRow, { marginTop: 12 }]}>
                                <GlassView style={[s.statCard, { flex: 1 }]}>
                                    <MaterialIcons name={TYPE_CONFIG[g.type].cardIcon} size={60} color="rgba(255,255,255,0.04)" style={s.statWatermark} />
                                    <Text style={s.statCardLabel}>{g.title.toUpperCase()}</Text>
                                    <View style={s.statCardRow}>
                                        <Text style={[s.statCardValue, { color: colors.text }]}>{String(g.count).padStart(2, '0')}</Text>
                                        <Text style={s.statCardSub}>head</Text>
                                    </View>
                                </GlassView>
                                <GlassView style={[s.statCard, { flex: 1 }]}>
                                    <MaterialIcons name="favorite" size={60} color="rgba(255,255,255,0.04)" style={s.statWatermark} />
                                    <Text style={s.statCardLabel}>STATUS</Text>
                                    <View style={s.statCardRow}>
                                        <Text style={[s.statCardValue, { color: g.statusColor, fontSize: 16, lineHeight: 20 }]}>{g.status}</Text>
                                    </View>
                                </GlassView>
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>

            {/* Swipe recommendations sheet */}
            <SwipeRecsSheet
                visible={recModalOpen}
                animal={recAnimal}
                cachedRecs={recAnimal ? recsCache[recAnimal.animalId] : undefined}
                onClose={() => setRecModalOpen(false)}
                onCacheUpdate={(id, recs) => setRecsCache(prev => ({ ...prev, [id]: recs }))}
                onAcceptSuccess={() => getAllAnimals().then(setAnimals).catch(console.error)}
            />

            {/* Bottom Nav */}
            <View style={s.navContainer}>
                <View style={[s.navBar, { backgroundColor: '#081209', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <TouchableOpacity style={s.navItem}>
                        <MaterialIcons name="groups" size={24} color={GREEN} />
                        <Text style={[s.navText, { color: GREEN }]}>HERD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.navItem} onPress={() => router.push('/(tabs)/home')}>
                        <MaterialIcons name="home" size={24} color="rgba(255,255,255,0.4)" />
                        <Text style={s.navText}>HOME</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.navItem} onPress={() => router.push('/(tabs)/messages')}>
                        <MaterialIcons name="chat-bubble-outline" size={24} color="rgba(255,255,255,0.4)" />
                        <Text style={s.navText}>CHAT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.navItem}
                        onPress={() => router.push('/(tabs)/register-animal' as any)}
                    >
                        <MaterialCommunityIcons name="plus-circle-outline" size={24} color="rgba(255,255,255,0.4)" />
                        <Text style={s.navText}>ADD</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container:    { flex: 1 },
    scrollContent:{ paddingBottom: 120 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
        gap: 12,
    },
    headerLeft: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
    },
    headerTitle: {
        fontSize: 14, fontWeight: '900',
        letterSpacing: 2, color: '#fff',
    },
    headerRight:   { flexDirection: 'row', gap: 8 },
    iconBtnWrap:   { position: 'relative' },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute', top: 8, right: 8,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: GREEN,
        borderWidth: 1, borderColor: '#081209',
    },

    // Species pills
    pillRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    pillActive: {
        backgroundColor: GREEN,
        borderColor: GREEN,
        shadowColor: GREEN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 6,
    },
    pillText:       { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
    pillTextActive: { color: '#081209', fontWeight: '800' },

    // Herd group cards
    cardGrid: { paddingHorizontal: 20, gap: 12 },
    cardRow:  { flexDirection: 'row', gap: 12 },
    herdCard: {
        borderRadius: 24, padding: 16, overflow: 'hidden',
        minHeight: 180, justifyContent: 'flex-end', gap: 4,
    },
    cardWatermark: {
        position: 'absolute', bottom: -16, right: -16,
    },
    cardPhotoWrap: {
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 90, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
    },
    cardPhoto: { width: '100%', height: '100%' },
    cardPhotoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8,18,9,0.55)',
    },
    cardPhotoPlaceholder: {
        backgroundColor: 'rgba(17,212,30,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 999, borderWidth: 1, marginTop: 100,
    },
    statusDot:  { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    herdCardTitle:  { fontSize: 15, fontWeight: '800', color: '#fff', marginTop: 4 },
    herdCardCount:  { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
    herdCardFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10,
    },
    avatarRow:      { flexDirection: 'row', alignItems: 'center' },
    miniAvatar: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1.5, borderColor: '#081209',
        alignItems: 'center', justifyContent: 'center',
    },
    miniAvatarText: { fontSize: 8, fontWeight: '800', color: '#fff' },
    viewLink:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
    viewLinkText:   { fontSize: 12, fontWeight: '700', color: GREEN },

    // Animal list
    animalList: { paddingHorizontal: 20, gap: 10 },
    animalCard: { borderRadius: 20, overflow: 'hidden' },
    animalCardMain: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, gap: 12,
    },
    animalAvatarWrap: {
        width: 48, height: 48, borderRadius: 24, overflow: 'hidden', position: 'relative',
    },
    animalAvatar:       { width: '100%', height: '100%' },
    animalAvatarFallback: {
        backgroundColor: 'rgba(17,212,30,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    animalInitials: { fontSize: 14, fontWeight: '900', color: GREEN },
    onlineDot: {
        position: 'absolute', bottom: 1, right: 1,
        width: 10, height: 10, borderRadius: 5,
        borderWidth: 1.5, borderColor: '#081209',
    },
    animalName: { fontSize: 15, fontWeight: '700', color: '#fff' },
    animalSub:  { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    statusChip: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6, borderWidth: 1,
    },
    statusChipText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

    // Recommendations row
    recRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(236,91,19,0.08)',
    },
    recRowDisabled: { backgroundColor: 'transparent' },
    recRowText:     { fontSize: 12, fontWeight: '700', color: ORANGE },
    recRowTextDisabled: { color: 'rgba(255,255,255,0.2)' },

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
    emptyIconWrap: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(17,212,30,0.08)',
        borderWidth: 1, borderColor: 'rgba(17,212,30,0.2)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
    emptySub:   { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20 },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 8, backgroundColor: GREEN,
        paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
    },
    emptyBtnText: { color: '#081209', fontWeight: '800', fontSize: 14 },

    // Loading
    loadingWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

    // Map banner
    mapBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        marginHorizontal: 20, marginTop: 24,
        padding: 14, borderRadius: 18,
        backgroundColor: 'rgba(236,91,19,0.12)',
        borderWidth: 1, borderColor: 'rgba(236,91,19,0.3)',
    },
    mapBannerIcon: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center',
    },
    mapBannerTitle: { fontSize: 14, fontWeight: '700' },
    mapBannerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    mapBannerArrow: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center',
    },

    // Stats section
    statsSection:   { paddingHorizontal: 20, marginTop: 28 },
    sectionLabel: {
        fontSize: 13, fontWeight: 'bold', letterSpacing: 2,
        color: 'rgba(255,255,255,0.6)', marginBottom: 14,
    },
    statsRow:     { flexDirection: 'row', gap: 12 },
    statCard: {
        padding: 16, borderRadius: 24, overflow: 'hidden',
        position: 'relative', minHeight: 100, justifyContent: 'space-between',
    },
    statWatermark: { position: 'absolute', bottom: -16, right: -16 },
    statCardLabel: {
        fontSize: 10, color: 'rgba(255,255,255,0.45)',
        fontWeight: 'bold', letterSpacing: 0.5,
    },
    statCardRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    statCardValue:{ fontSize: 28, fontWeight: 'bold', color: '#fff' },
    statCardTrend:{ fontSize: 10, color: GREEN, fontWeight: 'bold' },
    statCardSub:  { fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },

    // Nav
    navContainer: { position: 'absolute', bottom: 24, left: 20, right: 20 },
    navBar: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 16, borderRadius: 999,
        borderWidth: 1,
    },
    navItem: { alignItems: 'center', gap: 4 },
    navText: {
        fontSize: 8, fontWeight: 'bold',
        color: 'rgba(255,255,255,0.4)', letterSpacing: 1,
    },
});
