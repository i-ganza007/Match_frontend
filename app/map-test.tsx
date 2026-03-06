import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import WebView from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { getUsersWithLocation, User } from '../services/users';
import { useTheme } from '../context/ThemeContext';

// ─── Map mode definitions ─────────────────────────────────────────────────────
const MAP_MODES = [
  {
    id: 'street',
    label: 'Street',
    icon: 'map' as const,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    icon: 'satellite' as const,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
  {
    id: 'terrain',
    label: 'Terrain',
    icon: 'terrain' as const,
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: 'nights-stay' as const,
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
] as const;

type ModeId = (typeof MAP_MODES)[number]['id'];

// ─── SVG teardrop pin builder ─────────────────────────────────────────────────
function svgPin(color: string, symbol: string): string {
  // Classic teardrop / location-pin shape via SVG path
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="46" viewBox="0 0 32 46">` +
    `<path d="M16 1 C7.72 1 1 7.72 1 16 C1 28 16 45 16 45 C16 45 31 28 31 16 C31 7.72 24.28 1 16 1 Z"` +
    ` fill="${color}" stroke="white" stroke-width="2"/>` +
    `<circle cx="16" cy="16" r="9" fill="rgba(255,255,255,0.25)"/>` +
    `<text x="16" y="20" text-anchor="middle" dominant-baseline="middle"` +
    ` fill="white" font-size="13" font-weight="bold" font-family="Arial">${symbol}</text>` +
    `</svg>`
  );
}

// ─── Leaflet HTML page ────────────────────────────────────────────────────────
function buildLeafletHTML(users: User[]): string {
  const markers = users
    .filter((u) => u.latitude != null && u.longitude != null)
    .map((u) => ({
      lat: u.latitude as number,
      lng: u.longitude as number,
      name: u.name,
      sex: u.sex,
      district: u.district,
      sector: u.sector,
    }));

  const tileLayers = JSON.stringify(
    Object.fromEntries(MAP_MODES.map((m) => [m.id, { url: m.url, attr: m.attr }])),
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

    /* Dark popup theme */
    .leaflet-popup-content-wrapper {
      background:#1a1a2e; color:#fff;
      border:1px solid rgba(255,255,255,0.15);
      border-radius:12px;
      box-shadow:0 6px 20px rgba(0,0,0,0.7);
      padding:0;
    }
    .leaflet-popup-content { margin:0; }
    .leaflet-popup-tip { background:#1a1a2e; }
    .leaflet-popup-close-button { color:rgba(255,255,255,0.45)!important; top:8px!important; right:8px!important; }
    .leaflet-control-attribution { font-size:9px; }

    /* Custom popup card */
    .pop { padding:12px 14px 10px; min-width:170px; }
    .pop-name  { font-weight:700; font-size:15px; margin-bottom:3px; }
    .pop-sex   { font-size:12px; color:rgba(255,255,255,0.5); margin-bottom:6px; }
    .pop-row   { display:flex; align-items:center; gap:5px; font-size:12px;
                 color:rgba(255,255,255,0.75); margin-bottom:3px; }
    .pop-dot   { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .pop-coords{ font-size:11px; color:#11d41e; margin-top:6px; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([-1.9403, 29.8739], 8);

  // ── Tile layers ──────────────────────────────────────────────────────────
  var tileDefs  = ${tileLayers};
  var currentTL = null;

  function setMapMode(id) {
    if (currentTL) map.removeLayer(currentTL);
    var def = tileDefs[id];
    currentTL = L.tileLayer(def.url, { attribution: def.attr, maxZoom: 19 });
    currentTL.addTo(map);
  }
  setMapMode('street'); // default

  // ── Markers ──────────────────────────────────────────────────────────────
  var users  = ${JSON.stringify(markers)};
  var bounds = [];

  users.forEach(function(u) {
    var isMale = u.sex === 'MALE';
    var color  = isMale ? '#4A90E2' : '#E91E63';
    var symbol = isMale ? '&#9794;' : '&#9792;';

    var pin = L.divIcon({
      className: '',
      html: ${JSON.stringify(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="46" viewBox="0 0 32 46">` +
          `<path d="M16 1 C7.72 1 1 7.72 1 16 C1 28 16 45 16 45 C16 45 31 28 31 16 C31 7.72 24.28 1 16 1 Z" fill="PINCOLOR" stroke="white" stroke-width="2"/>` +
          `<circle cx="16" cy="16" r="9" fill="rgba(255,255,255,0.2)"/>` +
          `<text x="16" y="20" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="13" font-weight="bold" font-family="Arial">PINSYMBOL</text>` +
          `</svg>`,
      )}.replace('PINCOLOR', color).replace('PINSYMBOL', symbol),
      iconSize:    [32, 46],
      iconAnchor:  [16, 45],
      popupAnchor: [0, -48],
    });

    var popup =
      '<div class="pop">' +
        '<div class="pop-name">' + u.name + '</div>' +
        '<div class="pop-sex">' + (isMale ? '♂ Male' : '♀ Female') + '</div>' +
        '<div class="pop-row">' +
          '<span class="pop-dot" style="background:' + color + '"></span>' +
          u.district + ', ' + u.sector +
        '</div>' +
        '<div class="pop-coords">&#128205; ' + u.lat.toFixed(5) + ', ' + u.lng.toFixed(5) + '</div>' +
      '</div>';

    L.marker([u.lat, u.lng], { icon: pin })
      .addTo(map)
      .bindPopup(popup, { maxWidth: 220, className: '' });

    bounds.push([u.lat, u.lng]);
  });

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [55, 55], maxZoom: 13 });
  }
</script>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function UsersMapScreen() {
  const { colors } = useTheme();
  const webRef = useRef<WebView>(null);

  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ModeId>('street');
  const [showList, setShowList] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await getUsersWithLocation());
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (id: ModeId) => {
    setActiveMode(id);
    webRef.current?.injectJavaScript(`setMapMode('${id}'); true;`);
  };

  // ── Loading / error / empty ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#11d41e" />
        <Text style={[styles.label, { color: colors.text }]}>Loading map…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={48} color="#ff4444" />
        <Text style={[styles.label, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={fetchUsers}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="person-off" size={48} color="#888" />
        <Text style={[styles.label, { color: colors.text }]}>No breeders with location data</Text>
        <TouchableOpacity style={styles.btn} onPress={fetchUsers}>
          <Text style={styles.btnText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const maleCount   = users.filter((u) => u.sex === 'MALE').length;
  const femaleCount = users.length - maleCount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: '#11d41e22' }]}>
            <MaterialIcons name="people" size={14} color="#11d41e" />
            <Text style={[styles.statTxt, { color: '#11d41e' }]}>{users.length}</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#4A90E222' }]}>
            <MaterialIcons name="male" size={14} color="#4A90E2" />
            <Text style={[styles.statTxt, { color: '#4A90E2' }]}>{maleCount}</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#E91E6322' }]}>
            <MaterialIcons name="female" size={14} color="#E91E63" />
            <Text style={[styles.statTxt, { color: '#E91E63' }]}>{femaleCount}</Text>
          </View>

          {/* List / Map toggle */}
          <TouchableOpacity
            style={[styles.statChip, { backgroundColor: colors.glassBackground, marginLeft: 'auto' }]}
            onPress={() => setShowList((v) => !v)}
          >
            <MaterialIcons name={showList ? 'map' : 'list'} size={14} color={colors.text} />
            <Text style={[styles.statTxt, { color: colors.text }]}>{showList ? 'Map' : 'List'}</Text>
          </TouchableOpacity>
        </View>

        {/* Map mode selector (hidden in list view) */}
        {!showList && (
          <View style={styles.modeRow}>
            {MAP_MODES.map((m) => {
              const active = activeMode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.modeBtn,
                    active
                      ? { backgroundColor: '#11d41e', borderColor: '#11d41e' }
                      : { backgroundColor: colors.glassBackground, borderColor: 'rgba(255,255,255,0.12)' },
                  ]}
                  onPress={() => switchMode(m.id)}
                >
                  <MaterialIcons name={m.icon} size={14} color={active ? '#fff' : 'rgba(255,255,255,0.55)'} />
                  <Text style={[styles.modeTxt, { color: active ? '#fff' : 'rgba(255,255,255,0.55)' }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Map / List ──────────────────────────────────────────────────── */}
      {showList ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
          {users.map((user) => (
            <View key={user.userId} style={[styles.userCard, { backgroundColor: colors.glassBackground }]}>
              <View style={[styles.avatar, { backgroundColor: user.sex === 'MALE' ? '#4A90E2' : '#E91E63' }]}>
                <MaterialIcons name="person" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                <Text style={styles.userSub}>
                  {user.sex === 'MALE' ? '♂ Male' : '♀ Female'} · {user.district}, {user.sector}
                </Text>
                {user.latitude != null && (
                  <Text style={styles.userCoords}>
                    {user.latitude.toFixed(4)}, {user.longitude?.toFixed(4)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <WebView
          ref={webRef}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          source={{ html: buildLeafletHTML(users) }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.centered, StyleSheet.absoluteFillObject, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color="#11d41e" />
            </View>
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 20 },
  label:     { fontSize: 16, textAlign: 'center' },
  btn: {
    backgroundColor: '#11d41e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },

  topBar: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statTxt: { fontSize: 13, fontWeight: '600' },

  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  modeTxt: { fontSize: 12, fontWeight: '600' },

  listContent: { padding: 12, gap: 10, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName:   { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  userSub:    { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  userCoords: { fontSize: 11, color: '#11d41e' },
});
