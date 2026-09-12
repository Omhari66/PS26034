/**
 * SubmitScreen — review captured images and submit for OCR + compliance check.
 *
 * Shows:
 *   - Thumbnails of all captured images with quality badges
 *   - Coverage summary
 *   - Confirmed category
 *   - Submit button → calls POST /inspections/{id}/submit
 *
 * On success → navigates to ResultScreen with the report.
 * On error    → shows alert with message (never swallows errors silently).
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoverageChecklist } from '../components/CoverageChecklist';
import { QualityBadge } from '../components/QualityBadge';
import { Colors } from '../constants/colors';
import { analyzeInspection } from '../lib/api';
import { activeSession } from './index';

const CATEGORY_LABELS: Record<string, string> = {
  packaged_food: 'Packaged Food',
  packaged_commodity: 'Packaged Commodity',
  cosmetics: 'Cosmetics & Toiletries',
  drugs_pharma: 'Drugs & Pharmaceuticals',
  textiles: 'Textiles & Garments',
};

export default function SubmitScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const session = activeSession;
  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.error}>
          <Text style={styles.errorText}>No active session. Please go back and start again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { images, category } = session;
  const acceptedCount = images.filter((i) => i.uploadResponse?.accepted).length;
  const rejectedCount = images.filter((i) => i.uploadResponse && !i.uploadResponse.accepted).length;

  async function handleSubmit() {
    if (!session) return;
    setSubmitting(true);
    try {
      const draft = await analyzeInspection(session.inspectionId);
      session.draftReport = draft;
      router.push('/reconcile');
    } catch (err) {
      Alert.alert(
        'Analysis Failed',
        `The backend returned an error:\n\n${(err as Error).message}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Summary card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Session</Text>
          <Text style={styles.inspectionId} selectable>
            {session.inspectionId}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Category</Text>
          <Text style={styles.categoryText}>
            {category ? CATEGORY_LABELS[category] ?? category : '—'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Coverage</Text>
          <CoverageChecklist images={images} />

          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{acceptedCount}</Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>
            {rejectedCount > 0 && (
              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: Colors.fail }]}>{rejectedCount}</Text>
                <Text style={styles.statLabel}>Low quality</Text>
              </View>
            )}
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{images.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Image thumbnails */}
        <Text style={styles.thumbTitle}>Captured Images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.thumbRow}>
            {images.map((img) => (
              <View key={img.role} style={styles.thumbCard}>
                <Image source={{ uri: img.localUri }} style={styles.thumb} resizeMode="cover" />
                <Text style={styles.thumbRole}>{img.role.replace('_', '-')}</Text>
                {img.uploadResponse && (
                  <QualityBadge quality={img.uploadResponse.quality} />
                )}
                {img.uploadResponse && !img.uploadResponse.accepted && (
                  <Text style={styles.thumbReject}>⚠ Low quality — OCR may be limited</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Warning if rejected images */}
        {rejectedCount > 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠ {rejectedCount} image(s) are low quality and may not be usable for OCR.
              Consider retaking before submitting.
            </Text>
          </View>
        )}

        {/* Submit button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            submitting && styles.submitBtnDisabled,
            pressed && !submitting && styles.submitBtnPressed,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit inspection for compliance check"
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Analyze Inspection</Text>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          Submission is final. To correct an error, start a new inspection session.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: Colors.fail, fontSize: 15, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inspectionId: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'monospace' },
  categoryText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.separator },
  statRow: { flexDirection: 'row', gap: 20, marginTop: 4 },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  thumbTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thumbRow: { flexDirection: 'row', gap: 12, paddingRight: 20 },
  thumbCard: { width: 130, gap: 6 },
  thumb: { width: 130, height: 100, borderRadius: 10, backgroundColor: Colors.surfaceElevated },
  thumbRole: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'capitalize' },
  thumbReject: { fontSize: 10, color: Colors.fail },
  warningBox: {
    backgroundColor: Colors.qualityMedium + '22',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.qualityMedium + '66',
  },
  warningText: { fontSize: 13, color: Colors.qualityMedium, lineHeight: 18 },
  submitBtn: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  submitBtnPressed: { opacity: 0.8 },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  disclaimer: { fontSize: 11, color: Colors.textTertiary, textAlign: 'center' },
});
