/**
 * ResultScreen — field-by-field inspection outcome.
 *
 * Shows:
 *   - Overall decision banner (PASS / FAIL / REVIEW)
 *   - Per-field rule result rows (FieldStatusRow — tap to expand evidence)
 *   - Coverage summary
 *   - "Start new inspection" button (goes back to HomeScreen)
 *
 * This is the final screen in the inspector flow.
 * Header back button is intentionally hidden (AGENTS.md: reports are append-only;
 * going back could confuse the inspector into re-submitting).
 */

import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldStatusRow } from '../components/FieldStatusRow';
import { Colors } from '../constants/colors';
import type { Decision, InspectionReport, RuleResult } from '../lib/types';
import { activeSession } from './index';

const DECISION_COLOR: Record<Decision, string> = {
  PASS: Colors.pass,
  FAIL: Colors.fail,
  REVIEW: Colors.review,
  NOT_APPLICABLE: Colors.notApplicable,
  CATEGORY_NOT_SUPPORTED: Colors.notApplicable,
};

const DECISION_ICON: Record<Decision, string> = {
  PASS: '✓',
  FAIL: '✗',
  REVIEW: '?',
  NOT_APPLICABLE: '—',
  CATEGORY_NOT_SUPPORTED: '—',
};

const DECISION_LABEL: Record<Decision, string> = {
  PASS: 'COMPLIANT',
  FAIL: 'NON-COMPLIANT',
  REVIEW: 'NEEDS REVIEW',
  NOT_APPLICABLE: 'N/A',
  CATEGORY_NOT_SUPPORTED: 'UNSUPPORTED CATEGORY',
};

function OverallBanner({ report }: { report: InspectionReport }) {
  const color = DECISION_COLOR[report.overall_decision];
  const icon = DECISION_ICON[report.overall_decision];
  const label = DECISION_LABEL[report.overall_decision];

  return (
    <View style={[styles.banner, { backgroundColor: color + '1A', borderColor: color + '66' }]}>
      <Text style={[styles.bannerIcon, { color }]}>{icon}</Text>
      <View style={styles.bannerText}>
        <Text style={[styles.bannerDecision, { color }]}>{label}</Text>
        <Text style={styles.bannerMeta}>
          {report.field_results.length} fields checked · v{report.rule_version}
        </Text>
      </View>
    </View>
  );
}

export default function ResultScreen() {
  const router = useRouter();
  const report = activeSession?.report;

  if (!report) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.noReport}>
          <Text style={styles.noReportText}>No report available. Submit an inspection first.</Text>
          <Pressable style={styles.restartBtn} onPress={() => router.replace('/')}>
            <Text style={styles.restartBtnText}>Start New Inspection</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function renderItem({ item }: { item: RuleResult }) {
    return <FieldStatusRow result={item} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={report.field_results}
        keyExtractor={(item) => item.field_name}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Overall banner */}
            <OverallBanner report={report} />

            {/* Coverage row */}
            <View style={styles.coverageRow}>
              {(['front', 'back', 'close_up'] as const).map((role) => {
                const covered = report.coverage?.[role] ?? false;
                return (
                  <View key={role} style={[styles.coverChip, covered ? styles.coverChipDone : styles.coverChipMissing]}>
                    <Text style={[styles.coverChipText, { color: covered ? Colors.pass : Colors.textTertiary }]}>
                      {covered ? '✓' : '○'} {role.replace('_', '-')}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.fieldListLabel}>Field Results</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.inspectionIdLabel} selectable>
              ID: {report.inspection_id}
            </Text>
            <Text style={styles.categoryLabel}>
              Category: {report.category}
            </Text>

            <Pressable
              style={({ pressed }) => [styles.restartBtn, pressed && { opacity: 0.8 }]}
              onPress={() => {
                // Clear session before going back
                if (activeSession) {
                  // Keep TS happy: set to null via module re-import trick.
                  // Full state management in Phase 5 (Context / Zustand).
                  (activeSession as any).__cleared = true;
                }
                router.replace('/');
              }}
              accessibilityRole="button"
              accessibilityLabel="Start a new inspection"
            >
              <Text style={styles.restartBtnText}>＋ Start New Inspection</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 20, gap: 0, paddingBottom: 40 },
  noReport: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  noReportText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
  header: { gap: 14, marginBottom: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  bannerIcon: { fontSize: 36, fontWeight: '800' },
  bannerText: { flex: 1, gap: 2 },
  bannerDecision: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  bannerMeta: { fontSize: 13, color: Colors.textSecondary },
  coverageRow: { flexDirection: 'row', gap: 8 },
  coverChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  coverChipDone: { backgroundColor: Colors.pass + '1A', borderColor: Colors.pass + '66' },
  coverChipMissing: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border },
  coverChipText: { fontSize: 12, fontWeight: '500' },
  fieldListLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: { gap: 10, marginTop: 24, alignItems: 'center' },
  inspectionIdLabel: { fontSize: 11, color: Colors.textTertiary, fontFamily: 'monospace' },
  categoryLabel: { fontSize: 13, color: Colors.textSecondary },
  restartBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  restartBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
