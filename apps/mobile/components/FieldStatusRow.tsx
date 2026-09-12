/**
 * FieldStatusRow — one row in the result screen's field list.
 *
 * Shows:
 *   - Field label (human-readable)
 *   - Decision badge (PASS / FAIL / REVIEW / NOT_APPLICABLE)
 *   - Value extracted by OCR (or "–" if absent)
 *   - Evidence state chip
 *   - Confidence indicator
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import type { Decision, EvidenceState, RuleResult } from '../lib/types';

interface Props {
  result: RuleResult;
}

const FIELD_LABELS: Record<string, string> = {
  mrp: 'MRP',
  net_quantity: 'Net Quantity',
  manufacturing_date: 'Mfg. Date',
  manufacturer_name: 'Manufacturer',
  consumer_care: 'Consumer Care',
};

const DECISION_COLOR: Record<Decision, string> = {
  PASS: Colors.pass,
  FAIL: Colors.fail,
  REVIEW: Colors.review,
  NOT_APPLICABLE: Colors.notApplicable,
  CATEGORY_NOT_SUPPORTED: Colors.notApplicable,
};

const STATE_LABEL: Record<EvidenceState, string> = {
  FOUND: 'Found',
  NOT_FOUND: 'Not found',
  NOT_VERIFIABLE: 'Unverifiable',
  CONFLICTING: 'Conflict',
};

export function FieldStatusRow({ result }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { evidence, decision, reason } = result;
  const decisionColor = DECISION_COLOR[decision];
  const fieldLabel = FIELD_LABELS[result.field_name] ?? result.field_name;

  return (
    <Pressable
      style={styles.container}
      onPress={() => setExpanded((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={`${fieldLabel}: ${decision}`}
    >
      {/* ── Main row ── */}
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.fieldLabel}>{fieldLabel}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {evidence.value ?? (evidence.candidates?.[0] ?? '—')}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: decisionColor + '22' }]}>
          <Text style={[styles.badgeText, { color: decisionColor }]}>
            {decision}
          </Text>
        </View>
      </View>

      {/* ── Expanded detail ── */}
      {expanded && (
        <View style={styles.detail}>
          <DetailRow label="Evidence" value={STATE_LABEL[evidence.state]} />
          {evidence.ocr_confidence != null && (
            <DetailRow
              label="Confidence"
              value={`${(evidence.ocr_confidence * 100).toFixed(0)}%`}
            />
          )}
          {evidence.ocr_engine && (
            <DetailRow label="Engine" value={evidence.ocr_engine} />
          )}
          {evidence.image_quality && (
            <DetailRow label="Image" value={evidence.image_quality} />
          )}
          {evidence.candidates && evidence.candidates.length > 0 && (
            <DetailRow
              label="Readings"
              value={evidence.candidates.join(' vs ')}
            />
          )}
          <DetailRow label="Reason" value={reason} />
        </View>
      )}

      {/* ── Expand indicator ── */}
      <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} selectable>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  value: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  detail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  chevron: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    fontSize: 10,
    color: Colors.textTertiary,
  },
});
