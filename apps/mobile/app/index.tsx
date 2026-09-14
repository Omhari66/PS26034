/**
 * HomeScreen — landing page.
 * Creates a new inspection session on the backend, then navigates to capture.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { createInspection, login, setTokenProvider } from '../lib/api';
import type { InspectionSession } from '../lib/types';

import { loadSession, saveSession, clearSession } from '../lib/session';

// Shared session state — passed via router params as a stringified JSON.
// In Phase 5 this becomes a context or Zustand store.
export let activeSession: InspectionSession | null = null;

export function setActiveSession(session: InspectionSession | null) {
  activeSession = session;
  if (session) {
    saveSession(session);
  } else {
    clearSession();
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resumableSession, setResumableSession] = useState<InspectionSession | null>(null);

  React.useEffect(() => {
    loadSession().then((saved) => {
      if (saved) {
        setResumableSession(saved);
      }
    });
  }, []);

  async function handleStart() {
    setLoading(true);
    try {
      // Auto-login as the demo inspector (backend Phase 6 auth)
      const auth = await login('inspector@demo.ps26034', 'inspector123');
      setTokenProvider(() => auth.token);

      const res = await createInspection('inspector@demo.ps26034');
      const newSession: InspectionSession = {
        inspectionId: res.inspection_id,
        category: null,
        images: [],
        draftReport: null,
        report: null,
      };
      setActiveSession(newSession);
      setResumableSession(null);
      router.push('/capture');
    } catch (err) {
      Alert.alert(
        'Connection Error',
        `Could not reach the server.\n\n${(err as Error).message}\n\nMake sure the backend is running and EXPO_PUBLIC_API_URL is set.`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResume() {
    if (!resumableSession) return;
    setLoading(true);
    try {
      const auth = await login('inspector@demo.ps26034', 'inspector123');
      setTokenProvider(() => auth.token);
      setActiveSession(resumableSession);
      router.push('/capture');
    } catch (err) {
      Alert.alert('Connection Error', `Could not reach server to resume: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>⚖️</Text>
          </View>
          <Text style={styles.appName}>PS 26034</Text>
          <Text style={styles.appTagline}>Legal Metrology Inspection</Text>
        </View>

        {/* Info cards */}
        <View style={styles.cardRow}>
          {[
            { icon: '📷', label: 'Capture\nlabel photos' },
            { icon: '🔍', label: 'AI reads\ndeclarations' },
            { icon: '📋', label: 'Instant\ncompliance check' },
          ].map((item) => (
            <View key={item.label} style={styles.card}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <Text style={styles.cardLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Resume button if previous unsubmitted session exists */}
        {resumableSession && (
          <Pressable
            style={({ pressed }) => [styles.resumeBtn, pressed && styles.startBtnPressed]}
            onPress={handleResume}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Resume existing inspection session"
          >
            <Text style={styles.resumeBtnText}>
              Resume Session ({resumableSession.images.length} photos)
            </Text>
          </Pressable>
        )}

        {/* Start button */}
        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
          onPress={handleStart}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Start new inspection"
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.startBtnText}>Start New Inspection</Text>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          All findings are based on OCR of product label images.
          Inspector-confirmed category is required before submission.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  logoArea: { alignItems: 'center', gap: 8 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary },
  appTagline: { fontSize: 15, color: Colors.textSecondary },
  cardRow: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: { fontSize: 24 },
  cardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  resumeBtn: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  resumeBtnText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  startBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  startBtnPressed: { opacity: 0.8 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  disclaimer: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
});
