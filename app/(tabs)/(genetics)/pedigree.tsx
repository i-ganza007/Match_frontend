import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { getAllAnimals, getSpeciesLabel, Animal } from '../../../services/animals';
import { getUserData } from '../../../services/secureStorage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const PLACEHOLDER = 'https://hzihqpbtzfseejihukvk.supabase.co/storage/v1/object/public/Animal_Images/avatar.jpg';
const { width: SW, height: SH } = Dimensions.get('window');

// ─── Canvas layout constants ──────────────────────────────────────────────────
const CW = 2800, CH = 2400;   // canvas dimensions
const CX = CW / 2;             // horizontal center
const YGP  = 300;              // grandparent row y
const YP   = 600;              // parent row y
const YS   = 920;              // subject y
const YSIB = 1180;             // sibling row y
const YOTH = 1480;             // unrelated animals row y

// Horizontal positions for tree nodes
const FX   = CX - 280;        // father
const MX   = CX + 280;        // mother
const PGFX = CX - 500;        // paternal grandfather
const PGMX = CX - 100;        // paternal grandmother
const MGFX = CX + 100;        // maternal grandfather
const MGMX = CX + 500;        // maternal grandmother

const INIT_SCALE   = 0.82;

// Node sizes per generation
const SZ_SUBJECT = 78;
const SZ_PARENT  = 62;
const SZ_GRAND   = 50;
const SZ_SIBLING = 50;
const SZ_OTHER   = 42;    // standalone — no spike

// ─── Edge: line connecting two canvas points ──────────────────────────────────
const Edge = ({
    x1, y1, x2, y2, dim = false,
}: {
    x1: number; y1: number; x2: number; y2: number; dim?: boolean;
}) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return null;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return (
        <View style={{
            position: 'absolute',
            left: (x1 + x2) / 2 - len / 2,
            top:  (y1 + y2) / 2 - 1,
            width: len, height: 2, borderRadius: 1,
            backgroundColor: dim ? 'rgba(17,212,30,0.1)' : 'rgba(17,212,30,0.35)',
            transform: [{ rotate: `${angle}deg` }],
        }} />
    );
};

// ─── Canvas node (map-pin style) ─────────────────────────────────────────────
const CanvasNode = ({
    animal, label, x, y,
    isSubject  = false,
    isStandalone = false,
    size = SZ_PARENT,
    onPress,
}: {
    animal: Animal | null;
    label: string;
    x: number; y: number;
    isSubject?: boolean;
    isStandalone?: boolean;
    size?: number;
    onPress: (id?: string) => void;
}) => {
    const ringColor   = isSubject ? '#11d41e' : 'rgba(255,255,255,0.22)';
    const spikeColor  = isSubject ? '#11d41e' : 'rgba(255,255,255,0.28)';
    const spikeW      = isSubject ? 8 : 5;
    const spikeH      = isSubject ? 12 : 8;

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onPress(animal?.animalId)}
            // Centre the pin-head circle on (x, y); spike hangs below
            style={[styles.node, { left: x - size / 2, top: y - size / 2 }]}
        >
            {/* Subject glow ring */}
            {isSubject && (
                <View style={{
                    position: 'absolute',
                    top: -6, left: -6,
                    width: size + 12, height: size + 12,
                    borderRadius: (size + 12) / 2,
                    borderWidth: 2.5, borderColor: '#11d41e',
                }} />
            )}

            {/* Pin head — avatar circle */}
            <View style={{
                width: size, height: size, borderRadius: size / 2,
                borderWidth: isStandalone ? 1.5 : 2,
                borderColor: isStandalone ? 'rgba(255,255,255,0.15)' : ringColor,
                overflow: 'hidden',
                opacity: !animal ? 0.28 : 1,
            }}>
                <Image
                    source={{ uri: animal?.profilePhoto ?? PLACEHOLDER }}
                    style={{ width: size, height: size }}
                />
            </View>

            {/* Pin spike — only for tree nodes */}
            {!isStandalone && (
                <View style={{
                    width: 0, height: 0,
                    borderLeftWidth: spikeW,
                    borderRightWidth: spikeW,
                    borderTopWidth: spikeH,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: spikeColor,
                    marginTop: 1,
                }} />
            )}

            {/* Label */}
            <Text
                style={[
                    styles.nodeLabel,
                    isSubject     && styles.nodeLabelGreen,
                    isStandalone  && { color: 'rgba(255,255,255,0.35)', fontSize: 9 },
                    { maxWidth: size + 28 },
                ]}
                numberOfLines={1}
            >
                {animal
                    ? (animal.name ?? getSpeciesLabel(animal.specie)).slice(0, 9)
                    : label}
            </Text>
        </TouchableOpacity>
    );
};

// ─── Generation label ─────────────────────────────────────────────────────────
const GenLabel = ({ text, y }: { text: string; y: number }) => (
    <Text style={[styles.genLabel, { top: y - 32 }]}>{text}</Text>
);

const getAge = (birthDate?: string | null) => {
    if (!birthDate) return null;
    const m = (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    return m < 12 ? `${Math.round(m)}m` : `${(m / 12).toFixed(1)}y`;
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PedigreeScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const { animalId: paramId } = useLocalSearchParams<{ animalId?: string }>();

    const [animals, setAnimals]       = useState<Animal[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [userId, setUserId]         = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(paramId ?? null);

    // ── Gesture shared values ────────────────────────────────────────────────
    const iTX = SW / 2 - CX * INIT_SCALE;
    const iTY = SH * 0.38 - YS * INIT_SCALE;
    const tX  = useSharedValue(iTX);
    const tY  = useSharedValue(iTY);
    const sTX = useSharedValue(iTX);
    const sTY = useSharedValue(iTY);
    const sc  = useSharedValue(INIT_SCALE);
    const sSc = useSharedValue(INIT_SCALE);

    useEffect(() => {
        (async () => {
            try {
                const [data, user] = await Promise.all([getAllAnimals(), getUserData()]);
                setAnimals(data);
                const uid = user?.userId ?? null;
                setUserId(uid);
                if (!selectedId) {
                    const first = (uid ? data.filter(a => a.ownerId === uid) : data)[0];
                    if (first) setSelectedId(first.animalId);
                }
            } catch (e: any) {
                setError(e.message ?? 'Failed to load animals');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── Tree derivation (null-safe at every level) ───────────────────────────
    const subject = selectedId ? (animals.find(a => a.animalId === selectedId) ?? null) : null;
    const father  = subject?.father ?? null;
    const mother  = subject?.mother ?? null;
    const pgf     = father?.father  ?? null;   // paternal grandfather
    const pgm     = father?.mother  ?? null;   // paternal grandmother
    const mgf     = mother?.father  ?? null;   // maternal grandfather
    const mgm     = mother?.mother  ?? null;   // maternal grandmother

    const knownAncestors = [father, mother, pgf, pgm, mgf, mgm].filter(Boolean).length;
    const myAnimals = userId ? animals.filter(a => a.ownerId === userId) : animals;

    const siblings = subject
        ? myAnimals.filter(a =>
            a.animalId !== subject.animalId &&
            ((subject.motherId && a.motherId === subject.motherId) ||
             (subject.fatherId && a.fatherId === subject.fatherId)))
        : [];

    const treeIds = new Set([
        subject?.animalId, father?.animalId, mother?.animalId,
        pgf?.animalId, pgm?.animalId, mgf?.animalId, mgm?.animalId,
        ...siblings.map(s => s.animalId),
    ].filter(Boolean) as string[]);
    const others = myAnimals.filter(a => !treeIds.has(a.animalId));

    // ── Position helpers ─────────────────────────────────────────────────────
    const sibX = (i: number) => CX + (i - (siblings.length - 1) / 2) * 160;
    const othX = (i: number) => CX + (i - (others.length - 1) / 2) * 160;

    // ── Gestures ─────────────────────────────────────────────────────────────
    const panG = Gesture.Pan()
        .activeOffsetX([-8, 8])
        .activeOffsetY([-8, 8])
        .onUpdate(e => {
            tX.value = sTX.value + e.translationX;
            tY.value = sTY.value + e.translationY;
        })
        .onEnd(() => {
            sTX.value = tX.value;
            sTY.value = tY.value;
        });

    const pinchG = Gesture.Pinch()
        .onUpdate(e => {
            sc.value = Math.max(0.3, Math.min(2.5, sSc.value * e.scale));
        })
        .onEnd(() => {
            sSc.value = sc.value;
        });

    const composed = Gesture.Simultaneous(panG, pinchG);

    const canvasStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: tX.value },
            { translateY: tY.value },
            { scale: sc.value },
        ],
    }));

    // Re-centre the view so the subject sits at 38% down the screen
    const snapToSubject = () => {
        const s = sSc.value;
        const tx = SW / 2 - CX * s;
        const ty = SH * 0.38 - YS * s;
        tX.value = withSpring(tx, { damping: 18 });
        tY.value = withSpring(ty, { damping: 18 });
        sTX.value = tx;
        sTY.value = ty;
    };

    const handleNodePress = (id?: string) => {
        if (!id) return;
        setSelectedId(id);
        snapToSubject();
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top']}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <MaterialIcons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Genetic Lineage</Text>
                <TouchableOpacity onPress={snapToSubject} style={[styles.iconBtn, styles.iconBtnGreen]}>
                    <MaterialCommunityIcons name="image-filter-center-focus" size={20} color="#11d41e" />
                </TouchableOpacity>
            </View>

            {/* ── States ── */}
            {loading && (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#11d41e" />
                    <Text style={styles.centerText}>Loading animals...</Text>
                </View>
            )}
            {!loading && error && (
                <View style={styles.centerBox}>
                    <MaterialIcons name="error-outline" size={40} color="rgba(255,80,80,0.8)" />
                    <Text style={[styles.centerText, { color: 'rgba(255,80,80,0.8)' }]}>{error}</Text>
                </View>
            )}
            {!loading && !error && myAnimals.length === 0 && (
                <View style={styles.centerBox}>
                    <MaterialCommunityIcons name="paw" size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.centerText}>No animals registered yet.</Text>
                </View>
            )}

            {/* ── Canvas ── */}
            {!loading && !error && myAnimals.length > 0 && (
                <GestureDetector gesture={composed}>
                    <View style={styles.viewport}>
                        <Animated.View style={[styles.canvas, canvasStyle]}>

                            {/* Faint horizontal generation bands */}
                            <View style={[styles.genBand, { top: YGP - 52 }]} />
                            <View style={[styles.genBand, { top: YP   - 52 }]} />
                            <View style={[styles.genBand, { top: YS   - 52 }]} />

                            {/* Generation labels */}
                            <GenLabel text="GRANDPARENTS" y={YGP} />
                            <GenLabel text="PARENTS"      y={YP}  />
                            <GenLabel text="SUBJECT"      y={YS}  />
                            {siblings.length > 0 && <GenLabel text="SIBLINGS"      y={YSIB} />}
                            {others.length   > 0 && <GenLabel text="OTHER ANIMALS" y={YOTH} />}

                            {/* ── Edges ── */}
                            {pgf && father && <Edge x1={PGFX} y1={YGP} x2={FX} y2={YP} />}
                            {pgm && father && <Edge x1={PGMX} y1={YGP} x2={FX} y2={YP} />}
                            {mgf && mother && <Edge x1={MGFX} y1={YGP} x2={MX} y2={YP} />}
                            {mgm && mother && <Edge x1={MGMX} y1={YGP} x2={MX} y2={YP} />}
                            {father && subject && <Edge x1={FX} y1={YP} x2={CX} y2={YS} />}
                            {mother && subject && <Edge x1={MX} y1={YP} x2={CX} y2={YS} />}
                            {/* Sibling edges — connect from shared parents */}
                            {siblings.map((sib, i) => (
                                <React.Fragment key={sib.animalId}>
                                    {father && sib.fatherId === subject?.fatherId && (
                                        <Edge x1={FX} y1={YP} x2={sibX(i)} y2={YSIB} dim />
                                    )}
                                    {mother && sib.motherId === subject?.motherId && (
                                        <Edge x1={MX} y1={YP} x2={sibX(i)} y2={YSIB} dim />
                                    )}
                                </React.Fragment>
                            ))}

                            {/* ── Grandparent nodes ── */}
                            <CanvasNode animal={pgf} label="G.Sire" x={PGFX} y={YGP} size={SZ_GRAND}   onPress={handleNodePress} />
                            <CanvasNode animal={pgm} label="G.Dam"  x={PGMX} y={YGP} size={SZ_GRAND}   onPress={handleNodePress} />
                            <CanvasNode animal={mgf} label="G.Sire" x={MGFX} y={YGP} size={SZ_GRAND}   onPress={handleNodePress} />
                            <CanvasNode animal={mgm} label="G.Dam"  x={MGMX} y={YGP} size={SZ_GRAND}   onPress={handleNodePress} />

                            {/* ── Parent nodes ── */}
                            <CanvasNode animal={father} label="Sire" x={FX} y={YP} size={SZ_PARENT} onPress={handleNodePress} />
                            <CanvasNode animal={mother} label="Dam"  x={MX} y={YP} size={SZ_PARENT} onPress={handleNodePress} />

                            {/* ── Subject node ── */}
                            {subject && (
                                <CanvasNode
                                    animal={subject} label=""
                                    x={CX} y={YS}
                                    size={SZ_SUBJECT}
                                    isSubject
                                    onPress={handleNodePress}
                                />
                            )}

                            {/* ── Sibling nodes ── */}
                            {siblings.map((sib, i) => (
                                <CanvasNode
                                    key={sib.animalId}
                                    animal={sib} label=""
                                    x={sibX(i)} y={YSIB}
                                    size={SZ_SIBLING}
                                    onPress={handleNodePress}
                                />
                            ))}

                            {/* ── Other animals — standalone circles, no spike ── */}
                            {others.map((o, i) => (
                                <CanvasNode
                                    key={o.animalId}
                                    animal={o} label=""
                                    x={othX(i)} y={YOTH}
                                    size={SZ_OTHER}
                                    isStandalone
                                    onPress={handleNodePress}
                                />
                            ))}

                        </Animated.View>
                    </View>
                </GestureDetector>
            )}

            {/* ── Subject info card ── */}
            {!loading && subject && (
                <View style={styles.infoCard}>
                    <Image
                        source={{ uri: subject.profilePhoto ?? PLACEHOLDER }}
                        style={styles.infoAvatar}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoName} numberOfLines={1}>
                            {subject.name ?? getSpeciesLabel(subject.specie)}
                        </Text>
                        <Text style={styles.infoSub} numberOfLines={1}>
                            {getSpeciesLabel(subject.specie)} · {subject.sex}
                            {getAge(subject.birthDate) ? ` · ${getAge(subject.birthDate)}` : ''}
                        </Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLbl}>PURITY</Text>
                        <Text style={styles.statVal}>
                            {subject.breed_confidence != null
                                ? `${(subject.breed_confidence * 100).toFixed(0)}%`
                                : '—'}
                        </Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLbl}>LINEAGE</Text>
                        <Text style={styles.statVal}>{knownAncestors}/6</Text>
                    </View>
                </View>
            )}

            {/* ── Bottom nav ── */}
            <View style={styles.navContainer}>
                <View style={styles.navBar}>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home' as any)}>
                        <MaterialCommunityIcons name="paw" size={24} color="rgba(255,255,255,0.4)" />
                        <Text style={[styles.navText, { color: 'rgba(255,255,255,0.4)' }]}>Flock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialCommunityIcons name="graph-outline" size={24} color="#11d41e" />
                        <Text style={styles.navTextActive}>Pedigree</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialCommunityIcons name="heart-pulse" size={24} color="rgba(255,255,255,0.4)" />
                        <Text style={[styles.navText, { color: 'rgba(255,255,255,0.4)' }]}>Health</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialCommunityIcons name="store" size={24} color="rgba(255,255,255,0.4)" />
                        <Text style={[styles.navText, { color: 'rgba(255,255,255,0.4)' }]}>Market</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Image
                            source={{ uri: PLACEHOLDER }}
                            style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFD700' }}
                        />
                    </TouchableOpacity>
                </View>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#081209' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
        justifyContent: 'space-between',
    },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    iconBtnGreen: {
        backgroundColor: 'rgba(17,212,30,0.07)',
        borderColor: 'rgba(17,212,30,0.25)',
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1, marginLeft: 16 },

    // Loading / error
    centerBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    centerText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },

    // Canvas
    viewport: { flex: 1, overflow: 'hidden' },
    canvas:   { width: CW, height: CH, backgroundColor: '#081209' },
        genBand: {
            position: 'absolute', left: 0, right: 0, height: SZ_GRAND + 60,
            backgroundColor: 'rgba(255,255,255,0.018)',
        },
    genLabel: {
        position: 'absolute', left: 48,
        color: 'rgba(255,255,255,0.18)',
        fontSize: 10, fontWeight: '700', letterSpacing: 2,
    },

    // Node
    node: { position: 'absolute', alignItems: 'center' },
    nodeLabel: {
        color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '600',
        marginTop: 5, textAlign: 'center',
    },
    nodeLabelGreen: { color: '#11d41e', fontWeight: 'bold', fontSize: 11 },

    // Info card
    infoCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginHorizontal: 16, marginBottom: 10,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    infoAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#11d41e' },
    infoName:   { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    infoSub:    { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
    stat:       { alignItems: 'center', minWidth: 52 },
    statLbl:    { color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
    statVal:    { color: '#11d41e', fontSize: 17, fontWeight: 'bold' },

    // Nav
    navContainer: { paddingHorizontal: 16, paddingBottom: 20 },
    navBar: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 16, borderRadius: 999,
        backgroundColor: '#081209',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    navItem:      { alignItems: 'center', gap: 4 },
    navTextActive:{ fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5, color: '#11d41e' },
    navText:      { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
});
