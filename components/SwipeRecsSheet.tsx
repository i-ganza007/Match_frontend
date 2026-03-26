/**
 * SwipeRecsSheet — Tinder-style breeding recommendation swiper.
 *
 * Swipe right  →  Accept  →  "It's a Match!" congrats if accepted
 * Swipe left   →  Skip    →  next card
 *
 * After a match: user can open the partner farmer's chat or keep swiping.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Modal, View, Text, StyleSheet, Animated, PanResponder,
    TouchableOpacity, ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    BreedingRec,
    getRecommendations,
    acceptRecommendation,
} from '../services/recommendations';
import { Animal, getSpeciesLabel } from '../services/animals';

// ── constants ─────────────────────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const FLY_DURATION    = 300;
const CARD_H          = H * 0.60;

const PRIMARY      = '#ec5b13';
const BG           = '#1a0f09';
const CARD_BG      = '#2a1810';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const TEXT         = '#f1f5f9';
const TEXT_MUTED   = '#94a3b8';
const SUCCESS      = '#22c55e';
const DANGER       = '#ef4444';

// ── confetti particle ─────────────────────────────────────────────────────────

const CONFETTI_COLORS = [PRIMARY, SUCCESS, '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#fbbf24'];

function Particle({ color, delay }: { color: string; delay: number }) {
    const ty      = useRef(new Animated.Value(0)).current;
    const tx      = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const rotate  = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const dx  = (Math.random() - 0.5) * W * 1.2;
        const dy  = -(Math.random() * H * 0.55 + 80);
        const dur = 900 + Math.random() * 500;
        Animated.parallel([
            Animated.timing(ty,      { toValue: dy,  duration: dur,       delay, useNativeDriver: true }),
            Animated.timing(tx,      { toValue: dx,  duration: dur,       delay, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0,   duration: dur * 0.6, delay: delay + dur * 0.4, useNativeDriver: true }),
            Animated.timing(rotate,  { toValue: 1,   duration: dur,       delay, useNativeDriver: true }),
        ]).start();
    }, []);

    const rot = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const size = 6 + Math.random() * 8;

    return (
        <Animated.View style={{
            position: 'absolute',
            bottom: H * 0.38,
            left: W / 2,
            width: size, height: size,
            borderRadius: Math.random() > 0.5 ? size / 2 : 2,
            backgroundColor: color,
            transform: [{ translateY: ty }, { translateX: tx }, { rotate: rot }],
            opacity,
        }} />
    );
}

// ── match congrats overlay ────────────────────────────────────────────────────

interface CongratsProps {
    rec: BreedingRec;
    myAnimal: Animal;
    onChat: () => void;
    onContinue: () => void;
}

function MatchCongratsOverlay({ rec, myAnimal, onChat, onContinue }: CongratsProps) {
    const scale   = useRef(new Animated.Value(0.6)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const titleY  = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.parallel([
            Animated.spring(scale,  { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
            Animated.timing(opacity,{ toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.spring(titleY, { toValue: 0, friction: 8,  tension: 60, useNativeDriver: true }),
        ]).start();
    }, []);

    const partner  = rec.recommendedAnimal;
    const particles = Array.from({ length: 22 }, (_, i) => ({
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: i * 45,
    }));

    const myInitials      = myAnimal.name ? myAnimal.name.slice(0, 2).toUpperCase() : 'ME';
    const partnerInitials = partner?.name  ? partner.name.slice(0, 2).toUpperCase()  : '??';

    return (
        <Animated.View style={[cs.overlay, { opacity }]}>
            {/* Confetti */}
            {particles.map((p, i) => <Particle key={i} color={p.color} delay={p.delay} />)}

            <Animated.View style={[cs.card, { transform: [{ scale }] }]}>
                {/* Photos */}
                <View style={cs.photosRow}>
                    <View style={[cs.avatarRing, { borderColor: PRIMARY + '88' }]}>
                        {myAnimal.profilePhoto ? (
                            <Image source={{ uri: myAnimal.profilePhoto }} style={cs.avatar} contentFit="cover" />
                        ) : (
                            <View style={[cs.avatar, cs.avatarFallback]}>
                                <Text style={cs.avatarInitials}>{myInitials}</Text>
                            </View>
                        )}
                    </View>

                    <View style={cs.heartCircle}>
                        <Text style={{ fontSize: 28 }}>❤️</Text>
                    </View>

                    <View style={[cs.avatarRing, { borderColor: SUCCESS + '88' }]}>
                        {partner?.profilePhoto ? (
                            <Image source={{ uri: partner.profilePhoto }} style={cs.avatar} contentFit="cover" />
                        ) : (
                            <View style={[cs.avatar, cs.avatarFallback]}>
                                <Text style={cs.avatarInitials}>{partnerInitials}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Text */}
                <Animated.View style={{ transform: [{ translateY: titleY }] }}>
                    <Text style={cs.title}>It's a Match!</Text>
                    <Text style={cs.subtitle}>
                        {myAnimal.name ?? 'Your animal'} and{' '}
                        {partner?.name ?? 'their animal'} are a great genetic pair.{'\n'}
                        Connect with their farmer to arrange the breeding.
                    </Text>
                </Animated.View>

                {/* Score pill */}
                <View style={cs.scorePill}>
                    <MaterialIcons name="verified" size={14} color={PRIMARY} />
                    <Text style={cs.scoreText}>
                        {Math.round(rec.overall_score * 100)}% overall match
                    </Text>
                </View>

                {/* Buttons */}
                <TouchableOpacity style={cs.chatBtn} onPress={onChat}>
                    <MaterialIcons name="chat-bubble" size={18} color={BG} />
                    <Text style={cs.chatBtnText}>Chat with Farmer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={cs.continueBtn} onPress={onContinue}>
                    <Text style={cs.continueBtnText}>Keep Swiping</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

// ── swipe card ────────────────────────────────────────────────────────────────

interface SwipeCardProps {
    rec: BreedingRec;
    index: number;           // 0 = front, 1 = middle, 2 = back
    position: Animated.ValueXY;
    panHandlers: object;
    isTop: boolean;
}

function SwipeCard({ rec, index, position, panHandlers, isTop }: SwipeCardProps) {
    const animal = rec.recommendedAnimal;
    const name   = animal?.name ?? `#${rec.recommendedAnimalId.slice(-6)}`;
    const score  = Math.round(rec.overall_score * 100);

    // Cards behind the top card scale up slightly as top card is dragged
    const backScale = isTop
        ? 1
        : position.x.interpolate({
              inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
              outputRange: [1, index === 1 ? 0.94 : 0.88, 1],
              extrapolate: 'clamp',
          });

    const cardStyle: any = isTop
        ? {
              transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  {
                      rotate: position.x.interpolate({
                          inputRange: [-W / 2, 0, W / 2],
                          outputRange: ['-18deg', '0deg', '18deg'],
                          extrapolate: 'clamp',
                      }),
                  },
              ],
          }
        : {
              transform: [
                  { scale: backScale as any },
                  { translateY: index === 1 ? -14 : -28 },
              ],
          };

    // Overlay colors while swiping (top card only)
    const likeOpacity = isTop
        ? position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD * 0.6], outputRange: [0, 1], extrapolate: 'clamp' })
        : new Animated.Value(0);
    const nopeOpacity = isTop
        ? position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD * 0.6, 0], outputRange: [1, 0], extrapolate: 'clamp' })
        : new Animated.Value(0);

    return (
        <Animated.View
            style={[card.container, cardStyle, { zIndex: 10 - index }]}
            {...(isTop ? panHandlers : {})}
        >
            {/* Photo */}
            <View style={card.imageWrap}>
                {animal?.profilePhoto ? (
                    <Image source={{ uri: animal.profilePhoto }} style={card.image} contentFit="cover" />
                ) : (
                    <View style={[card.image, card.imageFallback]}>
                        <Text style={card.fallbackInitials}>
                            {name.slice(0, 2).toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* LIKE stamp */}
                <Animated.View style={[card.stamp, card.stampLike, { opacity: likeOpacity }]}>
                    <Text style={card.stampLikeText}>LIKE</Text>
                </Animated.View>

                {/* NOPE stamp */}
                <Animated.View style={[card.stamp, card.stampNope, { opacity: nopeOpacity }]}>
                    <Text style={card.stampNopeText}>NOPE</Text>
                </Animated.View>

                {/* Gradient overlay at bottom */}
                <View style={card.gradient} />

                {/* Info overlaid on photo */}
                <View style={card.infoOverlay}>
                    <View style={card.infoRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={card.animalName} numberOfLines={1}>{name}</Text>
                            <Text style={card.animalSub}>
                                {getSpeciesLabel(animal?.specie)} · {animal?.sex === 'MALE' ? 'Male' : 'Female'}
                            </Text>
                        </View>
                        <View style={card.scoreBubble}>
                            <Text style={card.scoreText}>{score}%</Text>
                            <Text style={card.scoreLabel}>match</Text>
                        </View>
                    </View>

                    {/* Score pills */}
                    <View style={card.pillsRow}>
                        <ScorePill
                            label="Genetic"
                            value={rec.genetic_diversity_score}
                            color="#06b6d4"
                        />
                        <ScorePill
                            label="Breed"
                            value={rec.breed_composition_match_score}
                            color={SUCCESS}
                        />
                        <ScorePill
                            label="Risk"
                            value={1 - rec.inbreeding_risk_score}
                            color={rec.inbreeding_risk_score > 0.5 ? DANGER : '#f59e0b'}
                        />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={[card.pill, { backgroundColor: color + '28', borderColor: color + '55' }]}>
            <Text style={[card.pillText, { color }]}>
                {label} {Math.round(value * 100)}%
            </Text>
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

export default function SwipeRecsSheet({
    visible, animal, cachedRecs, onClose, onCacheUpdate, onAcceptSuccess,
}: Props) {
    const router = useRouter();

    const [recs, setRecs]           = useState<BreedingRec[]>([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [index, setIndex]         = useState(0);
    const [accepting, setAccepting] = useState(false);
    const [matchedRec, setMatchedRec] = useState<BreedingRec | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const position = useRef(new Animated.ValueXY()).current;
    const currentRecRef = useRef<BreedingRec | null>(null);
    const doAcceptRef = useRef<(rec: BreedingRec) => void>(() => {});
    const doSwipeLeftRef = useRef<() => void>(() => {});
    const resetPositionRef = useRef<() => void>(() => {});

    // ── load recs ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!visible || !animal) return;
        console.log('[RecsUI][Swipe] open', {
            animalId: animal.animalId,
            animalName: animal.name,
            type: animal.type,
            sex: animal.sex,
            recommendable: animal.recommendable,
            retryCount,
            cachedCount: cachedRecs?.length ?? 0,
        });
        setIndex(0);
        setMatchedRec(null);
        position.setValue({ x: 0, y: 0 });

        // Only reuse cache when it has data; empty cache can be stale.
        if (cachedRecs && cachedRecs.length > 0 && retryCount === 0) {
            console.log('[RecsUI][Swipe] using cache', {
                animalId: animal.animalId,
                cachedCount: cachedRecs.length,
            });
            setRecs(cachedRecs);
            return;
        }
        console.log('[RecsUI][Swipe] requesting backend recommendations', {
            animalId: animal.animalId,
            reason: retryCount > 0 ? 'retry' : 'initial-or-no-cache',
        });
        setLoading(true);
        setError(null);
        getRecommendations(animal.animalId)
            .then(data => {
                console.log('[RecsUI][Swipe] received backend recommendations', {
                    animalId: animal.animalId,
                    count: data.length,
                });
                if (data.length === 0) {
                    console.log('[RecsUI][Swipe] backend returned zero candidates', {
                        animalId: animal.animalId,
                        ownerId: animal.ownerId,
                        type: animal.type,
                        sex: animal.sex,
                    });
                }
                setRecs(data);
                onCacheUpdate(animal.animalId, data);
            })
            .catch(err => {
                const status = err?.response?.status;
                const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
                console.warn('[RecsUI][Swipe] load failed', {
                    animalId: animal.animalId,
                    status,
                    code: err?.code,
                    message: err?.response?.data?.message ?? err?.message,
                    data: err?.response?.data,
                });
                if (status === 400) {
                    setError('This animal is in an active breeding and cannot receive new recommendations.');
                } else if (status === 503 || status === 502 || status === 504) {
                    setError('The server is starting up — please wait a moment and try again.');
                } else if (isTimeout) {
                    setError('The server is still generating matches. Tap "Try Again" — it should be ready now.');
                } else if (!err?.response) {
                    setError('Could not reach the server. Check your internet connection and try again.');
                } else {
                    setError(err?.response?.data?.message ?? 'Failed to load recommendations.');
                }
            })
            .finally(() => setLoading(false));
    }, [visible, animal?.animalId, retryCount]);

    const handleRetry = useCallback(() => {
        console.log('[RecsUI][Swipe] retry requested', {
            animalId: animal?.animalId,
            previousRetryCount: retryCount,
        });
        setRetryCount(c => c + 1);
    }, [animal?.animalId, retryCount]);

    // ── swipe helpers ─────────────────────────────────────────────────────────
    const resetPosition = useCallback(() => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
        }).start();
    }, [position]);

    const flyOff = useCallback((direction: 'left' | 'right', onDone: () => void) => {
        Animated.timing(position, {
            toValue: { x: direction === 'right' ? W * 1.5 : -W * 1.5, y: 0 },
            duration: FLY_DURATION,
            useNativeDriver: false,
        }).start(() => { position.setValue({ x: 0, y: 0 }); onDone(); });
    }, [position]);

    const nextCard = useCallback(() => setIndex(i => i + 1), []);

    const doSwipeLeft = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        flyOff('left', nextCard);
    }, [flyOff, nextCard]);

    const doAccept = useCallback(async (rec: BreedingRec) => {
        if (accepting) return;
        console.log('[RecsUI][Swipe] accept recommendation requested', {
            animalId: animal?.animalId,
            recId: rec.breedingRecId,
            recommendedAnimalId: rec.recommendedAnimalId,
        });
        setAccepting(true);
        flyOff('right', async () => {
            try {
                await acceptRecommendation(rec.breedingRecId);
                console.log('[RecsUI][Swipe] accept recommendation success', {
                    animalId: animal?.animalId,
                    recId: rec.breedingRecId,
                });
                setMatchedRec(rec);
                if (animal) onAcceptSuccess(animal.animalId);
            } catch (error: any) {
                console.warn('[RecsUI][Swipe] accept recommendation failed', {
                    animalId: animal?.animalId,
                    recId: rec.breedingRecId,
                    status: error?.response?.status,
                    message: error?.response?.data?.message ?? error?.message,
                    data: error?.response?.data,
                });
                // Accept failed silently — still advance
                nextCard();
            } finally {
                setAccepting(false);
            }
        });
    }, [accepting, flyOff, nextCard, animal, onAcceptSuccess]);

    useEffect(() => {
        currentRecRef.current = recs[index] ?? null;
    }, [recs, index]);

    useEffect(() => {
        doAcceptRef.current = (rec: BreedingRec) => {
            void doAccept(rec);
        };
    }, [doAccept]);

    useEffect(() => {
        doSwipeLeftRef.current = doSwipeLeft;
    }, [doSwipeLeft]);

    useEffect(() => {
        resetPositionRef.current = resetPosition;
    }, [resetPosition]);

    // ── pan responder ─────────────────────────────────────────────────────────
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, g) => {
                position.setValue({ x: g.dx, y: g.dy });
                if (Math.abs(g.dx) > 20) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
            },
            onPanResponderRelease: (_, g) => {
                const currentRec = currentRecRef.current;

                if (g.dx > SWIPE_THRESHOLD && currentRec) {
                    doAcceptRef.current(currentRec);
                } else if (g.dx < -SWIPE_THRESHOLD) {
                    doSwipeLeftRef.current();
                } else {
                    resetPositionRef.current();
                }
            },
        }),
    ).current;

    // ── render ────────────────────────────────────────────────────────────────
    const remaining  = recs.slice(index, index + 3);
    const isDone     = !loading && !error && recs.length > 0 && index >= recs.length;

    const navigateToChat = () => {
        if (!matchedRec?.recommendedAnimal) return;
        const partner = matchedRec.recommendedAnimal;
        const owner = partner.owner;
        setMatchedRec(null);
        onClose();
        router.push({
            pathname: '/conversation/[id]' as any,
            params: {
                id:     partner.ownerId,
                name:   owner?.name ?? 'Farmer',
                avatar: owner?.profile_url ?? '',
            },
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={sh.overlay}>
                {/* Dim background tap to close */}
                <TouchableOpacity style={sh.dimBg} onPress={() => { setRetryCount(0); onClose(); }} activeOpacity={1} />

                <View style={sh.sheet}>
                    {/* Handle + header */}
                    <View style={sh.handle} />
                    <View style={sh.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={sh.title} numberOfLines={1}>
                                {animal?.name ? `Matches for ${animal.name}` : 'Breeding Matches'}
                            </Text>
                            {!loading && recs.length > 0 && (
                                <Text style={sh.sub}>
                                    {Math.min(index + 1, recs.length)} / {recs.length} candidates
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity style={sh.closeBtn} onPress={() => { setRetryCount(0); onClose(); }}>
                            <MaterialIcons name="close" size={20} color={TEXT} />
                        </TouchableOpacity>
                    </View>

                    {/* ── States ── */}
                    {loading ? (
                        <View style={sh.stateBox}>
                            <ActivityIndicator size="large" color={PRIMARY} />
                            <Text style={sh.stateTitle}>Finding genetic matches…</Text>
                            <Text style={sh.stateSub}>This can take 1–2 minutes while the server wakes up and runs the genetic analysis</Text>
                        </View>
                    ) : error ? (
                        <View style={sh.stateBox}>
                            <MaterialIcons name="wifi-off" size={48} color={TEXT_MUTED} />
                            <Text style={sh.stateTitle}>Could not load matches</Text>
                            <Text style={sh.stateSub}>{error}</Text>
                            <TouchableOpacity style={sh.retryBtn} onPress={handleRetry}>
                                <MaterialIcons name="refresh" size={16} color="#fff" />
                                <Text style={sh.retryBtnText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : recs.length === 0 ? (
                        <View style={sh.stateBox}>
                            <MaterialIcons name="search-off" size={48} color={TEXT_MUTED} />
                            <Text style={sh.stateTitle}>No candidates</Text>
                            <Text style={sh.stateSub}>The backend returned 0 candidates for this animal right now.</Text>
                            <TouchableOpacity style={sh.retryBtn} onPress={handleRetry}>
                                <MaterialIcons name="refresh" size={16} color="#fff" />
                                <Text style={sh.retryBtnText}>Refresh Matches</Text>
                            </TouchableOpacity>
                        </View>
                    ) : isDone ? (
                        <View style={sh.stateBox}>
                            <MaterialIcons name="done-all" size={48} color={SUCCESS} />
                            <Text style={sh.stateTitle}>You've seen them all!</Text>
                            <Text style={sh.stateSub}>Check back later for new matches</Text>
                            <TouchableOpacity style={sh.doneBtn} onPress={onClose}>
                                <Text style={sh.doneBtnText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* Card stack */}
                            <View style={sh.cardArea}>
                                {[...remaining].reverse().map((rec, i) => {
                                    const stackIndex = remaining.length - 1 - i;
                                    return (
                                        <SwipeCard
                                            key={rec.breedingRecId}
                                            rec={rec}
                                            index={stackIndex}
                                            position={position}
                                            panHandlers={stackIndex === 0 ? panResponder.panHandlers : {}}
                                            isTop={stackIndex === 0}
                                        />
                                    );
                                })}
                            </View>

                            {/* Action buttons */}
                            <View style={sh.actions}>
                                <TouchableOpacity
                                    style={[sh.actionBtn, sh.nopeBtn]}
                                    onPress={doSwipeLeft}
                                    disabled={accepting}
                                >
                                    <MaterialIcons name="close" size={32} color={DANGER} />
                                </TouchableOpacity>

                                <View style={sh.centerHint}>
                                    <Text style={sh.hintText}>swipe to decide</Text>
                                </View>

                                <TouchableOpacity
                                    style={[sh.actionBtn, sh.likeBtn]}
                                    onPress={() => recs[index] && doAccept(recs[index])}
                                    disabled={accepting}
                                >
                                    {accepting
                                        ? <ActivityIndicator size="small" color={SUCCESS} />
                                        : <MaterialIcons name="favorite" size={32} color={SUCCESS} />
                                    }
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                {/* Match congrats — overlays entire modal */}
                {matchedRec && animal && (
                    <MatchCongratsOverlay
                        rec={matchedRec}
                        myAnimal={animal}
                        onChat={navigateToChat}
                        onContinue={() => { setMatchedRec(null); nextCard(); }}
                    />
                )}
            </View>
        </Modal>
    );
}

// ── styles ────────────────────────────────────────────────────────────────────

const sh = StyleSheet.create({
    overlay:  { flex: 1, justifyContent: 'flex-end' },
    dimBg:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
    sheet: {
        backgroundColor: BG,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderColor: GLASS_BORDER,
        height: H * 0.91,
        overflow: 'hidden',
    },
    handle: {
        width: 40, height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: GLASS_BORDER,
    },
    title:    { fontSize: 17, fontWeight: '800', color: TEXT },
    sub:      { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1, borderColor: GLASS_BORDER,
        alignItems: 'center', justifyContent: 'center',
    },

    stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    stateTitle: { fontSize: 18, fontWeight: '700', color: TEXT, textAlign: 'center' },
    stateSub:   { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', lineHeight: 22 },
    doneBtn: {
        marginTop: 8,
        backgroundColor: PRIMARY,
        paddingHorizontal: 32, paddingVertical: 12,
        borderRadius: 999,
    },
    doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    retryBtn: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: PRIMARY,
        paddingHorizontal: 28, paddingVertical: 12,
        borderRadius: 999,
    },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    cardArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
    },

    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        paddingTop: 16,
        gap: 24,
    },
    actionBtn: {
        width: 68, height: 68, borderRadius: 34,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    nopeBtn: {
        borderColor: DANGER + '55',
        backgroundColor: DANGER + '12',
        shadowColor: DANGER,
    },
    likeBtn: {
        borderColor: SUCCESS + '55',
        backgroundColor: SUCCESS + '12',
        shadowColor: SUCCESS,
    },
    centerHint:  { alignItems: 'center' },
    hintText:    { fontSize: 11, color: TEXT_MUTED },
});

const card = StyleSheet.create({
    container: {
        position: 'absolute',
        width: W - 40,
        height: CARD_H,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    imageWrap:     { flex: 1 },
    image:         { width: '100%', height: '100%' },
    imageFallback: {
        backgroundColor: PRIMARY + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fallbackInitials: { fontSize: 80, fontWeight: '900', color: PRIMARY + '55' },

    gradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        // Simulate a gradient with a semi-transparent overlay at the bottom
        top: '40%',
    },

    infoOverlay: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: 20,
        paddingBottom: 16,
        backgroundColor: 'rgba(26,15,9,0.82)',
        borderTopWidth: 1,
        borderTopColor: GLASS_BORDER,
        gap: 10,
    },
    infoRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    animalName:   { fontSize: 22, fontWeight: '900', color: TEXT },
    animalSub:    { fontSize: 13, color: TEXT_MUTED, marginTop: 2 },

    scoreBubble: {
        backgroundColor: PRIMARY,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignItems: 'center',
        minWidth: 54,
    },
    scoreText:  { fontSize: 18, fontWeight: '900', color: '#fff' },
    scoreLabel: { fontSize: 9,  fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 },

    pillsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    pill: {
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    pillText: { fontSize: 11, fontWeight: '700' },

    stamp: {
        position: 'absolute',
        top: 40,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 4,
    },
    stampLike: {
        left: 20,
        borderColor: SUCCESS,
        backgroundColor: SUCCESS + '22',
        transform: [{ rotate: '-15deg' }],
    },
    stampLikeText: { fontSize: 28, fontWeight: '900', color: SUCCESS, letterSpacing: 2 },
    stampNope: {
        right: 20,
        borderColor: DANGER,
        backgroundColor: DANGER + '22',
        transform: [{ rotate: '15deg' }],
    },
    stampNopeText: { fontSize: 28, fontWeight: '900', color: DANGER, letterSpacing: 2 },
});

const cs = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10,5,3,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        padding: 28,
        alignItems: 'center',
        width: W - 48,
        gap: 16,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 20,
    },

    photosRow:     { flexDirection: 'row', alignItems: 'center', gap: -14 },
    avatarRing: {
        width: 96, height: 96,
        borderRadius: 48,
        borderWidth: 3,
        overflow: 'hidden',
    },
    avatar:         { width: '100%', height: '100%' },
    avatarFallback: {
        flex: 1,
        backgroundColor: PRIMARY + '20',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarInitials: { fontSize: 28, fontWeight: '900', color: PRIMARY },

    heartCircle: {
        width: 44, height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        zIndex: 1,
    },

    title:    { fontSize: 30, fontWeight: '900', color: TEXT, textAlign: 'center' },
    subtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', lineHeight: 22 },

    scorePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: PRIMARY + '18',
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: PRIMARY + '44',
    },
    scoreText: { fontSize: 13, fontWeight: '700', color: PRIMARY },

    chatBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: PRIMARY,
        borderRadius: 16,
        paddingVertical: 14,
    },
    chatBtnText: { fontSize: 16, fontWeight: '800', color: BG },

    continueBtn: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 12,
    },
    continueBtnText: { fontSize: 14, fontWeight: '600', color: TEXT_MUTED },
});
