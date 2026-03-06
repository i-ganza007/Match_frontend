import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Colour tokens matching the HTML mockup
const PRIMARY = '#ec5b13';
const GOLD = '#F4C430';
const EMERALD = '#10b981';
const BG_DARK = '#0a0f1d';
const GLASS_BG = 'rgba(255,255,255,0.05)';
const GLASS_BORDER = 'rgba(255,255,255,0.1)';
const SLATE_400 = 'rgba(148,163,184,1)';
const SLATE_500 = 'rgba(100,116,139,1)';

const Glass = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View style={[styles.glass, style]}>{children}</View>
);

// Simple polyline-style productivity chart using SVG
const ProductivityChart = () => {
    const chartW = width - 80; // width inside the card
    const chartH = 100;

    return (
        <View style={{ height: chartH + 20, width: '100%' }}>
            <Svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
                <Defs>
                    <LinearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={EMERALD} stopOpacity={0.2} />
                        <Stop offset="100%" stopColor={EMERALD} stopOpacity={1} />
                    </LinearGradient>
                </Defs>
                {/* Approximate the HTML path scaled to chartW */}
                <Path
                    d={`M0,${chartH * 0.8} Q${chartW * 0.125},${chartH * 0.75} ${chartW * 0.2},${chartH * 0.6} T${chartW * 0.4},${chartH * 0.5} T${chartW * 0.6},${chartH * 0.7} T${chartW * 0.8},${chartH * 0.3} T${chartW},${chartH * 0.2}`}
                    fill="none"
                    stroke="url(#emeraldGrad)"
                    strokeWidth={3}
                    strokeLinecap="round"
                />
            </Svg>
            {/* Month labels */}
            <View style={styles.chartLabels}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m) => (
                    <Text key={m} style={styles.chartLabel}>{m}</Text>
                ))}
            </View>
        </View>
    );
};

// Circular health score gauge
const HealthGauge = ({ score }: { score: number }) => {
    const size = 88;
    const r = 36;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - score / 100);
    const cx = size / 2;
    const cy = size / 2;

    return (
        <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                {/* Track */}
                <Circle cx={cx} cy={cy} r={r} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
                {/* Progress */}
                <Circle
                    cx={cx} cy={cy} r={r}
                    fill="transparent"
                    stroke={EMERALD}
                    strokeWidth={8}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </Svg>
            <View style={styles.gaugeCenter}>
                <Text style={styles.gaugeScore}>{score}</Text>
                <Text style={styles.gaugeLabel}>Health</Text>
            </View>
        </View>
    );
};

export default function AnimalPerformance() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Ambient glow blobs */}
            <View style={[styles.glow, { top: -80, left: -80, width: 280, backgroundColor: `${PRIMARY}33` }]} />
            <View style={[styles.glow, { top: '45%', right: -80, width: 320, backgroundColor: `${EMERALD}1a` }]} />
            <View style={[styles.glow, { bottom: 80, left: 40, width: 220, backgroundColor: `${GOLD}1a` }]} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Animal Performance</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <MaterialIcons name="more-vert" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Card */}
                <View style={styles.heroCard}>
                    <View style={styles.heroImageContainer}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpZHw6k20rXUkTR6CotWUdQ450Oj72QYPZ_ySGQj96qodw7hmxLJUi173Qdxo08mbDtjup9itFg4zaIx0BjJ4ghwDjjlD1qy3FO2JLR2ugYnaZAM90QdC-p-Iovtd77ifyqi7cEPFaLoXAOd-VHFyal3aS8y2WMYkZsCJq7xGfSU8kRSC6ohkxHsonmb3fAmP9q6CqcWkdLukwtcDc1YX1GPzfeeYHI9E9Q8f6J_3FhVa-f7ceTbYygJy7DaocBlsH6uMsm_DuB9I' }}
                            style={styles.heroImage}
                            contentFit="cover"
                        />
                        {/* Gradient overlay */}
                        <View style={styles.heroGradient} />
                        {/* Text on image */}
                        <View style={styles.heroInfo}>
                            <Text style={styles.heroName}>Bessie the Champion</Text>
                            <Text style={styles.heroSubtitle}>ID: #7742  |  Holstein Friesian</Text>
                        </View>
                        {/* Elite badge */}
                        <View style={styles.eliteBadge}>
                            <MaterialIcons name="workspace-premium" size={14} color={GOLD} />
                            <Text style={styles.eliteText}>ELITE</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <Glass style={styles.statCard}>
                        <View style={styles.statTopRow}>
                            <MaterialIcons name="scale" size={20} color={PRIMARY} />
                            <Text style={styles.statCaption}>WEIGHT</Text>
                        </View>
                        <View style={styles.statValueRow}>
                            <Text style={styles.statNumber}>720</Text>
                            <Text style={styles.statUnit}>kg</Text>
                        </View>
                        <View style={styles.trendRow}>
                            <MaterialIcons name="trending-up" size={12} color={EMERALD} />
                            <Text style={styles.trendText}> +2.4%</Text>
                        </View>
                    </Glass>
                    <Glass style={styles.statCard}>
                        <View style={styles.statTopRow}>
                            <MaterialIcons name="water-drop" size={20} color={EMERALD} />
                            <Text style={styles.statCaption}>DAILY YIELD</Text>
                        </View>
                        <View style={styles.statValueRow}>
                            <Text style={styles.statNumber}>42</Text>
                            <Text style={styles.statUnit}>L</Text>
                        </View>
                        <View style={styles.trendRow}>
                            <MaterialIcons name="trending-up" size={12} color={EMERALD} />
                            <Text style={styles.trendText}> +1.1%</Text>
                        </View>
                    </Glass>
                </View>

                {/* Productivity Trends Chart */}
                <Glass style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.cardTitle}>Productivity Trends</Text>
                        <Text style={styles.chartSubtitle}>Last 6 Months</Text>
                    </View>
                    <ProductivityChart />
                </Glass>

                {/* Health Score */}
                <Glass style={styles.healthCard}>
                    <HealthGauge score={92} />
                    <View style={styles.healthInfo}>
                        <Text style={styles.cardTitle}>Excellent Status</Text>
                        <Text style={styles.healthDesc}>
                            All vitals are within optimal range for this breed.
                        </Text>
                        <View style={styles.pillRow}>
                            <View style={[styles.pill, { backgroundColor: `${EMERALD}33` }]}>
                                <Text style={[styles.pillText, { color: EMERALD }]}>Stable</Text>
                            </View>
                            <View style={[styles.pill, { backgroundColor: `${PRIMARY}33` }]}>
                                <Text style={[styles.pillText, { color: PRIMARY }]}>Vaccinated</Text>
                            </View>
                        </View>
                    </View>
                </Glass>

                {/* Genetic Purity */}
                <Glass style={styles.purityCard}>
                    <View style={styles.purityHeader}>
                        <Text style={styles.cardTitle}>Genetic Purity</Text>
                        <Text style={[styles.cardTitle, { color: GOLD }]}>98.4%</Text>
                    </View>
                    <View style={styles.purityTrack}>
                        <View style={styles.purityFill} />
                    </View>
                    <View style={styles.purityFooter}>
                        <Text style={styles.purityLabel}>A-Grade Pedigree</Text>
                        <Text style={styles.purityLabel}>Full Sequence Verified</Text>
                    </View>
                </Glass>

                {/* Recent Milestones */}
                <View style={styles.milestonesSection}>
                    <Text style={styles.sectionTitle}>Recent Milestones</Text>
                    <View style={styles.milestoneList}>
                        <Glass style={styles.milestoneRow}>
                            <View style={[styles.milestoneIcon, { backgroundColor: `${EMERALD}33` }]}>
                                <MaterialIcons name="medical-services" size={20} color={EMERALD} />
                            </View>
                            <View style={styles.milestoneInfo}>
                                <Text style={styles.milestoneName}>Vaccination Complete</Text>
                                <Text style={styles.milestoneSub}>Quarterly health check passed</Text>
                            </View>
                            <Text style={styles.milestoneTime}>2d ago</Text>
                        </Glass>

                        <Glass style={styles.milestoneRow}>
                            <View style={[styles.milestoneIcon, { backgroundColor: `${PRIMARY}33` }]}>
                                <MaterialIcons name="favorite" size={20} color={PRIMARY} />
                            </View>
                            <View style={styles.milestoneInfo}>
                                <Text style={styles.milestoneName}>Top Match Found</Text>
                                <Text style={styles.milestoneSub}>High genetic compatibility match</Text>
                            </View>
                            <Text style={styles.milestoneTime}>5d ago</Text>
                        </Glass>
                    </View>
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_DARK,
    },
    // Glow blobs
    glow: {
        position: 'absolute',
        height: 280,
        borderRadius: 999,
        opacity: 1,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 16,
    },
    // Glass helper
    glass: {
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 24,
    },
    // Hero
    heroCard: {
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        padding: 6,
    },
    heroImageContainer: {
        height: 220,
        borderRadius: 22,
        overflow: 'hidden',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.0)',
        // Simulated gradient: bottom dark
        background: undefined,
    },
    heroInfo: {
        position: 'absolute',
        bottom: 16,
        left: 20,
    },
    heroName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    heroSubtitle: {
        fontSize: 13,
        color: 'rgba(203,213,225,0.9)',
        marginTop: 2,
    },
    eliteBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    eliteText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 14,
    },
    statCard: {
        flex: 1,
        padding: 18,
    },
    statTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    statCaption: {
        fontSize: 10,
        fontWeight: '600',
        color: SLATE_400,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    statNumber: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
    },
    statUnit: {
        fontSize: 11,
        color: SLATE_400,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    trendText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: EMERALD,
    },
    // Chart
    chartCard: {
        padding: 20,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    chartSubtitle: {
        fontSize: 11,
        color: SLATE_400,
    },
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
        marginTop: 4,
    },
    chartLabel: {
        fontSize: 10,
        color: SLATE_500,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    // Health gauge
    healthCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 20,
    },
    gaugeCenter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    gaugeScore: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    gaugeLabel: {
        fontSize: 9,
        color: SLATE_400,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    healthInfo: {
        flex: 1,
    },
    healthDesc: {
        fontSize: 12,
        color: SLATE_400,
        marginTop: 4,
        marginBottom: 10,
        lineHeight: 17,
    },
    pillRow: {
        flexDirection: 'row',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    pillText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Genetic purity
    purityCard: {
        padding: 20,
    },
    purityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    purityTrack: {
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 999,
        overflow: 'hidden',
    },
    purityFill: {
        height: '100%',
        width: '98.4%',
        backgroundColor: GOLD,
        borderRadius: 999,
        shadowColor: GOLD,
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 4,
    },
    purityFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    purityLabel: {
        fontSize: 9,
        color: SLATE_500,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
    // Card common
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Milestones
    milestonesSection: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
        paddingHorizontal: 4,
    },
    milestoneList: {
        gap: 10,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 18,
    },
    milestoneIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    milestoneInfo: {
        flex: 1,
    },
    milestoneName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    milestoneSub: {
        fontSize: 11,
        color: SLATE_400,
        marginTop: 2,
    },
    milestoneTime: {
        fontSize: 10,
        color: SLATE_500,
    },
});
