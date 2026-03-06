/**
 * lineage-verification.tsx  –  SAFE SHELL
 *
 * Minimal safe imports only. The full ML screen is loaded via dynamic
 * require() inside useEffect so that:
 *   - The route ALWAYS renders something (never a grey blank screen)
 *   - Module-load errors surface as readable text, not grey silence
 *   - Error boundaries can't catch module-level failures; this shell can
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LineageVerificationScreen() {
  const router = useRouter();
  const bv: string = require('../../../constants/bundleVersion').BUNDLE_VERSION;

  const [InnerScreen, setInnerScreen] = useState<React.ComponentType | null | false>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Capture global JS crashes that happen after mount (async errors that escape React)
  const prevHandler = useRef<((e: any, isFatal: boolean) => void) | null>(null);

  useEffect(() => {
    // Install a global error handler for uncaught exceptions BEFORE we load the inner module.
    // This is the only way to catch failures that escape React error boundaries
    // (e.g., a native bridge crash inside a useEffect async function).
    try {
      const EU = (global as any).ErrorUtils;
      if (EU?.setGlobalHandler) {
        prevHandler.current = EU.getGlobalHandler?.() ?? null;
        EU.setGlobalHandler((error: any, isFatal: boolean) => {
          const msg = error?.message ?? String(error);
          console.error('[LineageShell] global error caught:', msg, 'fatal:', isFatal);
          setLoadError(`JS CRASH (${isFatal ? 'fatal' : 'non-fatal'}): ${msg}`);
          setInnerScreen(false);
          // Don't forward to default handler — that would show RN's red screen
        });
      }
    } catch (_) {}

    // Clean up the handler when we leave this screen
    return () => {
      try {
        const EU = (global as any).ErrorUtils;
        if (EU?.setGlobalHandler && prevHandler.current) {
          EU.setGlobalHandler(prevHandler.current);
        }
      } catch (_) {}
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      try {
        const mod = require('../../../components/LineageInner');
        if (!cancelled) setInnerScreen(() => (mod.default ?? mod.LineageInner));
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message ?? String(e);
          console.error('[LineageShell] inner module failed:', msg);
          setLoadError(msg);
          setInnerScreen(false);
        }
      }
    }, 80);
    return () => { cancelled = true; clearTimeout(id); };
  }, []);

  if (InnerScreen === false) {
    return (
      <View style={s.err}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.errTitle}>❌ SCREEN LOAD ERROR</Text>
        <Text style={s.errMsg}>{loadError ?? 'Unknown error'}</Text>
        <Text style={s.bv}>BUNDLE: {bv}</Text>
      </View>
    );
  }

  if (InnerScreen === null) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color="#11d41e" size="large" />
        <Text style={s.loadText}>Loading biometric screen…</Text>
        <Text style={s.bv}>BUNDLE: {bv}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[s.back, { marginTop: 24 }]}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <InnerScreen />;
}

const s = StyleSheet.create({
  err: {
    flex: 1, backgroundColor: '#100000',
    padding: 24, justifyContent: 'center',
  },
  errTitle: {
    color: '#ff5555', fontSize: 14, fontWeight: 'bold',
    fontFamily: 'monospace', marginBottom: 12,
  },
  errMsg: {
    color: '#ffaaaa', fontSize: 11, fontFamily: 'monospace',
    marginBottom: 16, lineHeight: 18,
  },
  loading: {
    flex: 1, backgroundColor: '#081209',
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loadText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  bv: {
    color: '#11d41e', fontSize: 10, fontFamily: 'monospace',
    letterSpacing: 1.2, marginTop: 4,
  },
  back: { marginBottom: 20 },
  backText: { color: '#11d41e', fontSize: 14 },
});
