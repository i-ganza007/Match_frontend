import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

    return (
        <View style={styles.container}>
            {/* Top Navigation */}
            <View style={styles.nav}>
                <View style={styles.navLeft}>
                    <TouchableOpacity style={styles.navIconBtn} onPress={() => router.back()}>
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
                    {/* Animal Avatar with glow */}
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarGlow} />
                        <View style={styles.avatarBorder}>
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIu33YeTIU8Bj62zO0yLyxJro3svgUOeGyn7H_DSCTFyfmUt8huLDXJYOt_Xo7qmOWs-mJ9K0xV-cb4JnirjFO_OLi8jnXKuJH_hWYeZSWCfh1bEHEkMWYB8_GIEBGzzBzX0iT7Fg3YICdHdyLKZOeq0OuxyxjTTN5zckq-S-AbNuv55VVWWmHyI8BAQjGSrqJoLIkq_2qYr_DzAGPAfUvrb_G7re_269PM5tfSaaM0UzKkK3YAJeYwt2UdOw4Z1qtyvaHHtuYzWA' }}
                                style={styles.avatarImage}
                            />
                        </View>
                        {/* Check badge */}
                        <View style={styles.checkBadge}>
                            <MaterialIcons name="check" size={14} color={BG_DARK} />
                        </View>
                    </View>

                    {/* Name & status */}
                    <Text style={styles.animalName}>Midnight Shadow</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.aliveIndicator}>
                            <View style={styles.aliveDot} />
                            <Text style={styles.aliveText}>ALIVE</Text>
                        </View>
                        <Text style={styles.statusDot}>•</Text>
                        <Text style={styles.gradeText}>Premium Grade</Text>
                    </View>

                    {/* Action Buttons */}
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
                            <MaterialIcons name="male" size={20} color={PRIMARY} />
                            <Text style={styles.metaValueText}>Male</Text>
                        </View>
                    </Glass>
                    <Glass style={styles.metaCard}>
                        <Text style={styles.metaLabel}>AGE</Text>
                        <View style={styles.metaValue}>
                            <MaterialIcons name="event-note" size={20} color={PRIMARY} />
                            <Text style={styles.metaValueText}>4.2 Years</Text>
                        </View>
                    </Glass>
                    <Glass style={styles.metaCard}>
                        <Text style={styles.metaLabel}>SPECIE</Text>
                        <View style={styles.metaValue}>
                            <MaterialIcons name="pets" size={20} color={PRIMARY} />
                            <Text style={styles.metaValueText}>Bovine</Text>
                        </View>
                    </Glass>
                    <Glass style={styles.metaCard}>
                        <Text style={styles.metaLabel}>BREED CONFIDENCE</Text>
                        <View style={styles.metaValue}>
                            <BreedConfidenceCircle percent={92} />
                            <Text style={styles.metaValueText}>Angus</Text>
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
                        <TouchableOpacity>
                            <Text style={styles.sectionAction}>View Family Tree</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Parents */}
                    <View style={styles.parentsRow}>
                        {/* Mother */}
                        <TouchableOpacity style={styles.parentCard} activeOpacity={0.8}>
                            <View style={styles.parentAvatarWrapper}>
                                <Image
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_RNhDuLBd6kwHS80mzP1LHnYRdzYh87U9YlIGVS6OQGTnEk0ONruq2NzMlBSjcE-fhK1p-WmRtHx3Sv4CMrmgF9IEfZgAucbmxxC-CQsRL1cpsSWRV_9CwYA6Nj0f3GSX2xJATMDB_mRa3TZ1pq5jixryVYXuV0q-4x6Jhgas9SIT0PQLGB-8BG5gS1PfLRUmVeOR4ca_AqfiGJYpqp7_znOdNGBBXSc99xYaHTdPKlyH64z7NKnFtUAtMIvH5pnvhIOEgyo6Drw' }}
                                    style={styles.parentAvatar}
                                />
                            </View>
                            <View>
                                <Text style={styles.parentLabel}>MOTHER</Text>
                                <Text style={styles.parentName}>Bella Vista</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Father */}
                        <TouchableOpacity style={styles.parentCard} activeOpacity={0.8}>
                            <View style={styles.parentAvatarWrapper}>
                                <Image
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy-LLs1yoQixclRbTAheYX5F2ldor-PZaMoaS8zHqpoQgDAcJFXUabrv3jDGXLmGx5D5jBux7Ksa7JwEqronmZpMbvP5W65G_J-ERRCmtdfUHxt9BZYxVUErHx1L8G_dt6ELIRak49WgdvhAOWQcjyDVJFJIZFZGx0NAMpBusTjG8yE2ixLGU8BxYq7bbNRAuoIV5h_Xko5T8pkG3OvjHcS-6qJgMRBCxlCEu9xx5RIH4Hnry32ju3SNxJodlieuI0rAqRJtuJ4Lo' }}
                                    style={styles.parentAvatar}
                                />
                            </View>
                            <View>
                                <Text style={styles.parentLabel}>FATHER</Text>
                                <Text style={styles.parentName}>King Magnus</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Offspring */}
                    <Text style={styles.offspringTitle}>RECENT OFFSPRING</Text>
                    <View style={styles.offspringList}>
                        {[
                            { name: 'Shadow Junior', born: 'Born Mar 12, 2023' },
                            { name: 'Midnight Rose', born: 'Born Nov 05, 2022' },
                        ].map((calf, idx) => (
                            <TouchableOpacity key={idx} style={styles.calfRow} activeOpacity={0.8}>
                                <View style={styles.calfIconBox}>
                                    <MaterialIcons name="child-care" size={20} color={PRIMARY} />
                                </View>
                                <View style={styles.calfInfo}>
                                    <Text style={styles.calfName}>{calf.name}</Text>
                                    <Text style={styles.calfBorn}>{calf.born}</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={22} color={SLATE_500} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="home" size={24} color={SLATE_400} />
                    <Text style={styles.navItemText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="search" size={24} color={SLATE_400} />
                    <Text style={styles.navItemText}>Search</Text>
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
