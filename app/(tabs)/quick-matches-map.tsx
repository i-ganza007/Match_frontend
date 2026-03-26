import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    StatusBar,
} from 'react-native';
import WebView from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
    getCurrentLocation,
    hasLocationPermission,
    requestLocationPermission,
} from '../../services/location';
import {
    getQuickMatches,
    QuickMatchGroup,
    QuickMatch,
} from '../../services/recommendations';

// ── Theme ─────────────────────────────────────────────────────────────────────
const PRIMARY      = '#ec5b13';
const BG           = '#221610';
const CARD_BG      = 'rgba(255,255,255,0.04)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const TEXT         = '#f1f5f9';
const TEXT_MUTED   = '#94a3b8';
const SCORE_GREEN  = '#22c55e';
const SCORE_YELLOW = '#f59e0b';
const SCORE_RED    = '#ef4444';

// ── Types ─────────────────────────────────────────────────────────────────────
const RADII = [5, 10, 15, 25, 50, 100] as const;
type Radius = (typeof RADII)[number];
type Phase        = 'idle' | 'locating' | 'fetching' | 'results' | 'empty' | 'error';
type LocatingStep = 'permission' | 'gps';

const MAP_MODES = [
    { id: 'street',    label: 'Street',    icon: 'map'         as const, url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                                                        attr: '© OpenStreetMap' },
    { id: 'satellite', label: 'Satellite', icon: 'satellite'   as const, url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',             attr: '© Esri' },
    { id: 'terrain',   label: 'Terrain',   icon: 'terrain'     as const, url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',                                                          attr: '© OpenTopoMap' },
    { id: 'dark',      label: 'Dark',      icon: 'nights-stay' as const, url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',                                             attr: '© CARTO' },
] as const;
type ModeId = (typeof MAP_MODES)[number]['id'];

interface FlatMarker {
    lat: number;
    lng: number;
    ownerName: string;
    phone: string;
    district: string;
    animalName: string;
    animalSpecie: string;
    score: number;
    distanceKm: number;
    yourAnimalName: string;
    color: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
    return score >= 0.75 ? SCORE_GREEN : score >= 0.5 ? SCORE_YELLOW : SCORE_RED;
}

function buildMarkers(groups: QuickMatchGroup[]): FlatMarker[] {
    const out: FlatMarker[] = [];
    for (const group of groups) {
        for (const match of group.matches) {
            const { owner, animal, scores } = match;
            if (owner.latitude == null || owner.longitude == null) continue;
            out.push({
                lat: owner.latitude,
                lng: owner.longitude,
                ownerName: owner.name,
                phone: owner.phone_number,
                district: owner.district ?? '',
                animalName: animal.name ?? `#${animal.animalId.slice(-6)}`,
                animalSpecie: animal.specie,
                score: scores.overall_score,
                distanceKm: owner.distance_km,
                yourAnimalName: group.yourAnimal.name ?? `#${group.yourAnimal.animalId.slice(-6)}`,
                color: scoreColor(scores.overall_score),
            });
        }
    }
    return out;
}

// ── Leaflet HTML builder ──────────────────────────────────────────────────────
function buildLeafletHTML(
    userLat: number,
    userLng: number,
    radiusKm: number,
    markers: FlatMarker[],
): string {
    const tileLayers = JSON.stringify(
        Object.fromEntries(MAP_MODES.map(m => [m.id, { url: m.url, attr: m.attr }])),
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100vh; background:#0d1117; }

    .leaflet-popup-content-wrapper {
      background:#1e1208; color:#f1f5f9;
      border:1px solid rgba(236,91,19,0.35);
      border-radius:14px;
      box-shadow:0 8px 28px rgba(0,0,0,0.85);
      padding:0;
    }
    .leaflet-popup-content { margin:0; }
    .leaflet-popup-tip { background:#1e1208; }
    .leaflet-popup-close-button { color:rgba(255,255,255,0.4)!important; top:8px!important; right:8px!important; font-size:18px!important; }
    .leaflet-control-attribution { font-size:9px; }

    .pop { padding:14px 16px 12px; min-width:210px; }
    .pop-tag {
      display:inline-block; font-size:10px; font-weight:800;
      padding:3px 8px; border-radius:5px; text-transform:uppercase;
      letter-spacing:0.6px; margin-bottom:10px;
    }
    .pop-owner { font-weight:800; font-size:17px; color:#f1f5f9; margin-bottom:2px; }
    .pop-animal { font-size:13px; color:rgba(255,255,255,0.55); margin-bottom:10px; text-transform:capitalize; }
    .pop-score { font-size:26px; font-weight:900; margin-bottom:4px; }
    .score-bar-wrap { width:100%; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; margin-bottom:10px; overflow:hidden; }
    .score-bar { height:100%; border-radius:3px; }
    .pop-row { display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(255,255,255,0.65); margin-bottom:4px; }
    .pop-phone { font-size:13px; font-weight:700; color:#ec5b13; margin-top:6px; }
    .pop-for {
      font-size:11px; color:rgba(255,255,255,0.4);
      margin-top:8px; padding-top:8px;
      border-top:1px solid rgba(255,255,255,0.08);
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${userLat}, ${userLng}], 11);

  var tileDefs = ${tileLayers};
  var currentTL = null;
  function setMapMode(id) {
    if (currentTL) map.removeLayer(currentTL);
    var def = tileDefs[id] || tileDefs['street'];
    currentTL = L.tileLayer(def.url, { attribution: def.attr, maxZoom: 19 });
    currentTL.addTo(map);
  }
  setMapMode('street');

  // Radius circle
  L.circle([${userLat}, ${userLng}], {
    radius: ${radiusKm * 1000},
    color: '#ec5b13',
    fillColor: '#ec5b13',
    fillOpacity: 0.05,
    weight: 1.5,
    dashArray: '6 4',
  }).addTo(map);

  // Your location pin
  var youPin = L.divIcon({
    className: '',
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="54" viewBox="0 0 38 54">'
      + '<path d="M19 1 C9.06 1 1 9.06 1 19 C1 34 19 53 19 53 C19 53 37 34 37 19 C37 9.06 28.94 1 19 1 Z"'
      + ' fill="#ec5b13" stroke="white" stroke-width="2.5"/>'
      + '<circle cx="19" cy="19" r="11" fill="rgba(255,255,255,0.2)"/>'
      + '<text x="19" y="23" text-anchor="middle" dominant-baseline="middle"'
      + ' fill="white" font-size="10" font-weight="900" font-family="Arial">YOU</text>'
      + '</svg>',
    iconSize: [38, 54],
    iconAnchor: [19, 53],
    popupAnchor: [0, -56],
  });
  L.marker([${userLat}, ${userLng}], { icon: youPin })
    .addTo(map)
    .bindPopup(
      '<div class="pop">'
      + '<div class="pop-owner">Your Location</div>'
      + '<div class="pop-animal">Search radius: ${radiusKm} km</div>'
      + '</div>'
    );

  // Match pins
  var markers = ${JSON.stringify(markers)};
  var bounds = [[${userLat}, ${userLng}]];

  markers.forEach(function(m) {
    var color = m.color;
    var scorePct = Math.round(m.score * 100);
    var specie = m.animalSpecie.replace(/_/g, ' ')
      .replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
    var label = scorePct >= 75 ? 'Great Match' : scorePct >= 50 ? 'Good Match' : 'Fair Match';

    var pin = L.divIcon({
      className: '',
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="50" viewBox="0 0 36 50">'
        + '<path d="M18 1 C8.61 1 1 8.61 1 18 C1 32 18 49 18 49 C18 49 35 32 35 18 C35 8.61 27.39 1 18 1 Z"'
        + ' fill="' + color + '" stroke="white" stroke-width="2"/>'
        + '<circle cx="18" cy="18" r="10" fill="rgba(255,255,255,0.2)"/>'
        + '<text x="18" y="22" text-anchor="middle" dominant-baseline="middle"'
        + ' fill="white" font-size="10" font-weight="bold" font-family="Arial">' + scorePct + '%</text>'
        + '</svg>',
      iconSize: [36, 50],
      iconAnchor: [18, 49],
      popupAnchor: [0, -52],
    });

    var tagBg = color + '33';
    var popup =
      '<div class="pop">'
      + '<span class="pop-tag" style="background:' + tagBg + '; color:' + color + '">' + label + '</span>'
      + '<div class="pop-owner">' + m.ownerName + '</div>'
      + '<div class="pop-animal">' + m.animalName + ' &bull; ' + specie + '</div>'
      + '<div class="pop-score" style="color:' + color + '">' + scorePct + '%</div>'
      + '<div class="score-bar-wrap"><div class="score-bar" style="width:' + scorePct + '%; background:' + color + '"></div></div>'
      + '<div class="pop-row"><span>&#128205;</span>' + m.district + ' &bull; ' + m.distanceKm.toFixed(1) + ' km away</div>'
      + '<div class="pop-phone">&#128222; ' + m.phone + '</div>'
      + '<div class="pop-for">Match for <b>' + m.yourAnimalName + '</b></div>'
      + '</div>';

    L.marker([m.lat, m.lng], { icon: pin })
      .addTo(map)
      .bindPopup(popup, { maxWidth: 250 });

    bounds.push([m.lat, m.lng]);
  });

  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
  }
</script>
</body>
</html>`;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function QuickMatchesMap() {
    const router  = useRouter();
    const webRef  = useRef<WebView>(null);

    const [radius,       setRadius]       = useState<Radius>(10);
    const [phase,        setPhase]        = useState<Phase>('idle');
    const [locatingStep, setLocatingStep] = useState<LocatingStep>('permission');
    const [error,        setError]        = useState<string | null>(null);
    const [groups,       setGroups]       = useState<QuickMatchGroup[]>([]);
    const [mapHtml,      setMapHtml]      = useState<string | null>(null);
    const [userPos,      setUserPos]      = useState<{ lat: number; lng: number } | null>(null);
    const [activeMode,   setActiveMode]   = useState<ModeId>('street');
    const [showList,     setShowList]     = useState(false);

    const totalMatches = groups.reduce((sum, g) => sum + g.matches.length, 0);

    const handleFind = useCallback(async () => {
        setError(null);

        // ── Step 1: location permission ──────────────────────────────────────
        const alreadyGranted = await hasLocationPermission();
        if (!alreadyGranted) {
            setLocatingStep('permission');
            setPhase('locating');
            const result = await requestLocationPermission();
            if (!result.granted) {
                setError(
                    result.canAskAgain
                        ? 'Location access is required to find nearby matches. Please tap "Allow" when prompted and try again.'
                        : 'Location access is permanently blocked. Go to your device Settings → Apps → Permissions → Location and enable it, then try again.',
                );
                setPhase('error');
                return;
            }
        }

        // ── Step 2: get GPS fix ───────────────────────────────────────────────
        setLocatingStep('gps');
        setPhase('locating');
        const loc = await getCurrentLocation();
        if (!loc) {
            setError('Could not read your GPS coordinates. Make sure Location / GPS is turned on in your device settings and try again.');
            setPhase('error');
            return;
        }
        setUserPos({ lat: loc.latitude, lng: loc.longitude });

        // ── Step 3: fetch matches from backend ───────────────────────────────
        setPhase('fetching');
        try {
            const data = await getQuickMatches(loc.latitude, loc.longitude, radius);
            const hasMatches = data.length > 0 && data.some(g => g.matches.length > 0);
            if (!hasMatches) {
                setGroups([]);
                setPhase('empty');
                return;
            }
            setGroups(data);
            const flat = buildMarkers(data);
            setMapHtml(buildLeafletHTML(loc.latitude, loc.longitude, radius, flat));
            setPhase('results');
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 503 || status === 502 || status === 504) {
                setError('The server is starting up. Please try again in a moment.');
            } else if (status === 401) {
                setError('Your session has expired. Please log in again.');
            } else if (status === 400) {
                setError(err?.response?.data?.message ?? 'Invalid request parameters.');
            } else if (!err?.response) {
                setError('Network error — check your connection and try again.');
            } else {
                setError(err?.response?.data?.message ?? 'Failed to load matches.');
            }
            setPhase('error');
        }
    }, [radius]);

    const switchMode = (id: ModeId) => {
        setActiveMode(id);
        webRef.current?.injectJavaScript(`setMapMode('${id}'); true;`);
    };

    // ── Idle ──────────────────────────────────────────────────────────────────
    if (phase === 'idle') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" backgroundColor={BG} />
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.navigate('/(tabs)/my-herd' as any)}
                    >
                        <MaterialIcons name="arrow-back" size={22} color={TEXT} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quick Matches</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.idleContent} showsVerticalScrollIndicator={false}>
                    {/* Hero */}
                    <View style={styles.heroCard}>
                        <View style={styles.heroIconWrap}>
                            <MaterialIcons name="my-location" size={40} color={PRIMARY} />
                        </View>
                        <Text style={styles.heroTitle}>Find Nearby Breeding Partners</Text>
                        <Text style={styles.heroSub}>
                            Your eligible animals are automatically matched against farms near you.
                            Results are ML-scored by genetics and breed compatibility.
                        </Text>
                    </View>

                    {/* Radius picker */}
                    <Text style={styles.sectionLabel}>Search Radius</Text>
                    <View style={styles.radiusRow}>
                        {RADII.map(r => (
                            <TouchableOpacity
                                key={r}
                                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                                onPress={() => setRadius(r)}
                            >
                                <MaterialIcons
                                    name="radio-button-checked"
                                    size={16}
                                    color={radius === r ? '#fff' : TEXT_MUTED}
                                />
                                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                                    {r} km
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Score legend */}
                    <Text style={styles.sectionLabel}>Score Legend</Text>
                    <View style={styles.legendCard}>
                        {[
                            { color: SCORE_GREEN,  label: 'Great Match', range: '≥ 75%' },
                            { color: SCORE_YELLOW, label: 'Good Match',  range: '50 – 74%' },
                            { color: SCORE_RED,    label: 'Fair Match',  range: '< 50%' },
                        ].map(item => (
                            <View key={item.color} style={styles.legendRow}>
                                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                <Text style={styles.legendLabel}>{item.label}</Text>
                                <Text style={styles.legendRange}>{item.range}</Text>
                            </View>
                        ))}
                    </View>

                    {/* How it works */}
                    <View style={styles.infoCard}>
                        {[
                            { icon: 'gps-fixed'      as const, text: 'Uses your live GPS — not your profile location' },
                            { icon: 'auto-awesome'   as const, text: 'ML model scores each animal pair for compatibility' },
                            { icon: 'chat'           as const, text: 'Tap a pin to see owner contact & score details' },
                        ].map((row, i) => (
                            <View key={i} style={styles.infoRow}>
                                <MaterialIcons name={row.icon} size={16} color={PRIMARY} />
                                <Text style={styles.infoText}>{row.text}</Text>
                            </View>
                        ))}
                    </View>

                    {/* CTA */}
                    <TouchableOpacity style={styles.findBtn} onPress={handleFind} activeOpacity={0.85}>
                        <MaterialIcons name="location-searching" size={22} color="#fff" />
                        <Text style={styles.findBtnText}>Find Quick Matches</Text>
                    </TouchableOpacity>
                </ScrollView>

                <BottomNav router={router} active="map" />
            </SafeAreaView>
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────────
    if (phase === 'locating' || phase === 'fetching') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" backgroundColor={BG} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                    <Text style={styles.loadingTitle}>
                        {phase === 'fetching'
                            ? 'Finding nearby matches…'
                            : locatingStep === 'permission'
                                ? 'Requesting location access…'
                                : 'Getting your GPS location…'}
                    </Text>
                    <Text style={styles.loadingSub}>
                        {phase === 'fetching'
                            ? `Scanning ${radius} km radius for compatible animals`
                            : locatingStep === 'permission'
                                ? 'A permission dialog will appear — tap "Allow" to continue'
                                : 'Waiting for GPS signal…'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" backgroundColor={BG} />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setPhase('idle')}>
                        <MaterialIcons name="arrow-back" size={22} color={TEXT} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quick Matches</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centered}>
                    <MaterialIcons name="error-outline" size={52} color="#ef4444" />
                    <Text style={styles.stateTitle}>Something went wrong</Text>
                    <Text style={styles.stateMessage}>{error}</Text>
                    <TouchableOpacity style={styles.findBtn} onPress={handleFind}>
                        <MaterialIcons name="refresh" size={18} color="#fff" />
                        <Text style={styles.findBtnText}>Try Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ghostBtn} onPress={() => setPhase('idle')}>
                        <Text style={styles.ghostBtnText}>Change Radius</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Empty ─────────────────────────────────────────────────────────────────
    if (phase === 'empty') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" backgroundColor={BG} />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setPhase('idle')}>
                        <MaterialIcons name="arrow-back" size={22} color={TEXT} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quick Matches</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centered}>
                    <MaterialIcons name="search-off" size={52} color={TEXT_MUTED} />
                    <Text style={styles.stateTitle}>No matches found</Text>
                    <Text style={styles.stateMessage}>
                        No compatible animals were found within {radius} km of your location
                        {userPos ? ` (${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)})` : ''}.{'\n\n'}
                        Try a larger radius, or make sure your animals are eligible for matching (correct type, sex, and age).
                    </Text>
                    <TouchableOpacity style={styles.findBtn} onPress={() => setPhase('idle')}>
                        <MaterialIcons name="tune" size={18} color="#fff" />
                        <Text style={styles.findBtnText}>Change Radius</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Results ───────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />

            {/* Top bar */}
            <View style={styles.topBar}>
                <View style={styles.topBarRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setPhase('idle')}>
                        <MaterialIcons name="arrow-back" size={20} color={TEXT} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quick Matches</Text>
                    <View style={styles.chipsRow}>
                        <View style={[styles.chip, { backgroundColor: PRIMARY + '22' }]}>
                            <MaterialIcons name="auto-awesome" size={11} color={PRIMARY} />
                            <Text style={[styles.chipText, { color: PRIMARY }]}>{totalMatches}</Text>
                        </View>
                        <View style={[styles.chip, { backgroundColor: CARD_BG }]}>
                            <MaterialIcons name="radio-button-checked" size={11} color={TEXT_MUTED} />
                            <Text style={styles.chipText}>{radius} km</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.chip, { backgroundColor: CARD_BG }]}
                            onPress={() => setShowList(v => !v)}
                        >
                            <MaterialIcons name={showList ? 'map' : 'list'} size={11} color={TEXT_MUTED} />
                            <Text style={styles.chipText}>{showList ? 'Map' : 'List'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Map mode row (hidden in list view) */}
                {!showList && (
                    <View style={styles.modeRow}>
                        {MAP_MODES.map(m => {
                            const active = activeMode === m.id;
                            return (
                                <TouchableOpacity
                                    key={m.id}
                                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                                    onPress={() => switchMode(m.id)}
                                >
                                    <MaterialIcons name={m.icon} size={13} color={active ? '#fff' : TEXT_MUTED} />
                                    <Text style={[styles.modeTxt, active && { color: '#fff' }]}>{m.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Content */}
            {showList ? (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {groups.map(group => (
                        <View key={group.yourAnimal.animalId} style={styles.groupSection}>
                            <Text style={styles.groupHeader}>
                                Matches for{' '}
                                <Text style={{ color: PRIMARY }}>
                                    {group.yourAnimal.name ?? `#${group.yourAnimal.animalId.slice(-6)}`}
                                </Text>
                            </Text>
                            {group.matches.map(match => (
                                <MatchListCard key={match.animal.animalId + match.owner.userId} match={match} />
                            ))}
                        </View>
                    ))}
                </ScrollView>
            ) : (
                mapHtml ? (
                    <WebView
                        ref={webRef}
                        style={{ flex: 1 }}
                        originWhitelist={['*']}
                        source={{ html: mapHtml }}
                        javaScriptEnabled
                        domStorageEnabled
                        startInLoadingState
                        renderLoading={() => (
                            <View style={[styles.centered, StyleSheet.absoluteFillObject, { backgroundColor: BG }]}>
                                <ActivityIndicator size="large" color={PRIMARY} />
                            </View>
                        )}
                    />
                ) : null
            )}
        </SafeAreaView>
    );
}

// ── Match List Card ───────────────────────────────────────────────────────────
function MatchListCard({ match }: { match: QuickMatch }) {
    const { scores, owner, animal } = match;
    const sc   = scoreColor(scores.overall_score);
    const pct  = Math.round(scores.overall_score * 100);
    const lbl  = pct >= 75 ? 'Great' : pct >= 50 ? 'Good' : 'Fair';
    const safe = Math.round((1 - scores.inbreeding_risk_score) * 100);

    return (
        <View style={styles.matchCard}>
            {/* Header row */}
            <View style={styles.matchCardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.matchOwner}>{owner.name}</Text>
                    <Text style={styles.matchAnimal} numberOfLines={1}>
                        {animal.name ?? 'Unknown'} · {animal.specie.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.matchMeta}>
                        {owner.district}  ·  {owner.distance_km.toFixed(1)} km away
                    </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: sc + '22', borderColor: sc + '44' }]}>
                    <Text style={[styles.scoreValue, { color: sc }]}>{pct}%</Text>
                    <Text style={[styles.scoreLabel, { color: sc }]}>{lbl}</Text>
                </View>
            </View>

            {/* Score bars */}
            <View style={styles.scoreBarsWrap}>
                {[
                    { label: 'Genetic Diversity',    value: scores.genetic_diversity_score,        color: '#8b5cf6' },
                    { label: 'Breed Compatibility',  value: scores.breed_composition_match_score,  color: '#06b6d4' },
                    { label: 'Inbreeding Safety',    value: safe / 100,                            color: '#22c55e' },
                ].map(bar => (
                    <View key={bar.label} style={styles.scoreBarRow}>
                        <Text style={styles.scoreBarLabel}>{bar.label}</Text>
                        <View style={styles.scoreBarTrack}>
                            <View style={[styles.scoreBarFill, {
                                width: `${Math.round(bar.value * 100)}%`,
                                backgroundColor: bar.color,
                            }]} />
                        </View>
                        <Text style={[styles.scoreBarPct, { color: bar.color }]}>
                            {Math.round(bar.value * 100)}%
                        </Text>
                    </View>
                ))}
            </View>

            {/* Phone */}
            <View style={styles.matchPhoneRow}>
                <MaterialIcons name="call" size={14} color={PRIMARY} />
                <Text style={styles.matchPhoneText}>{owner.phone_number}</Text>
            </View>
        </View>
    );
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────
function BottomNav({ router, active }: { router: any; active: string }) {
    return (
        <View style={styles.navContainer}>
            <View style={styles.navBar}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.navigate('/(tabs)/my-herd')}>
                    <MaterialIcons name="groups" size={24} color={active === 'herd' ? PRIMARY : TEXT_MUTED} />
                    <Text style={[styles.navText, active === 'herd' && { color: PRIMARY }]}>HERD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.navigate('/(tabs)/home')}>
                    <MaterialIcons name="home" size={24} color={active === 'home' ? PRIMARY : TEXT_MUTED} />
                    <Text style={[styles.navText, active === 'home' && { color: PRIMARY }]}>HOME</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.navigate('/(tabs)/messages')}>
                    <MaterialIcons name="chat-bubble-outline" size={24} color={active === 'chat' ? PRIMARY : TEXT_MUTED} />
                    <Text style={[styles.navText, active === 'chat' && { color: PRIMARY }]}>CHAT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="map" size={24} color={active === 'map' ? PRIMARY : TEXT_MUTED} />
                    <Text style={[styles.navText, active === 'map' && { color: PRIMARY }]}>MAP</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    centered: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        gap: 14, padding: 28,
    },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 8,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        flex: 1, textAlign: 'center',
        fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: -0.3,
    },

    // Idle
    idleContent: { padding: 20, paddingBottom: 130, gap: 18 },
    heroCard: {
        backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER,
        borderRadius: 22, padding: 28, alignItems: 'center', gap: 12,
    },
    heroIconWrap: {
        width: 76, height: 76, borderRadius: 38,
        backgroundColor: PRIMARY + '22',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
    },
    heroTitle: { fontSize: 20, fontWeight: '800', color: TEXT, textAlign: 'center' },
    heroSub:   { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', lineHeight: 22 },

    sectionLabel: {
        fontSize: 12, fontWeight: '700', color: TEXT_MUTED,
        letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2,
    },

    radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    radiusBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14,
        backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    },
    radiusBtnActive: {
        backgroundColor: PRIMARY, borderColor: PRIMARY,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
    },
    radiusBtnText:       { fontSize: 16, fontWeight: '700', color: TEXT_MUTED },
    radiusBtnTextActive: { color: '#fff' },

    legendCard: {
        backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER,
        borderRadius: 16, padding: 16, gap: 12,
    },
    legendRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    legendDot:  { width: 12, height: 12, borderRadius: 6 },
    legendLabel:{ flex: 1, color: TEXT, fontSize: 14, fontWeight: '600' },
    legendRange:{ color: TEXT_MUTED, fontSize: 13 },

    infoCard: {
        backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER,
        borderRadius: 16, padding: 16, gap: 12,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    infoText: { flex: 1, color: TEXT_MUTED, fontSize: 13, lineHeight: 20 },

    findBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 16,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
    },
    findBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

    ghostBtn: {
        paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12,
        borderWidth: 1, borderColor: GLASS_BORDER,
    },
    ghostBtnText: { color: TEXT_MUTED, fontWeight: '600', fontSize: 14 },

    // Loading / empty / error states
    loadingTitle:  { fontSize: 20, fontWeight: '700', color: TEXT, textAlign: 'center' },
    loadingSub:    { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20 },
    stateTitle:    { fontSize: 18, fontWeight: '700', color: TEXT, textAlign: 'center' },
    stateMessage:  { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', lineHeight: 21 },

    // Results top bar
    topBar: {
        paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, gap: 8,
        borderBottomWidth: 1, borderBottomColor: GLASS_BORDER,
    },
    topBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    chipsRow:  { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20,
    },
    chipText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },

    modeRow: { flexDirection: 'row', gap: 6 },
    modeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 5, paddingVertical: 7, borderRadius: 10,
        backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER,
    },
    modeBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    modeTxt: { fontSize: 11, fontWeight: '600', color: TEXT_MUTED },

    // List view
    listContent: { padding: 16, gap: 24, paddingBottom: 40 },
    groupSection: { gap: 10 },
    groupHeader: { fontSize: 16, fontWeight: '700', color: TEXT },

    matchCard: {
        backgroundColor: CARD_BG, borderWidth: 1, borderColor: GLASS_BORDER,
        borderRadius: 16, padding: 14, gap: 12,
    },
    matchCardTop: { flexDirection: 'row', gap: 12 },
    matchOwner:  { fontSize: 16, fontWeight: '800', color: TEXT },
    matchAnimal: { fontSize: 13, color: TEXT_MUTED, marginTop: 2, textTransform: 'capitalize' },
    matchMeta:   { fontSize: 12, color: TEXT_MUTED, marginTop: 4 },

    scoreBadge: {
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
        borderWidth: 1, alignItems: 'center', minWidth: 66,
    },
    scoreValue: { fontSize: 20, fontWeight: '900' },
    scoreLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    scoreBarsWrap: { gap: 6 },
    scoreBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scoreBarLabel: { fontSize: 11, color: TEXT_MUTED, width: 130 },
    scoreBarTrack: {
        flex: 1, height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2, overflow: 'hidden',
    },
    scoreBarFill: { height: '100%', borderRadius: 2 },
    scoreBarPct: { fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },

    matchPhoneRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingTop: 10, borderTopWidth: 1, borderTopColor: GLASS_BORDER,
    },
    matchPhoneText: { fontSize: 14, fontWeight: '600', color: PRIMARY },

    // Nav
    navContainer: { position: 'absolute', bottom: 24, left: 20, right: 20 },
    navBar: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999,
        backgroundColor: 'rgba(34,22,16,0.95)',
        borderWidth: 1, borderColor: GLASS_BORDER,
    },
    navItem: { alignItems: 'center', gap: 2 },
    navText: { fontSize: 9, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 0.5 },
});
