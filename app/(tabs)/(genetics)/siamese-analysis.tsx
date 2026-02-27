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

export default function SiameseAnalysisScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const placeholderImgA = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDspxML4A6SYRldREK3Cc4esLzSzwZLPLw1cc7Lb5EsGcqHWLflsQ-G6fH_qCLCvIq-5f_ibGOm9fROQ0jDdp145XhKMkrblOMPziKdK9erPESIfwUT8RhbbLDcTZWULYGkxbzhnjjOpVYfrHD8GNYuqFIoOI3yfC9Lm4ao44L2R7lYro1dPqPsGXra21gepLknV2fO_6l80_eb81lx1ElO_gmKbz4Tio3mTtKHMdM4FpK7IZS_B8Z-WoXNudy-C02qXJYsyvtpld0';
    const placeholderImgB = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDspxML4A6SYRldREK3Cc4esLzSzwZLPLw1cc7Lb5EsGcqHWLflsQ-G6fH_qCLCvIq-5f_ibGOm9fROQ0jDdp145XhKMkrblOMPziKdK9erPESIfwUT8RhbbLDcTZWULYGkxbzhnjjOpVYfrHD8GNYuqFIoOI3yfC9Lm4ao44L2R7lYro1dPqPsGXra21gepLknV2fO_6l80_eb81lx1ElO_gmKbz4Tio3mTtKHMdM4FpK7IZS_B8Z-WoXNudy-C02qXJYsyvtpld0';


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Siamese Model Analysis</Text>
                    <TouchableOpacity style={styles.iconBtn}>
                        <MaterialIcons name="share" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Subjcts Top Row */}
                <View style={styles.subjectsContainer}>
                    {/* Link background line */}
                    <View style={styles.linkLine} />

                    <View style={styles.subjectItem}>
                        <View style={styles.subjectImageBorder}>
                            <Image source={{ uri: placeholderImgA }} style={styles.subjectImage} />
                        </View>
                        <Text style={styles.subjectLabelLabel}>SUBJECT A</Text>
                        <Text style={styles.subjectName}>Bovine-724</Text>
                    </View>

                    <View style={styles.linkPillContainer}>
                        <GlassView style={styles.linkPill} bright>
                            <Text style={styles.linkPillText}>GENETIC LINK</Text>
                        </GlassView>
                    </View>

                    <View style={styles.subjectItem}>
                        <View style={styles.subjectImageBorder}>
                            <Image source={{ uri: placeholderImgB }} style={styles.subjectImage} />
                        </View>
                        <Text style={styles.subjectLabelLabel}>SUBJECT B</Text>
                        <Text style={styles.subjectName}>Bovine-811</Text>
                    </View>
                </View>

                {/* Main Match Progress */}
                <View style={styles.matchCircleContainer}>
                    <View style={styles.outerCircle}>
                        <View style={styles.innerCircle}>
                            <View style={styles.matchContent}>
                                <Text style={styles.matchValue}>85%</Text>
                                <Text style={styles.matchLabel}>MATCH PROBABILITY</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* High Confidence Tag */}
                <View style={styles.confidenceTag}>
                    <MaterialIcons name="check-circle" size={16} color="#11d41e" />
                    <Text style={styles.confidenceText}>High Confidence Genetic Match</Text>
                </View>

                {/* Detail Cards List */}
                <View style={styles.cardsList}>
                    <GlassView style={styles.listItem}>
                        <View style={styles.listIconBox}>
                            <MaterialCommunityIcons name="source-branch" size={20} color="#11d41e" />
                        </View>
                        <View style={styles.listItemContent}>
                            <Text style={styles.listItemTitle}>Ancestry Check</Text>
                            <Text style={styles.listItemValue}>Same Sire Detected</Text>
                        </View>
                        <MaterialIcons name="check-circle" size={20} color="#11d41e" />
                    </GlassView>

                    <GlassView style={styles.listItemCol}>
                        <View style={styles.listItemRow}>
                            <View style={styles.listIconBox}>
                                <MaterialCommunityIcons name="dna" size={20} color="#11d41e" />
                            </View>
                            <View style={styles.listItemContent}>
                                <Text style={styles.listItemTitle}>Phenotype Analysis</Text>
                                <Text style={styles.listItemValue}>Phenotype Match: High</Text>
                            </View>
                            <Text style={styles.listItemRightGreen}>92%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: '92%' }]} />
                        </View>
                    </GlassView>

                    <GlassView style={styles.listItem}>
                        <View style={styles.listIconBox}>
                            <MaterialCommunityIcons name="chart-line" size={20} color="#11d41e" />
                        </View>
                        <View style={styles.listItemContent}>
                            <Text style={styles.listItemTitle}>Quantitative Data</Text>
                            <Text style={styles.listItemValue}>124 Shared Markers</Text>
                        </View>
                        <Text style={styles.listItemLink}>Details</Text>
                    </GlassView>
                </View>

                {/* Common Markers Section */}
                <Text style={styles.sectionTitle}>COMMON MARKERS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.markersScroll}>
                    <GlassView style={styles.markerPill}>
                        <Text style={styles.markerText}>CHR-5</Text>
                    </GlassView>
                    <GlassView style={styles.markerPill}>
                        <Text style={styles.markerText}>CHR-12</Text>
                    </GlassView>
                    <GlassView style={styles.markerPill}>
                        <Text style={styles.markerText}>MHC-I</Text>
                    </GlassView>
                    <GlassView style={styles.markerPill}>
                        <Text style={styles.markerText}>BTA-8</Text>
                    </GlassView>
                </ScrollView>
                <View style={{ height: 100 }} />

            </ScrollView>

            {/* Bottom Floating Action Area */}
            <GlassView style={styles.bottomBarContainer}>
                <TouchableOpacity style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>View Detailed Pedigree</Text>
                </TouchableOpacity>

                <View style={styles.secondaryBtnRow}>
                    <TouchableOpacity style={styles.secondaryBtn}>
                        <MaterialCommunityIcons name="download" size={16} color="#fff" />
                        <Text style={styles.secondaryBtnText}>Export Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn}>
                        <MaterialCommunityIcons name="history" size={16} color="#fff" />
                        <Text style={styles.secondaryBtnText}>Comparison History</Text>
                    </TouchableOpacity>
                </View>
            </GlassView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#081209', // Fallback for radial gradient
    },
    scrollContent: {
        paddingBottom: 40,
    },
    glass: {
        borderRadius: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        justifyContent: 'space-between',
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    subjectsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        marginTop: 10,
        position: 'relative',
        marginBottom: 40,
    },
    linkLine: {
        position: 'absolute',
        top: 36,
        left: 40,
        right: 40,
        height: 1,
        backgroundColor: 'rgba(17, 212, 30, 0.4)',
    },
    subjectItem: {
        alignItems: 'center',
        zIndex: 2,
    },
    subjectImageBorder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 3,
        borderWidth: 2,
        borderColor: '#11d41e',
        backgroundColor: '#081209',
        overflow: 'hidden',
        marginBottom: 8,
    },
    subjectImage: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
    subjectLabelLabel: {
        color: '#11d41e',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 2,
    },
    subjectName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    linkPillContainer: {
        position: 'absolute',
        top: 26,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 3,
    },
    linkPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#081209', // Overrides glass to block out the line behind it a bit
    },
    linkPillText: {
        color: 'rgba(17, 212, 30, 0.8)',
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    matchCircleContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    outerCircle: {
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerCircle: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(17, 212, 30, 0.1)',
        borderWidth: 8,
        borderColor: 'rgba(17, 212, 30, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#11d41e',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        // Hack for simulating exact green top half circle
        borderTopColor: '#11d41e',
        borderRightColor: '#11d41e',
        borderLeftColor: '#11d41e',
        borderBottomColor: 'rgba(17, 212, 30, 0.2)',
    },
    matchContent: {
        alignItems: 'center',
        paddingTop: 10,
    },
    matchValue: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
    },
    matchLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    confidenceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 32,
    },
    confidenceText: {
        color: 'rgba(17, 212, 30, 0.8)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardsList: {
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    listIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(17, 212, 30, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    listItemContent: {
        flex: 1,
    },
    listItemTitle: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    listItemValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    listItemCol: {
        padding: 16,
        paddingBottom: 24,
    },
    listItemRightGreen: {
        color: '#11d41e',
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#11d41e',
        borderRadius: 2,
    },
    listItemLink: {
        color: 'rgba(17, 212, 30, 0.8)',
        fontSize: 12,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    sectionTitle: {
        paddingHorizontal: 20,
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 12,
        marginTop: 8,
    },
    markersScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    markerPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    markerText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 32,
        backgroundColor: '#0c160e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    primaryBtn: {
        backgroundColor: '#11d41e',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryBtnText: {
        color: '#081209',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryBtnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        gap: 8,
    },
    secondaryBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
