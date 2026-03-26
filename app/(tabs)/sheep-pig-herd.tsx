import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
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

const FILTER_TABS = ['All Livestock', 'White Pigs', 'Dorper Sheep'];

const ANIMALS = [
    {
        id: 'sow-204', filter: 'White Pigs', tag: 'Premium Grade',
        name: 'Sow #204 - Large White', subtitle: 'Purebred Yorkshires',
        highlight: '14', highlightLabel: 'Litter Size',
        health: 92, healthType: 'bar',
        extra: null,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKOgDlUh8xOxNSZe1Y4phAgNlLYTHEZHgQgwGbchsHyaGBSH-ow7qra0dqYxbQTeSA6_gKjHNmGfe-9-2zkjJhlZdC0v2oplGg2KdjEu48M7YHsbxGy387W63l6KRPplF4Z0bQSVPs_eN0Toj21fQwP03ZK9EMjwhp5qRlC87jOHRPLgTiyhM5JKAuXWdYlhv2q20SkLYq4EHSBUdbSvBGjGIr3gW2tVdnOqr-XFln3PUYGTnzTgHK4705k68-M4EHvofxbx3azNA',
    },
    {
        id: 'ram-112', filter: 'Dorper Sheep', tag: 'Elite Breeder',
        name: 'Ram #112 - Dorper', subtitle: 'Superior Meat Line',
        highlight: 'A+', highlightLabel: 'Wool Quality',
        health: null, healthType: 'chips',
        extra: [{ icon: 'monitor-weight', value: '85kg' }, { icon: 'calendar-month', value: '2.4 Yrs' }],
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAypPjniHbYE29qQmDoB01ngUNqX7cJMDmy6RXVln9RR7fgIpFeGBqvWj5mwQdaRGKWFlGCCFBb9pox9xuVbv2sldSRLK8CYx0WRveawp1VWj1TSEyZuu-jhuCUihFgk1nwjB7DF2rQ7_xAH2JHCyu7qa6qzZGTmP6bzT0a9Tifxk-3MIpKkgVe513I7rLexDro-CiEjokjZO46I881DY0CNa8DqI0lNbbJloMcfv0eM-yBUlHMGLrr0DF6-mbBR__eaeJVEY_IAJk',
    },
    {
        id: 'litter-442', filter: 'White Pigs', tag: 'Nursery A1',
        name: 'Litter #442 - F1 Cross', subtitle: '12 Weaners',
        highlight: '12', highlightLabel: 'Head Count',
        health: null, healthType: 'notice',
        extra: null,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaiPx_kIR1jFSNBFOEgXtgqUmo8s4jdM8HOmLWkxmkVSdLf4EeENpc9CxSM6a6V2WTyMnAnIDDE69gqDnaQeDnTpC4ExvjTe7hiPuQlx_2ulVJQeGV_S-N2vfsjENXKy8Bl1v7KDhYbVKLy63mf7z3c0Rck6jApJ4z92xVWYfNhL1Z_i0yV8U0IFj-Iijh1k5x7aBUEpENcnCe3_0C77M_sIXGQ7u8Rl5HEsFtEbt3hlslrbye5plvZ0kCXhLVdZbIQxuKZfnraJw',
    },
];

export default function SheepPigHerd() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('All Livestock');

    const filtered = activeFilter === 'All Livestock'
        ? ANIMALS
        : ANIMALS.filter(a => a.filter === activeFilter);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />

            {/* Sticky Header */}
            <View style={styles.stickyHeader}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(tabs)/my-herd' as any)}>
                        <MaterialIcons name="arrow-back" size={22} color={PRIMARY} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Pig & Sheep Herd</Text>
                    <TouchableOpacity style={styles.iconBtn}>
                        <MaterialIcons name="search" size={22} color={TEXT} />
                    </TouchableOpacity>
                </View>

                {/* Toggle Filter */}
                <View style={styles.toggleRow}>
                    {FILTER_TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.toggleBtn, activeFilter === tab && styles.toggleBtnActive]}
                            onPress={() => setActiveFilter(tab)}
                        >
                            <Text style={[styles.toggleText, activeFilter === tab && styles.toggleTextActive]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {filtered.map(animal => (
                    <TouchableOpacity
                        key={animal.id}
                        style={styles.card}
                        onPress={() => router.push('/(tabs)/animal-profile' as any)}
                        activeOpacity={0.85}
                    >
                        {/* Image */}
                        <View style={styles.cardImgWrap}>
                            <Image source={{ uri: animal.image }} style={styles.cardImg} contentFit="cover" />
                            <View style={styles.cardImgOverlay} />
                            <View style={styles.tagBadge}>
                                <Text style={styles.tagText}>{animal.tag}</Text>
                            </View>
                        </View>
                        {/* Body */}
                        <View style={styles.cardBody}>
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardName}>{animal.name}</Text>
                                    <Text style={styles.cardSubtitle}>{animal.subtitle}</Text>
                                </View>
                                <View style={styles.highlightWrap}>
                                    <Text style={styles.highlightValue}>{animal.highlight}</Text>
                                    <Text style={styles.highlightLabel}>{animal.highlightLabel}</Text>
                                </View>
                            </View>

                            {/* Health / extra info */}
                            {animal.healthType === 'bar' && animal.health != null && (
                                <View style={styles.healthBarRow}>
                                    <View style={styles.barTrack}>
                                        <View style={[styles.barFill, { width: `${animal.health}%` as any }]} />
                                    </View>
                                    <Text style={styles.healthLabel}>Health: {animal.health}%</Text>
                                </View>
                            )}
                            {animal.healthType === 'chips' && animal.extra && (
                                <View style={styles.chipsRow}>
                                    {animal.extra.map((chip, i) => (
                                        <View key={i} style={styles.chip}>
                                            <MaterialIcons name={chip.icon as any} size={14} color={PRIMARY} />
                                            <Text style={styles.chipText}>{chip.value}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {animal.healthType === 'notice' && (
                                <View style={styles.noticeRow}>
                                    <MaterialIcons name="vaccines" size={16} color={TEXT_MUTED} />
                                    <Text style={styles.noticeText}>Next vaccination in 4 days</Text>
                                </View>
                            )}

                            {/* Actions */}
                            <View style={styles.actionsRow}>
                                <TouchableOpacity style={styles.primaryBtn}>
                                    <Text style={styles.primaryBtnText}>View Records</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.moreBtn}>
                                    <MaterialIcons name="more-horiz" size={20} color={TEXT_MUTED} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Bottom Nav */}
            <View style={styles.navContainer}>
                <View style={styles.navBar}>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/my-herd' as any)}>
                        <MaterialIcons name="groups" size={22} color={PRIMARY} />
                        <Text style={[styles.navText, { color: PRIMARY }]}>HERD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="pie-chart" size={22} color={TEXT_MUTED} />
                        <Text style={styles.navText}>INSIGHTS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.fabCenter}
                        onPress={() => router.push('/(tabs)/register-animal' as any)}
                    >
                        <MaterialIcons name="add" size={26} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
                        <MaterialIcons name="map" size={22} color={TEXT_MUTED} />
                        <Text style={styles.navText}>MAP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="account-circle" size={22} color={TEXT_MUTED} />
                        <Text style={styles.navText}>PROFILE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    stickyHeader: { backgroundColor: BG + 'ee', borderBottomWidth: 1, borderBottomColor: GLASS_BORDER },
    headerRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY + '22', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: TEXT },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER, alignItems: 'center', justifyContent: 'center' },
    toggleRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, padding: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    toggleBtnActive: { backgroundColor: PRIMARY },
    toggleText: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
    toggleTextActive: { color: '#fff' },
    scrollContent: { padding: 16, paddingBottom: 120 },
    card: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER, borderRadius: 20, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
    cardImgWrap: { height: 180, position: 'relative' },
    cardImg: { width: '100%', height: '100%' },
    cardImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(34,22,16,0.2)' },
    tagBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: PRIMARY + '22', borderWidth: 1, borderColor: PRIMARY + '44', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
    tagText: { color: PRIMARY, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
    cardBody: { padding: 18 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardName: { fontSize: 17, fontWeight: '700', color: TEXT },
    cardSubtitle: { fontSize: 13, color: TEXT_MUTED, marginTop: 2 },
    highlightWrap: { alignItems: 'flex-end' },
    highlightValue: { fontSize: 26, fontWeight: '900', color: PRIMARY },
    highlightLabel: { fontSize: 9, fontWeight: '700', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
    healthBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    barTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 4 },
    healthLabel: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
    chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PRIMARY + '18', borderWidth: 1, borderColor: PRIMARY + '33', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    chipText: { fontSize: 12, fontWeight: '700', color: TEXT },
    noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    noticeText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    primaryBtn: { flex: 1, height: 42, backgroundColor: PRIMARY, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
    primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    moreBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: GLASS_BORDER, alignItems: 'center', justifyContent: 'center' },
    navContainer: { position: 'absolute', bottom: 16, left: 12, right: 12 },
    navBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(34,22,16,0.97)', borderWidth: 1, borderColor: GLASS_BORDER },
    navItem: { alignItems: 'center', gap: 2 },
    navText: { fontSize: 9, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 0.3 },
    fabCenter: { width: 52, height: 52, borderRadius: 26, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginTop: -20, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
});
