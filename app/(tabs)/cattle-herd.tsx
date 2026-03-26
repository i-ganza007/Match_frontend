import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    StyleSheet, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const PRIMARY = '#ec5b13';
const BG = '#221610';
const CARD_BG = 'rgba(255,255,255,0.04)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const TEXT = '#f1f5f9';
const TEXT_MUTED = '#94a3b8';
const SURFACE = 'rgba(255,255,255,0.06)';

const SUB_FILTERS = ['Cows', 'Bulls', 'Calves', 'Heifers'];

const CATTLE = [
    {
        id: '#042', name: 'Daisy', breed: 'Holstein Friesian', age: '4.2y', tag: 'Premium', genetic: 94,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbLWWHc76kAmR_pLmq4VOE6-Lm36xNBkOW2dxknnrvlt9Dks8fm21Wh_tUQBIADgK6KKk5EWIBVk8MHcUxW1OHJsqi781L0TUbQQTpaYsMzdIZpKzfHwN1ReCg85KC_cbkt6ax-nSssB1ukj_rkW8bhv1AnparILA26pHalYJRcTYC59Zs07tDEfhaD3ZYsdTfzle421h4sKRr_-wFRRXleobHuid-2qg7WRzLFJ9lhc6pYkhfYkoa4KOfhZ8JF0dJEtoyrHwJ-Mc',
    },
    {
        id: '#812', name: 'Apollo', breed: 'Ankole-Watusi', age: '6.1y', tag: 'Heritage', genetic: 88,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFEx0sVRgvtDNev6bBh9DRrHUNZAgCYff6s05C5a0TUjfVaTNolaunt8v47qyv1vcIMrabiMyajzqJBZEjByovBdLndwldQx3NexfJ4s7s1P7awTaIIFXktb2nIKRPzlk0LvN04Y5ma0KZE737mWxpT18SmLyRevF90EbYaAsAVvKDVG6ubVULSoPvox5K9stExgr0cWw8nw9lUHE5v3ljL_OtuN_ltOWnkUqERt-wSHYho2npNnc2jtuJfh58dVFIfuDNp3SH0mI',
    },
    {
        id: '#115', name: 'Luna', breed: 'Jersey Purebred', age: '2.8y', tag: 'Active', genetic: 97,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0EmGjKZkyJ3sjqElfKl-kddsJjsdpy3oKtrgtj4nwmZAh_2vRLpTnbJfQip1pxH6qY5RYskANmKvmP3w7GnLAwvzpz4gE-7hsN6HoBHEc0VDd6a0lf6WmELxigVchn9UyntyncXBfQSX3rC8p47cimB7-i-NnymU8M3S92AiiGLB7S51kxuZrwlqZmY1k37mFHWTqWE73zIrKav3xLrHsAOX7sRQTipb-_U5PEt7hsndjagajSr7pVKa0jCGMiKZDw6mIFvQDYnI',
    },
    {
        id: '#229', name: 'Fergus', breed: 'Highland Cattle', age: '5.5y', tag: 'Resilient', genetic: 91,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTNMbxdP9mChm7OWizBJBDlyAOTTNkXuEuKqHT-eI5_vQvPywOcoW8XDkinQj-hti6eZ9UfC-UP3ZEVS4FkNcFF2Wwq2VBuv49nlGlRaq7A409jxPznGNUlwo-Eifj0kiKMAre0FvS_C98CdqvhN3j4qvNrxWZROxBvB9rAQwNy6IA4j-J0t0scZOt0sXE26SXUsIebbTL4tFPOMgh5HQDsNAhFonUMo0j9Izyz6NnhCtr0jg0pHf7yiLccO05wM9Y2LofymU2jmU',
    },
];

export default function CattleHerd() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('Cows');
    const [search, setSearch] = useState('');

    const filtered = CATTLE.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.breed.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />
            <View style={styles.stickyHeader}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(tabs)/my-herd' as any)}>
                        <MaterialIcons name="arrow-back" size={22} color={PRIMARY} />
                    </TouchableOpacity>
                    <View style={styles.titleWrap}>
                        <MaterialIcons name="agriculture" size={24} color={PRIMARY} />
                        <Text style={styles.headerTitle}>Cattle Herd</Text>
                    </View>
                    <TouchableOpacity style={styles.iconBtn}>
                        <MaterialIcons name="notifications" size={22} color={TEXT} />
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
                    {SUB_FILTERS.map(f => (
                        <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={[styles.tab, activeFilter === f && styles.tabActive]}>
                            <MaterialIcons name="pets" size={16} color={activeFilter === f ? PRIMARY : TEXT_MUTED} />
                            <Text style={[styles.tabText, activeFilter === f && styles.tabTextActive]}>{f.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.searchRow}>
                    <View style={styles.searchWrap}>
                        <MaterialIcons name="search" size={20} color={TEXT_MUTED} />
                        <TextInput style={styles.searchInput} placeholder="Search Tag or ID..." placeholderTextColor={TEXT_MUTED} value={search} onChangeText={setSearch} />
                    </View>
                    <TouchableOpacity style={styles.filterBtn}>
                        <MaterialIcons name="tune" size={22} color={TEXT} />
                    </TouchableOpacity>
                </View>
                <View style={styles.grid}>
                    {filtered.map(animal => {
                        const color = animal.genetic >= 90 ? '#22c55e' : animal.genetic >= 80 ? PRIMARY : '#f59e0b';
                        return (
                            <TouchableOpacity key={animal.id} style={styles.animalCard} onPress={() => router.push('/(tabs)/animal-profile' as any)} activeOpacity={0.85}>
                                <View style={styles.animalImgWrap}>
                                    <Image source={{ uri: animal.image }} style={styles.animalImg} contentFit="cover" />
                                    <View style={styles.animalImgOverlay} />
                                    <View style={styles.tagBadge}>
                                        <Text style={styles.tagText}>{animal.tag}</Text>
                                    </View>
                                </View>
                                <View style={styles.animalInfo}>
                                    <View style={styles.animalHeader}>
                                        <View>
                                            <Text style={styles.animalName}>{animal.name} {animal.id}</Text>
                                            <Text style={styles.animalBreed}>{animal.breed}</Text>
                                        </View>
                                        <Text style={styles.animalAge}>Age: {animal.age}</Text>
                                    </View>
                                    <View style={styles.barRow}>
                                        <Text style={styles.barLabel}>GENETIC HEALTH</Text>
                                        <Text style={[styles.barValue, { color }]}>{animal.genetic}%</Text>
                                    </View>
                                    <View style={styles.barTrack}>
                                        <View style={[styles.barFill, { width: `${animal.genetic}%` as any, backgroundColor: color }]}>
                                            <View style={styles.barSheen} />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => router.push('/(tabs)/register-animal' as any)} activeOpacity={0.85}>
                <View style={styles.fabGlow} />
                <View style={styles.fabInner}><MaterialIcons name="add" size={30} color="#fff" /></View>
            </TouchableOpacity>

            <View style={styles.navContainer}>
                <View style={styles.navBar}>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/my-herd' as any)}>
                        <MaterialIcons name="groups" size={22} color={PRIMARY} />
                        <Text style={[styles.navText, { color: PRIMARY }]}>HERD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
                        <MaterialIcons name="map" size={22} color={TEXT_MUTED} />
                        <Text style={styles.navText}>MAP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/(genetics)')}>
                        <MaterialIcons name="hub" size={22} color={TEXT_MUTED} />
                        <Text style={styles.navText}>GENETICS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="bar-chart" size={22} color={TEXT_MUTED} />
                        <Text style={styles.navText}>INSIGHTS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="settings" size={22} color={TEXT_MUTED} />
                        <Text style={styles.navText}>MANAGE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    stickyHeader: { backgroundColor: BG + 'ee', borderBottomWidth: 1, borderBottomColor: GLASS_BORDER },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY + '22', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: TEXT },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER, alignItems: 'center', justifyContent: 'center' },
    tabsRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 20 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 10, paddingTop: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: PRIMARY },
    tabText: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 1 },
    tabTextActive: { color: PRIMARY },
    scrollContent: { padding: 16, paddingBottom: 140 },
    searchRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: GLASS_BORDER },
    searchInput: { flex: 1, color: TEXT, fontSize: 14 },
    filterBtn: { paddingHorizontal: 14, backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: GLASS_BORDER, alignItems: 'center', justifyContent: 'center' },
    grid: { gap: 16 },
    animalCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER },
    animalImgWrap: { height: 160, position: 'relative' },
    animalImg: { width: '100%', height: '100%' },
    animalImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(34,22,16,0.3)' },
    tagBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
    animalInfo: { padding: 16 },
    animalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    animalName: { fontSize: 17, fontWeight: '700', color: TEXT },
    animalBreed: { fontSize: 13, color: TEXT_MUTED, marginTop: 2 },
    animalAge: { fontSize: 12, fontWeight: '600', color: PRIMARY },
    barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    barLabel: { fontSize: 10, fontWeight: '600', color: TEXT_MUTED, letterSpacing: 0.5 },
    barValue: { fontSize: 10, fontWeight: '700' },
    barTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4, position: 'relative' },
    barSheen: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.15)' },
    fab: { position: 'absolute', bottom: 100, right: 20, width: 60, height: 60 },
    fabGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: PRIMARY + '44', borderRadius: 30, transform: [{ scale: 1.4 }] },
    fabInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 10 },
    navContainer: { position: 'absolute', bottom: 16, left: 12, right: 12 },
    navBar: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 999, backgroundColor: 'rgba(34,22,16,0.97)', borderWidth: 1, borderColor: GLASS_BORDER },
    navItem: { alignItems: 'center', gap: 2 },
    navText: { fontSize: 9, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 0.3 },
});
