import React, { useState, useEffect, useRef } from 'react';
import {
    Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, TextInput, Dimensions, Animated, KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import {
    BreedingRec,
    getRecommendations,
    acceptRecommendation,
    submitFeedback,
} from '../services/recommendations';
import { Animal, getSpeciesLabel } from '../services/animals';

const PRIMARY      = '#ec5b13';
const BG           = '#221610';
const CARD_BG      = 'rgba(255,255,255,0.05)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const TEXT         = '#f1f5f9';
const TEXT_MUTED   = '#94a3b8';
const SUCCESS      = '#22c55e';
const DANGER       = '#ef4444';
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

// ── helpers ───────────────────────────────────────────────────────────────────

function daysAgo(iso: string): string {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (d === 0) return 'today';
    if (d === 1) return '1 day ago';
    return `${d} days ago`;
}

function pct(v: number) { return `${Math.round(v * 100)}%`; }

// ── sub-components ────────────────────────────────────────────────────────────

function ScoreRow({ label, value, color }: { label: string; value: number; color: string }) {
    const p = Math.round(value * 100);
    return (
        <View style={s.scoreRow}>
            <View style={s.scoreHeader}>
                <Text style={s.scoreLabel}>{label}</Text>
                <Text style={[s.scoreValue, { color }]}>{p}%</Text>
            </View>
            <View style={s.scoreTrack}>
                <View style={[s.scoreFill, { width: `${p}%` as any, backgroundColor: color }]} />
            </View>
        </View>
    );
}

interface RecCardProps {
    rec: BreedingRec;
    accepted: boolean;       // this particular rec was accepted
    anyAccepted: boolean;    // any rec for this animal was accepted
    onAccept: () => void;
    acceptLoading: boolean;
}

function RecCard({ rec, accepted, anyAccepted, onAccept, acceptLoading }: RecCardProps) {
    const [feedbackOpen, setFeedbackOpen]       = useState(false);
    const [feedbackText, setFeedbackText]       = useState(rec.userFeedback ?? '');
    const [feedbackSaving, setFeedbackSaving]   = useState(false);
    const [feedbackSaved, setFeedbackSaved]     = useState(false);

    const animal      = rec.recommendedAnimal;
    const locked      = rec.locked;
    const canAccept   = !accepted && !anyAccepted && !locked;
    const initials    = animal?.name ? animal.name.slice(0, 2).toUpperCase() : '??';
    const overallPct  = Math.round(rec.overall_score * 100);

    const handleFeedback = async () => {
        if (!feedbackText.trim()) return;
        setFeedbackSaving(true);
        try {
            await submitFeedback(rec.breedingRecId, feedbackText.trim());
            setFeedbackSaved(true);
            setTimeout(() => setFeedbackSaved(false), 2500);
        } catch { /* silent */ }
        finally { setFeedbackSaving(false); }
    };

    return (
        <View style={[s.recCard, accepted && s.recCardAccepted]}>
            {/* ── Top badges ───────────────────────────────────────── */}
            <View style={s.recBadgeRow}>
                {locked && (
                    <View style={s.lockedBadge}>
                        <MaterialIcons name="lock" size={10} color={TEXT_MUTED} />
                        <Text style={s.lockedBadgeText}>LOCKED</Text>
                    </View>
                )}
                {accepted && (
                    <View style={s.acceptedBadge}>
                        <MaterialIcons name="check-circle" size={11} color={SUCCESS} />
                        <Text style={s.acceptedBadgeText}>BREEDING INITIATED</Text>
                    </View>
                )}
                <Text style={s.scoreChip}>{overallPct}% match</Text>
            </View>

            {/* ── Animal info ───────────────────────────────────────── */}
            <View style={s.recAnimalRow}>
                <View style={s.recAvatarWrap}>
                    {animal?.profilePhoto ? (
                        <Image
                            source={{ uri: animal.profilePhoto }}
                            style={s.recAvatar}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={s.recAvatarPlaceholder}>
                            <Text style={s.recAvatarInitials}>{initials}</Text>
                        </View>
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.recAnimalName} numberOfLines={1}>
                        {animal?.name ?? `#${rec.recommendedAnimalId.slice(-6)}`}
                    </Text>
                    <Text style={s.recAnimalSub} numberOfLines={1}>
                        {getSpeciesLabel(animal?.specie)} · {animal?.sex === 'MALE' ? 'Male' : 'Female'}
                    </Text>
                </View>
                {/* Accept */}
                <TouchableOpacity
                    style={[s.acceptBtn, !canAccept && s.acceptBtnDisabled]}
                    onPress={canAccept ? onAccept : undefined}
                    disabled={!canAccept || acceptLoading}
                >
                    {acceptLoading ? (
                        <ActivityIndicator size="small" color={BG} />
                    ) : (
                        <Text style={[s.acceptBtnText, !canAccept && s.acceptBtnTextDisabled]}>
                            {accepted ? 'Accepted' : anyAccepted ? 'Unavailable' : 'Accept'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* ── Scores ───────────────────────────────────────────── */}
            <View style={s.scoresBlock}>
                <ScoreRow label="Overall match"          value={rec.overall_score}                 color={PRIMARY} />
                <ScoreRow label="Genetic diversity"      value={rec.genetic_diversity_score}        color="#06b6d4" />
                <ScoreRow label="Breed compatibility"    value={rec.breed_composition_match_score}  color={SUCCESS} />
                <ScoreRow
                    label="Inbreeding risk"
                    value={1 - rec.inbreeding_risk_score}   // invert: lower risk = higher bar
                    color={rec.inbreeding_risk_score > 0.5 ? DANGER : '#f59e0b'}
                />
            </View>

            {/* ── Feedback ─────────────────────────────────────────── */}
            <TouchableOpacity
                style={s.feedbackToggle}
                onPress={() => setFeedbackOpen(v => !v)}
            >
                <MaterialIcons
                    name={feedbackOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={16}
                    color={TEXT_MUTED}
                />
                <Text style={s.feedbackToggleText}>
                    {feedbackOpen ? 'Hide feedback' : rec.userFeedback ? 'Edit feedback' : 'Give feedback'}
                </Text>
            </TouchableOpacity>

            {feedbackOpen && (
                <View style={s.feedbackBox}>
                    <TextInput
                        style={s.feedbackInput}
                        value={feedbackText}
                        onChangeText={setFeedbackText}
                        placeholder="Share your thoughts on this match…"
                        placeholderTextColor={TEXT_MUTED}
                        multiline
                        numberOfLines={3}
                    />
                    <TouchableOpacity
                        style={[s.feedbackSubmit, feedbackSaving && { opacity: 0.6 }]}
                        onPress={handleFeedback}
                        disabled={feedbackSaving || !feedbackText.trim()}
                    >
                        {feedbackSaving ? (
                            <ActivityIndicator size="small" color={BG} />
                        ) : (
                            <Text style={s.feedbackSubmitText}>
                                {feedbackSaved ? '✓ Saved' : 'Submit'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
    visible: boolean;
    animal: Animal | null;
    cachedRecs?: BreedingRec[];
    onClose: () => void;
    onCacheUpdate: (animalId: string, recs: BreedingRec[]) => void;
    onAcceptSuccess: (animalId: string) => void;
}

export default function RecommendationsModal({
    visible, animal, cachedRecs, onClose, onCacheUpdate, onAcceptSuccess,
}: Props) {
    const [recs, setRecs]           = useState<BreedingRec[]>([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    // track which rec (if any) was accepted in this session
    const [acceptedRecId, setAcceptedRecId] = useState<string | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);

    // Load recs whenever the modal opens for a new animal
    useEffect(() => {
        if (!visible || !animal) return;
        console.log('[RecsUI][Modal] open', {
            animalId: animal.animalId,
            animalName: animal.name,
            type: animal.type,
            sex: animal.sex,
            recommendable: animal.recommendable,
            cachedCount: cachedRecs?.length ?? 0,
            refreshTick,
        });

        // Reset per-session accept state when switching animals
        setAcceptedRecId(null);

        // Only reuse cache when it has data; an empty cached array can be stale.
        if (cachedRecs && cachedRecs.length > 0) {
            console.log('[RecsUI][Modal] using cache', {
                animalId: animal.animalId,
                cachedCount: cachedRecs.length,
            });
            setRecs(cachedRecs);
            // Restore accepted state from cache
            const alreadyAccepted = cachedRecs.find(r => r.user_accepted);
            if (alreadyAccepted) setAcceptedRecId(alreadyAccepted.breedingRecId);
            return;
        }

        console.log('[RecsUI][Modal] requesting backend recommendations', {
            animalId: animal.animalId,
            reason: refreshTick > 0 ? 'manual-refresh' : 'initial-or-no-cache',
        });
        setLoading(true);
        setError(null);
        getRecommendations(animal.animalId)
            .then(data => {
                console.log('[RecsUI][Modal] received backend recommendations', {
                    animalId: animal.animalId,
                    count: data.length,
                });
                if (data.length === 0) {
                    console.log('[RecsUI][Modal] backend returned zero candidates', {
                        animalId: animal.animalId,
                        ownerId: animal.ownerId,
                        type: animal.type,
                        sex: animal.sex,
                    });
                }
                setRecs(data);
                onCacheUpdate(animal.animalId, data);
                const alreadyAccepted = data.find(r => r.user_accepted);
                if (alreadyAccepted) setAcceptedRecId(alreadyAccepted.breedingRecId);
            })
            .catch(err => {
                const status = err?.response?.status;
                console.warn('[RecsUI][Modal] load failed', {
                    animalId: animal.animalId,
                    status,
                    message: err?.response?.data?.message ?? err?.message,
                    data: err?.response?.data,
                });
                if (status === 400) {
                    setError('This animal is currently in an active breeding and cannot receive recommendations.');
                } else {
                    setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load recommendations.');
                }
            })
            .finally(() => setLoading(false));
    }, [visible, animal?.animalId, refreshTick]);

    const handleAccept = async (recId: string) => {
        console.log('[RecsUI][Modal] accept recommendation requested', {
            animalId: animal?.animalId,
            recId,
        });
        setAcceptingId(recId);
        try {
            await acceptRecommendation(recId);
            console.log('[RecsUI][Modal] accept recommendation success', {
                animalId: animal?.animalId,
                recId,
            });
            setAcceptedRecId(recId);
            // Update local recs state
            setRecs(prev => prev.map(r =>
                r.breedingRecId === recId ? { ...r, user_accepted: true } : r,
            ));
            if (animal) onAcceptSuccess(animal.animalId);
        } catch (e: any) {
            // Not crashing the whole modal — just log
            console.warn('[Recs] Accept failed:', e?.response?.data ?? e?.message);
        } finally {
            setAcceptingId(null);
        }
    };

    const generatedAt = recs[0]?.generatedAt;
    const anyAccepted = !!acceptedRecId;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={s.overlay}>
                <TouchableOpacity style={s.overlayBg} onPress={onClose} activeOpacity={1} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={s.sheet}
                >
                    {/* Handle */}
                    <View style={s.handle} />

                    {/* Header */}
                    <View style={s.sheetHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.sheetTitle} numberOfLines={1}>
                                Recommendations{animal?.name ? ` for ${animal.name}` : ''}
                            </Text>
                            {generatedAt && !loading && (
                                <Text style={s.sheetSub}>Last updated {daysAgo(generatedAt)}</Text>
                            )}
                        </View>
                        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                            <MaterialIcons name="close" size={20} color={TEXT} />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    {loading ? (
                        <View style={s.stateBox}>
                            <ActivityIndicator size="large" color={PRIMARY} />
                            <Text style={s.stateTitle}>Finding best genetic matches…</Text>
                            <Text style={s.stateSub}>This may take up to 30 seconds on first run</Text>
                        </View>
                    ) : error ? (
                        <View style={s.stateBox}>
                            <MaterialIcons name="info-outline" size={44} color={TEXT_MUTED} />
                            <Text style={s.stateTitle}>No recommendations</Text>
                            <Text style={s.stateSub}>{error}</Text>
                        </View>
                    ) : recs.length === 0 ? (
                        <View style={s.stateBox}>
                            <MaterialIcons name="search-off" size={44} color={TEXT_MUTED} />
                            <Text style={s.stateTitle}>No candidates found</Text>
                            <Text style={s.stateSub}>The backend returned 0 candidates for this animal at the moment.</Text>
                            <TouchableOpacity
                                style={s.retryBtn}
                                onPress={() => {
                                    console.log('[RecsUI][Modal] manual refresh requested', {
                                        animalId: animal?.animalId,
                                        previousRefreshTick: refreshTick,
                                    });
                                    setRefreshTick(t => t + 1);
                                }}
                            >
                                <MaterialIcons name="refresh" size={16} color="#fff" />
                                <Text style={s.retryBtnText}>Refresh Matches</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView
                            contentContainerStyle={s.listContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {recs.map(rec => (
                                <RecCard
                                    key={rec.breedingRecId}
                                    rec={rec}
                                    accepted={rec.breedingRecId === acceptedRecId}
                                    anyAccepted={anyAccepted}
                                    onAccept={() => handleAccept(rec.breedingRecId)}
                                    acceptLoading={acceptingId === rec.breedingRecId}
                                />
                            ))}
                        </ScrollView>
                    )}
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        backgroundColor: BG,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderColor: GLASS_BORDER,
        maxHeight: SCREEN_H * 0.88,
        minHeight: 280,
    },
    handle: {
        width: 40, height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: GLASS_BORDER,
        gap: 12,
    },
    sheetTitle:  { fontSize: 17, fontWeight: '800', color: TEXT },
    sheetSub:    { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: CARD_BG,
        borderWidth: 1, borderColor: GLASS_BORDER,
        alignItems: 'center', justifyContent: 'center',
    },

    stateBox: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
        gap: 12,
    },
    stateTitle: { fontSize: 16, fontWeight: '700', color: TEXT, textAlign: 'center' },
    stateSub:   { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20 },
    retryBtn: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: PRIMARY,
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    retryBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    listContent: { padding: 16, gap: 14, paddingBottom: 32 },

    // ── RecCard ──────────────────────────────────────────────────────────────
    recCard: {
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 18,
        padding: 16,
        gap: 12,
    },
    recCardAccepted: {
        borderColor: SUCCESS + '55',
        backgroundColor: SUCCESS + '08',
    },
    recBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    lockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.07)',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 999,
    },
    lockedBadgeText: { fontSize: 9, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 0.5 },
    acceptedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: SUCCESS + '22',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 999,
    },
    acceptedBadgeText: { fontSize: 9, color: SUCCESS, fontWeight: '700', letterSpacing: 0.5 },
    scoreChip: {
        marginLeft: 'auto' as any,
        fontSize: 12,
        fontWeight: '800',
        color: PRIMARY,
    },

    recAnimalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    recAvatarWrap: {
        width: 50, height: 50, borderRadius: 25,
        overflow: 'hidden',
    },
    recAvatar: { width: '100%', height: '100%' },
    recAvatarPlaceholder: {
        flex: 1,
        backgroundColor: PRIMARY + '22',
        alignItems: 'center', justifyContent: 'center',
    },
    recAvatarInitials: { fontSize: 16, fontWeight: '900', color: PRIMARY },
    recAnimalName: { fontSize: 15, fontWeight: '700', color: TEXT },
    recAnimalSub:  { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },

    acceptBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: PRIMARY,
        minWidth: 74,
        alignItems: 'center',
    },
    acceptBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    acceptBtnText:         { fontSize: 13, fontWeight: '700', color: BG },
    acceptBtnTextDisabled: { color: TEXT_MUTED },

    scoresBlock: { gap: 8 },
    scoreRow:    {},
    scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    scoreLabel:  { fontSize: 11, color: TEXT_MUTED },
    scoreValue:  { fontSize: 11, fontWeight: '700' },
    scoreTrack:  { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
    scoreFill:   { height: '100%', borderRadius: 3 },

    feedbackToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingVertical: 2,
    },
    feedbackToggleText: { fontSize: 12, color: TEXT_MUTED },

    feedbackBox: { gap: 8 },
    feedbackInput: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: TEXT,
        minHeight: 72,
        textAlignVertical: 'top',
    },
    feedbackSubmit: {
        backgroundColor: PRIMARY,
        borderRadius: 999,
        paddingVertical: 9,
        alignItems: 'center',
    },
    feedbackSubmitText: { fontSize: 13, fontWeight: '700', color: BG },
});
