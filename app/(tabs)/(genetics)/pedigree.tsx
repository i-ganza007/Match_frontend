import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

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

export default function PedigreeScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const placeholderImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDspxML4A6SYRldREK3Cc4esLzSzwZLPLw1cc7Lb5EsGcqHWLflsQ-G6fH_qCLCvIq-5f_ibGOm9fROQ0jDdp145XhKMkrblOMPziKdK9erPESIfwUT8RhbbLDcTZWULYGkxbzhnjjOpVYfrHD8GNYuqFIoOI3yfC9Lm4ao44L2R7lYro1dPqPsGXra21gepLknV2fO_6l80_eb81lx1ElO_gmKbz4Tio3mTtKHMdM4FpK7IZS_B8Z-WoXNudy-C02qXJYsyvtpld0';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 1. Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Genetic Lineage</Text>
                    <GlassView style={styles.langToggle}>
                        <View style={styles.langBtnActive}>
                            <Text style={styles.langTextActive}>EN</Text>
                        </View>
                        <View style={styles.langBtn}>
                            <Text style={styles.langText}>RW</Text>
                        </View>
                    </GlassView>
                </View>

                {/* 2. Stats */}
                <View style={styles.statsRow}>
                    <GlassView style={styles.statCard} bright>
                        <Text style={styles.statLabelGreen}>INBREEDING COEFF.</Text>
                        <View style={styles.statRowValue}>
                            <Text style={styles.statValue}>1.2%</Text>
                            <Text style={styles.statTrendGreen}> Stable</Text>
                        </View>
                    </GlassView>
                    <GlassView style={styles.statCard}>
                        <Text style={styles.statLabel}>GENETIC PURITY</Text>
                        <View style={styles.statRowValue}>
                            <Text style={styles.statValue}>98.5%</Text>
                            <Text style={styles.statTrendGreen}> +0.5%</Text>
                        </View>
                    </GlassView>
                </View>

                {/* 3. Pedigree Tree */}
                <View style={styles.treeContainer}>
                    {/* Grandparents */}
                    <View style={styles.generationRow}>
                        <View style={styles.avatarNode}>
                            <Image source={{ uri: placeholderImg }} style={styles.gAvatar} />
                            <Text style={styles.nodeText}>G.Sire 1</Text>
                        </View>
                        <View style={styles.avatarNode}>
                            <Image source={{ uri: placeholderImg }} style={styles.gAvatar} />
                            <Text style={styles.nodeText}>G.Dam 1</Text>
                        </View>
                        <View style={{ width: 40 }} />
                        <View style={styles.avatarNode}>
                            <Image source={{ uri: placeholderImg }} style={styles.gAvatar} />
                            <Text style={styles.nodeText}>G.Sire 2</Text>
                        </View>
                        <View style={styles.avatarNode}>
                            <Image source={{ uri: placeholderImg }} style={styles.gAvatar} />
                            <Text style={styles.nodeText}>G.Dam 2</Text>
                        </View>
                    </View>

                    {/* Hierarchy Lines */}
                    <View style={styles.linesRow}>
                        <View style={[styles.treeLineHorizontal, { width: 60, left: '20%' }]} />
                        <View style={[styles.treeLineHorizontal, { width: 60, right: '20%' }]} />
                        <View style={[styles.treeLineVertical, { left: '30%' }]} />
                        <View style={[styles.treeLineVertical, { right: '30%' }]} />
                    </View>

                    {/* Parents */}
                    <View style={styles.generationRowParents}>
                        <GlassView style={styles.parentPill} bright>
                            <Image source={{ uri: placeholderImg }} style={styles.pAvatar} />
                            <View>
                                <Text style={styles.pLabel}>SIRE</Text>
                                <Text style={styles.pName}>Gihamya</Text>
                            </View>
                        </GlassView>
                        <GlassView style={styles.parentPill}>
                            <Image source={{ uri: placeholderImg }} style={styles.pAvatar} />
                            <View>
                                <Text style={styles.pLabelGreen}>DAM</Text>
                                <Text style={styles.pName}>Inyambo</Text>
                            </View>
                        </GlassView>
                    </View>

                    {/* Main Subject */}
                    <View style={styles.linesRowSubject}>
                        <View style={[styles.treeLineHorizontal, { width: 140, left: '32%' }]} />
                        <View style={[styles.treeLineVertical, { left: '50%', height: 30 }]} />
                    </View>

                    <View style={styles.subjectContainer}>
                        <View style={styles.subjectImageBorder}>
                            <Image source={{ uri: placeholderImg }} style={styles.subjectImage} />
                        </View>
                    </View>

                    {/* Subject Details */}
                    <View style={styles.subjectDetailsCardContainer}>
                        <GlassView style={styles.subjectDetailsCard} bright>
                            <Text style={styles.subjectName}>Ingabo</Text>
                            <Text style={styles.subjectBreed}>ANKOLE PUREBRED</Text>
                            <View style={styles.subjectDetailsRow}>
                                <View style={styles.subjectDetailItem}>
                                    <Text style={styles.detailLabel}>AGE</Text>
                                    <Text style={styles.detailValue}>2.4y</Text>
                                </View>
                                <View style={styles.subjectDetailItem}>
                                    <Text style={styles.detailLabel}>HEALTH</Text>
                                    <Text style={styles.detailValueGreen}>94%</Text>
                                </View>
                            </View>
                        </GlassView>
                    </View>
                </View>

                {/* Chips at the bottom */}
                <View style={styles.bottomChips}>
                    <GlassView style={styles.chip}>
                        <MaterialCommunityIcons name="face-recognition" size={14} color="#fff" />
                        <Text style={styles.chipText}>Imbabazi (F)</Text>
                    </GlassView>
                    <GlassView style={styles.chip}>
                        <MaterialCommunityIcons name="face-recognition" size={14} color="#fff" />
                        <Text style={styles.chipText}>Rugari (M)</Text>
                    </GlassView>
                </View>

                <View style={{ height: 100 }} />

            </ScrollView>

            {/* Right floating tools */}
            <View style={styles.rightFloatTools}>
                <TouchableOpacity style={styles.toolBtn}>
                    <MaterialIcons name="add" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn}>
                    <MaterialIcons name="remove" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toolBtn, { marginTop: 12 }]}>
                    <MaterialCommunityIcons name="crop-free" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Bottom Navigation */}
            <View style={styles.navContainer}>
                <View style={[styles.navBar, { backgroundColor: '#081209', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
                        <MaterialCommunityIcons name="paw" size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                        <Text style={[styles.navText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>Flock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialCommunityIcons name="graph-outline" size={24} color={colors.primaryGreen} />
                        <Text style={[styles.navTextActive, { color: colors.primaryGreen }]}>Pedigree</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialCommunityIcons name="heart-pulse" size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                        <Text style={[styles.navText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>Health</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialCommunityIcons name="store" size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                        <Text style={[styles.navText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>Market</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Image source={{ uri: placeholderImg }} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFD700' }} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#081209',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    glass: {
        borderRadius: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 24,
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        marginLeft: 16,
    },
    langToggle: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
    },
    langBtnActive: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: '#11d41e',
        borderRadius: 999,
    },
    langBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    langTextActive: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#081209',
    },
    langText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.4)',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 40,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statLabelGreen: {
        fontSize: 10,
        color: '#11d41e',
        fontWeight: 'bold',
        letterSpacing: 1,
        opacity: 0.8,
        marginBottom: 8,
    },
    statRowValue: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statTrendGreen: {
        fontSize: 12,
        color: '#11d41e',
        fontWeight: '600',
        marginLeft: 4,
    },
    treeContainer: {
        paddingHorizontal: 10,
        position: 'relative',
    },
    generationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 10,
    },
    avatarNode: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    gAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginBottom: 4,
    },
    nodeText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 10,
        fontWeight: '600',
    },
    linesRow: {
        height: 30,
        position: 'relative',
    },
    treeLineHorizontal: {
        position: 'absolute',
        top: 0,
        height: 1,
        backgroundColor: 'rgba(17, 212, 30, 0.2)',
    },
    treeLineVertical: {
        position: 'absolute',
        top: 0,
        width: 1,
        height: 20,
        backgroundColor: 'rgba(17, 212, 30, 0.2)',
    },
    generationRowParents: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 20,
    },
    parentPill: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        paddingRight: 16,
        borderRadius: 999,
        gap: 12,
    },
    pAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    pLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    pLabelGreen: {
        color: '#11d41e',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    pName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    linesRowSubject: {
        height: 30,
        position: 'relative',
    },
    subjectContainer: {
        alignItems: 'center',
        marginBottom: -30, // overlap with card
        zIndex: 10,
    },
    subjectImageBorder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        padding: 4,
        borderWidth: 2,
        borderColor: '#11d41e',
        backgroundColor: '#081209',
        overflow: 'hidden',
    },
    subjectImage: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
    subjectDetailsCardContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    subjectDetailsCard: {
        width: '60%',
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderRadius: 24,
    },
    subjectName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subjectBreed: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 16,
    },
    subjectDetailsRow: {
        flexDirection: 'row',
        gap: 24,
    },
    subjectDetailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    detailValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    detailValueGreen: {
        color: '#11d41e',
        fontSize: 14,
        fontWeight: 'bold',
    },
    rightFloatTools: {
        position: 'absolute',
        right: 20,
        top: '55%',
        alignItems: 'center',
        gap: 12,
    },
    toolBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    bottomChips: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 20,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    chipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
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
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navTextActive: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    navText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
