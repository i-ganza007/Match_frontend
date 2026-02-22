import React from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming, useSharedValue, withDelay } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../../components/ThemeToggle';

const { width } = Dimensions.get('window');

// --- Components ---

const GlassView = ({ children, style, bright = false }: { children: React.ReactNode, style?: any, bright?: boolean }) => {
    const { colors, isDark } = useTheme();
    return (
        <View style={[
            styles.glass,
            {
                backgroundColor: bright
                    ? (isDark ? 'rgba(17, 212, 30, 0.15)' : 'rgba(17, 212, 30, 0.2)')
                    : colors.glassBackground,
                borderColor: bright
                    ? (isDark ? 'rgba(17, 212, 30, 0.3)' : 'rgba(17, 212, 30, 0.4)')
                    : colors.glassBorder,
                borderWidth: 1,
            },
            style
        ]}>
            {children}
        </View>
    );
};

const PulseMarker = ({ delay = 0, size = 32 }: { delay?: number, size?: number }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.4);

    React.useEffect(() => {
        scale.value = withDelay(delay, withRepeat(withSequence(withTiming(2, { duration: 1500 }), withTiming(1, { duration: 0 })), -1, false));
        opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(0, { duration: 1500 }), withTiming(0.4, { duration: 0 })), -1, false));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={styles.markerContainer}>
            <Animated.View style={[styles.pulseCircle, { width: size, height: size, borderRadius: size / 2 }, animatedStyle]} />
            <View style={styles.markerDot} />
        </View>
    );
};

export default function Home() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 1. Top Bar */}
                <View style={styles.header}>
                    <GlassView style={styles.searchBar} bright={true}>
                        <MaterialIcons name="search" size={20} color={colors.icon} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search breeds, farmers..."
                            placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                        />
                        <ThemeToggle size={20} showGlass={false} />
                    </GlassView>
                    <GlassView style={styles.langToggle}>
                        <View style={styles.langBtnActive}>
                            <Text style={styles.langTextActive}>KIN</Text>
                        </View>
                        <View style={styles.langBtn}>
                            <Text style={styles.langText}>ENG</Text>
                        </View>
                    </GlassView>
                </View>

                {/* 2. Species Quick-Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <View style={[styles.filterPill, styles.filterPillActive]}>
                        <MaterialIcons name="pets" size={18} color="#FFD700" />
                        <Text style={styles.filterTextActive}>Cows</Text>
                    </View>
                    <GlassView style={styles.filterPill}>
                        <MaterialCommunityIcons name="egg-outline" size={18} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.filterText}>Goats</Text>
                    </GlassView>
                    <GlassView style={styles.filterPill}>
                        <MaterialCommunityIcons name="grass" size={18} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.filterText}>Sheep</Text>
                    </GlassView>
                    <GlassView style={styles.filterPill}>
                        <MaterialIcons name="auto-awesome" size={18} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.filterText}>Pigs</Text>
                    </GlassView>
                </ScrollView>

                {/* 3. Featured Recommendation */}
                <View style={styles.section}>
                    <View style={styles.featuredCard}>
                        {/* Glow effect background approx */}
                        <View style={styles.glowBg} />
                        <GlassView style={styles.featuredInner} bright>
                            <View style={styles.featuredImageContainer}>
                                <Image
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDspxML4A6SYRldREK3Cc4esLzSzwZLPLw1cc7Lb5EsGcqHWLflsQ-G6fH_qCLCvIq-5f_ibGOm9fROQ0jDdp145XhKMkrblOMPziKdK9erPESIfwUT8RhbbLDcTZWULYGkxbzhnjjOpVYfrHD8GNYuqFIoOI3yfC9Lm4ao44L2R7lYro1dPqPsGXra21gepLknV2fO_6l80_eb81lx1ElO_gmKbz4Tio3mTtKHMdM4FpK7IZS_B8Z-WoXNudy-C02qXJYsyvtpld0' }}
                                    style={styles.featuredImage}
                                    contentFit="cover"
                                />
                                <View style={styles.imageOverlay} />

                                <GlassView style={styles.premiumBadge}>
                                    <MaterialIcons name="verified" size={12} color="#11d41e" />
                                    <Text style={styles.premiumText}>PREMIUM MATCH</Text>
                                </GlassView>

                                <View style={styles.featuredInfo}>
                                    <View style={styles.featuredRow}>
                                        <View>
                                            <Text style={[styles.featuredTitle, { color: colors.text }]}>Amavubi Genetics</Text>
                                            <Text style={[styles.featuredSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }]}>Holstein-Friesian • Musanze, RW</Text>
                                        </View>
                                        <View style={styles.matchBadge}>
                                            <Text style={styles.matchScore}>98% MATCH</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.featuredStats}>
                                <View style={styles.statGroup}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>MILK YIELD</Text>
                                        <Text style={styles.statValue}>32L/Day</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>FERTILITY</Text>
                                        <Text style={styles.statValue}>High</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.viewBtn}>
                                    <Text style={styles.viewBtnText}>VIEW DETAILS</Text>
                                </TouchableOpacity>
                            </View>
                        </GlassView>
                    </View>
                </View>

                {/* 4. Stats Row */}
                <View style={styles.statsRow}>
                    <GlassView style={styles.statCard}>
                        <MaterialIcons name="grid-view" size={60} color="rgba(255,255,255,0.05)" style={styles.statIconBg} />
                        <Text style={styles.statCardLabel}>Your Herd</Text>
                        <View style={styles.statCardRow}>
                            <Text style={styles.statCardValue}>12</Text>
                            <Text style={styles.statCardTrend}>+2 New</Text>
                        </View>
                    </GlassView>
                    <GlassView style={styles.statCard}>
                        <MaterialIcons name="analytics" size={60} color="rgba(255,255,255,0.05)" style={styles.statIconBg} />
                        <Text style={styles.statCardLabel}>Recent Matches</Text>
                        <View style={styles.statCardRow}>
                            <Text style={styles.statCardValue}>03</Text>
                            <Text style={styles.statCardSub}>this week</Text>
                        </View>
                    </GlassView>
                </View>

                {/* 5. Map Preview */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>BREEDERS NEAR YOU</Text>
                        <Text style={styles.sectionAction}>EXPAND MAP</Text>
                    </View>
                    <GlassView style={styles.mapContainer}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0wmewPGMAiKRUfzoZwc-2yr3RdJSYCOW3milMOhVLs7qaX_gSJ0J34z5nTwWIVH3xZz1Q-gxCv87Drc0tduJWDFK91xS3K1eLY5aQoR4FSTM7D9F4nWFDBAwsKrdEWKNRxAj-NL2yHTrCBh0wNO22J37R_wSPy5vuQWeZ4-CF2tv6n11Rd2qV4qojLDv4VSDAtL5gFP-8O3JkmejfkcNmBkjU4AdQuX-VSRIifCkqm9ec-AaloaS1HUPfQtjTP5Djw95SGc2WCHE' }}
                            style={styles.mapImage}
                        />

                        {/* Map Pins */}
                        <View style={{ position: 'absolute', top: '50%', left: '33%' }}>
                            <PulseMarker />
                        </View>
                        <View style={{ position: 'absolute', top: '25%', right: '25%' }}>
                            <PulseMarker delay={1000} size={24} />
                        </View>
                        <View style={{ position: 'absolute', bottom: '25%', right: '33%' }}>
                            <PulseMarker delay={500} size={40} />
                        </View>

                        <GlassView style={styles.mapOverlay} bright>
                            <MaterialIcons name="location-on" size={20} color="#11d41e" />
                            <View>
                                <Text style={styles.mapOverlayTitle}>8 Active Breeders</Text>
                                <Text style={styles.mapOverlaySub}>Within 15km of Nyabugogo</Text>
                            </View>
                        </GlassView>
                    </GlassView>
                </View>

                {/* 6. Network/Chat */}
                <View style={[styles.section, { marginBottom: 100 }]}>
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>FARMER NETWORK</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.networkScroll}>
                        <View style={styles.networkItem}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatarWrapperActive}>
                                    <Image
                                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiNs-XFeTkh-54BrARcoL0mU_inmU44yzIk_-Ff45EBPw4_r9yoxtDmxwu5g7zMzFnei_ZoCo5evg1y5T9KDkCfDtEfvm59adHZZWZOGiE_25aTDvHtag444ZCLMAGKeCsIcz7ElO47Z1MTAjVx-V_Q46CuLLIrhFBR048_YJRzV4AF37M6RtHDQ2eIbGPqQj6tPa66B7kIck24vqIKloQigYIotMRmYzdJmyoLpIk3SlKuO2EuXkh63SFFiyOhwu6U3GdOXRe0qY' }}
                                        style={styles.avatar}
                                    />
                                </View>
                                <GlassView style={styles.networkBadge}>
                                    <MaterialIcons name="pets" size={10} color="#11d41e" />
                                </GlassView>
                                <View style={styles.networkCount}>
                                    <Text style={styles.networkCountText}>2</Text>
                                </View>
                            </View>
                            <Text style={[styles.networkName, { color: colors.text }]}>K. Gasana</Text>
                        </View>

                        <View style={styles.networkItem}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatarWrapper}>
                                    <Image
                                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9g6mZQb9KBbmMF8nNK0916WwOgpWtKUlRatVKkW8cUiu05XkH030o1WfdwfdD23K_Md7pfhhrNhyejV6gdXCLJdQSn5lnXESj3fYgTDz4Xa_KkBu6So8YNCdGknYaYAjb_nQj6iVlPEj7lwEcy_PWNfTuQRLvQcTuHItkCbHY1fVFBrROJ8oEw7-Aav99a-AX3e_Kksjie_yX1Tbt2vIXIpCtjxFMnnNMN74ELln4VNZPC4rrTXy0HL0UlIsfygGIjtsOBS3OE7Q' }}
                                        style={styles.avatar}
                                    />
                                </View>
                                <GlassView style={styles.networkBadge}>
                                    <MaterialCommunityIcons name="egg-outline" size={10} color="#11d41e" />
                                </GlassView>
                            </View>
                            <Text style={[styles.networkName, { color: colors.text }]}>M. Umurerwa</Text>
                        </View>

                        <View style={styles.networkItem}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatarWrapper}>
                                    <Image
                                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJNy1D15hJBx6Wze-dSIgNbWzhWLpS1RJOptidTXh5iUWQQr86m4CZoHBdgHmIe-LJu_dzUZvvLD1Prv7f32uLFmA4-gq49CbXk3j6kcJwGKsGuzXE6JH0NQOz-oS-Z6ecOCdsT5ff-0PP3RRYps9D87RxJxO9L9nG2ihr8350lXK6TPMz3BsDsup-0gHh4MXFHv5qIyU35dGFQshWWIDzV6yqMm5zlJj-Jtd52m9nMZqCeUXiQu66q81_6AjgDe-r5TYgzoTOsqY' }}
                                        style={styles.avatar}
                                    />
                                </View>
                                <GlassView style={styles.networkBadge}>
                                    <MaterialCommunityIcons name="grass" size={10} color="#11d41e" />
                                </GlassView>
                            </View>
                            <Text style={[styles.networkName, { color: colors.text }]}>E. Nshuti</Text>
                        </View>

                        <View style={styles.networkItem}>
                            <View style={styles.avatarContainer}>
                                <GlassView style={[styles.avatarWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <MaterialIcons name="add" size={24} color="rgba(255,255,255,0.2)" />
                                </GlassView>
                            </View>
                            <Text style={styles.networkName}>Invite</Text>
                        </View>
                    </ScrollView>
                </View>

            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fabContainer} onPress={() => router.push('/(tabs)/breed-camera')} activeOpacity={0.8}>
                <GlassView style={styles.fabRing}>
                    <View style={styles.fabInner}>
                        <MaterialIcons name="camera-enhance" size={28} color="#081209" />
                    </View>
                    <View style={styles.fabBadge}>
                        <Text style={styles.fabBadgeText}>AI</Text>
                    </View>
                </GlassView>
            </TouchableOpacity>

            {/* Bottom Navigation */}
            <View style={styles.navContainer}>
                <GlassView style={[styles.navBar, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="home" size={24} color={colors.primaryGreen} />
                        <Text style={[styles.navTextActive, { color: colors.primaryGreen }]}>HOME</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="hub" size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                        <Text style={[styles.navText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>GENETICS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/messages')}>
                        <MaterialIcons name="chat-bubble-outline" size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                        <Text style={[styles.navText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>CHAT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="person-outline" size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                        <Text style={[styles.navText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>PROFILE</Text>
                    </TouchableOpacity>
                </GlassView>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#081209', // Fallback for radial gradient
    },
    scrollContent: {
        paddingBottom: 20,
    },
    glass: {
        borderRadius: 16,
    },
    glassBright: {
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        gap: 8,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
    },
    langToggle: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    langBtnActive: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#11d41e',
        borderRadius: 999,
    },
    langBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    langTextActive: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#081209',
    },
    langText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.4)',
    },
    filterScroll: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 24,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 999,
        gap: 8,
    },
    filterPillActive: {
        backgroundColor: 'rgba(17, 212, 30, 0.08)',
        borderColor: 'rgba(17, 212, 30, 0.3)',
        borderWidth: 1,
    },
    filterTextActive: {
        color: '#11d41e',
        fontSize: 14,
        fontWeight: '600',
    },
    filterText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    featuredCard: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    glowBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 212, 30, 0.05)', // Subtle green tint
        borderRadius: 24,
    },
    featuredInner: {
        padding: 4,
        borderRadius: 24,
    },
    featuredImageContainer: {
        height: 224,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        opacity: 0.9,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        backgroundColor: 'rgba(8, 18, 9, 0.6)',
    },
    premiumBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        gap: 4,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    premiumText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    featuredInfo: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    featuredRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    featuredTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    featuredSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
    },
    matchBadge: {
        backgroundColor: '#11d41e',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
    },
    matchScore: {
        color: '#081209',
        fontSize: 10,
        fontWeight: '900',
    },
    featuredStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    statGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    viewBtn: {
        backgroundColor: '#11d41e',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 999,
    },
    viewBtnText: {
        color: '#081209',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        height: 100,
        justifyContent: 'space-between',
    },
    statIconBg: {
        position: 'absolute',
        bottom: -16,
        right: -16,
        opacity: 0.5,
    },
    statCardLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '500',
    },
    statCardRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    statCardValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    statCardTrend: {
        fontSize: 10,
        color: '#11d41e',
        fontWeight: 'bold',
    },
    statCardSub: {
        fontSize: 8,
        color: 'rgba(255, 255, 255, 0.3)',
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 13, // slightly smaller to match design
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: 'bold',
        letterSpacing: 2, // widest
    },
    sectionAction: {
        fontSize: 10,
        color: '#11d41e',
        fontWeight: 'bold',
    },
    mapContainer: {
        height: 160,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        opacity: 0.4,
    },
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseCircle: {
        backgroundColor: 'rgba(17, 212, 30, 0.2)',
        position: 'absolute',
    },
    markerDot: {
        width: 12,
        height: 12,
        backgroundColor: '#11d41e',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        padding: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    mapOverlayTitle: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    mapOverlaySub: {
        fontSize: 8,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 2,
    },
    networkScroll: {
        paddingRight: 20,
        gap: 16,
    },
    networkItem: {
        alignItems: 'center',
        gap: 8,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarWrapperActive: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 2,
        borderWidth: 2,
        borderColor: '#11d41e',
        shadowColor: '#11d41e',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 2,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
    networkBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    networkCount: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        backgroundColor: '#11d41e',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#081209',
    },
    networkCountText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#081209',
    },
    networkName: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 10,
        fontWeight: 'medium',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 96, // Above nav
        right: 24,
    },
    fabRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: 'rgba(17, 212, 30, 0.4)',
        borderWidth: 1,
        shadowColor: '#11d41e',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    fabInner: {
        width: 48,
        height: 48,
        backgroundColor: '#11d41e',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FFD700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
    },
    fabBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#081209',
    },
    navContainer: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navTextActive: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#11d41e',
        letterSpacing: 1,
    },
    navText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: 1,
    },
});
