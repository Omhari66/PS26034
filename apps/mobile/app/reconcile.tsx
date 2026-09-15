import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { submitInspection } from '../lib/api';
import { checkCategoryMismatch } from '../lib/category_checker';
import type { FieldCorrection, RuleResult } from '../lib/types';
import { activeSession } from './index';

function valuesDisagree(val1?: string | null, val2?: string | null): boolean {
  if (!val1 || !val2) return false;
  const n1 = val1.toString().toLowerCase().replace(/[₹\s,rs\.]/gi, '').trim();
  const n2 = val2.toString().toLowerCase().replace(/[₹\s,rs\.]/gi, '').trim();
  return n1 !== n2;
}

export default function ReconcileScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [corrections, setCorrections] = useState<Record<string, FieldCorrection>>({});

  const session = activeSession;
  if (!session || !session.draftReport) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.error}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.fail} />
          <Text style={styles.errorText}>No draft report available. Please go back.</Text>
          <Pressable style={styles.goBackBtn} onPress={() => router.push('/')}>
            <Text style={styles.goBackBtnText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { draftReport } = session;
  const preEntered = session.preEnteredValues || {};

  // Combine OCR text for local category sanity check
  const combinedOcrText = draftReport.field_results
    .map((fr) => [fr.evidence.value, ...(fr.evidence.candidates || [])].filter(Boolean).join(' '))
    .join(' ');
  const categoryCheck = checkCategoryMismatch(combinedOcrText, session.category || '');
  const showCategoryWarning = draftReport.category_mismatch || categoryCheck.isMismatch;

  // Identify fields needing reconciliation:
  // 1. Fields where AI decision === 'REVIEW'
  // 2. Fields where inspector pre-entered value and AI extracted value disagree
  const reconcileFields = draftReport.field_results.filter((fr) => {
    const inspectorVal = preEntered[fr.field_name];
    const aiVal = fr.evidence.value;
    const isDiff = valuesDisagree(inspectorVal, aiVal);
    return fr.decision === 'REVIEW' || isDiff;
  });

  // Ticket 6: Check that every REVIEW / disagreement field has acknowledged === true
  const acknowledgedCount = reconcileFields.filter((fr) => corrections[fr.field_name]?.acknowledged).length;
  const allAcknowledged = reconcileFields.length === 0 || acknowledgedCount === reconcileFields.length;

  function handleAction(
    fieldName: string,
    action: 'confirmed' | 'corrected' | 'marked_absent',
    aiValue: string | null,
    enteredVal?: string
  ) {
    const isCorrected = action === 'corrected';
    const correctedValue = isCorrected ? (enteredVal !== undefined ? enteredVal : preEntered[fieldName] || '') : null;
    const isAck = action === 'confirmed' || action === 'marked_absent' || (isCorrected && (correctedValue !== null && correctedValue.trim() !== ''));

    setCorrections((prev) => ({
      ...prev,
      [fieldName]: {
        field_name: fieldName,
        action,
        ai_value: aiValue,
        corrected_value: correctedValue,
        value: isCorrected ? correctedValue : (action === 'confirmed' ? aiValue : null),
        reviewer_id: 'inspector_001',
        acknowledged: isAck,
        timestamp: new Date().toISOString(),
      },
    }));
  }

  async function handleSubmit() {
    if (!session) return;
    if (!allAcknowledged) {
      Alert.alert(
        'Submission Blocked',
        'Please verify all flagged fields before submitting.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const finalReport = await submitInspection(
        session.inspectionId,
        Object.values(corrections)
      );
      session.report = finalReport;
      router.push('/result');
    } catch (err) {
      Alert.alert(
        'Submission Failed',
        `The backend returned an error:\n\n${(err as Error).message}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Header Badge & Title */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="git-compare-outline" size={14} color={Colors.review} />
            <Text style={styles.badgeText}>EVIDENCE RECONCILIATION</Text>
          </View>
          <Text style={styles.title}>Reconcile Disagreements</Text>
          <Text style={styles.subtitle}>
            {reconcileFields.length === 0
              ? 'All inspector inputs and AI extractions match with high confidence.'
              : `Review and resolve ${reconcileFields.length} field disagreement${reconcileFields.length > 1 ? 's' : ''} or REVIEW item${reconcileFields.length > 1 ? 's' : ''}.`}
          </Text>
        </View>

        {/* Feature 2: Soft Yellow Category Sanity Warning Box */}
        {showCategoryWarning && (
          <View style={styles.warningBox}>
            <View style={styles.warningHeaderRow}>
              <Ionicons name="warning" size={22} color={Colors.qualityMedium} />
              <Text style={styles.warningTitle}>Category Mismatch Warning</Text>
            </View>
            <Text style={styles.warningText}>
              {categoryCheck.warningMessage ||
                'The AI detected packaging keywords that do not strongly match your selected category. Please verify field values carefully before finalizing. (Your confirmed category remains active)'}
            </Text>
          </View>
        )}

        {/* Progress Bar Header when reconciliation fields exist */}
        {reconcileFields.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Reconciliation Progress</Text>
              <Text style={styles.progressCounter}>
                {acknowledgedCount} of {reconcileFields.length} resolved
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${(acknowledgedCount / reconcileFields.length) * 100}%`,
                    backgroundColor: allAcknowledged ? Colors.pass : Colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Reconciliation Fields List or Success State */}
        {reconcileFields.length === 0 ? (
          <View style={styles.successBox}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={36} color={Colors.pass} />
            </View>
            <Text style={styles.successTitle}>No Disagreements Detected</Text>
            <Text style={styles.successText}>
              All inspector pre-entered values match AI OCR extractions seamlessly. Ready for final report submission.
            </Text>
          </View>
        ) : (
          <View style={styles.fieldList}>
            {reconcileFields.map((fr: RuleResult) => {
              const inspectorVal = preEntered[fr.field_name];
              const aiVal = fr.evidence.value;
              const hasDiff = valuesDisagree(inspectorVal, aiVal);
              const currentCorrection = corrections[fr.field_name];
              const isConfirmed = currentCorrection?.action === 'confirmed';
              const isCorrecting = currentCorrection?.action === 'corrected';
              const isAbsent = currentCorrection?.action === 'marked_absent';
              const isResolved = currentCorrection?.acknowledged;

              return (
                <View
                  key={fr.field_name}
                  style={[
                    styles.fieldCard,
                    isResolved && styles.fieldCardResolved,
                  ]}
                >
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldName}>{fr.field_name.replace(/_/g, ' ')}</Text>
                    {isResolved ? (
                      <View style={styles.resolvedBadge}>
                        <Ionicons name="checkmark" size={12} color={Colors.pass} />
                        <Text style={styles.resolvedBadgeText}>Resolved ({currentCorrection.action})</Text>
                      </View>
                    ) : (
                      <View style={styles.reviewBadge}>
                        <Text style={styles.reviewBadgeText}>Needs Resolution</Text>
                      </View>
                    )}
                  </View>

                  {/* Disagreement Callout Banner */}
                  {hasDiff && (
                    <View style={styles.diffBanner}>
                      <Ionicons name="git-compare" size={18} color={Colors.qualityMedium} />
                      <Text style={styles.diffBannerText}>
                        You entered <Text style={styles.diffValueHighlight}>{inspectorVal}</Text>, AI detected <Text style={styles.diffValueHighlight}>{aiVal || 'Not Detected'}</Text> — confirm one
                      </Text>
                    </View>
                  )}

                  {/* AI Uncertainty Reason */}
                  {!hasDiff && (
                    <View style={styles.reasonBox}>
                      <Ionicons name="information-circle-outline" size={16} color={Colors.review} style={styles.reasonIcon} />
                      <Text style={styles.reasonText}>{fr.reason}</Text>
                    </View>
                  )}

                  {/* Values Display */}
                  <View style={styles.valuesComparisonBox}>
                    {inspectorVal ? (
                      <View style={styles.valueRow}>
                        <Text style={styles.valueLabel}>Inspector Entered:</Text>
                        <Text style={styles.valueTextInspector}>{inspectorVal}</Text>
                      </View>
                    ) : null}
                    <View style={styles.valueRow}>
                      <Text style={styles.valueLabel}>AI Detected:</Text>
                      <Text style={styles.valueTextAi}>{aiVal ? `"${aiVal}"` : 'Not Detected'}</Text>
                    </View>
                  </View>

                  {/* Three Required Actions */}
                  <View style={styles.actionsRow}>
                    {/* 1. Confirm AI Value */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.btnConfirm,
                        isConfirmed && styles.btnConfirmActive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handleAction(fr.field_name, 'confirmed', aiVal)}
                    >
                      <Ionicons
                        name={isConfirmed ? "checkmark-circle" : "checkmark-circle-outline"}
                        size={16}
                        color={isConfirmed ? Colors.black : Colors.pass}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          styles.btnConfirmText,
                          isConfirmed && styles.btnConfirmTextActive,
                        ]}
                      >
                        Confirm AI Value
                      </Text>
                    </Pressable>

                    {/* 2. Enter My Value */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.btnCorrect,
                        isCorrecting && styles.btnCorrectActive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handleAction(fr.field_name, 'corrected', aiVal, currentCorrection?.corrected_value || inspectorVal || '')}
                    >
                      <Ionicons
                        name={isCorrecting ? "create" : "create-outline"}
                        size={16}
                        color={isCorrecting ? Colors.white : Colors.primary}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          styles.btnCorrectText,
                          isCorrecting && styles.btnCorrectTextActive,
                        ]}
                      >
                        Enter My Value
                      </Text>
                    </Pressable>

                    {/* 3. Mark Field Absent */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.btnAbsent,
                        isAbsent && styles.btnAbsentActive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handleAction(fr.field_name, 'marked_absent', aiVal)}
                    >
                      <Ionicons
                        name={isAbsent ? "close-circle" : "close-circle-outline"}
                        size={16}
                        color={isAbsent ? Colors.white : Colors.fail}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          styles.btnAbsentText,
                          isAbsent && styles.btnAbsentTextActive,
                        ]}
                      >
                        Mark Field Absent
                      </Text>
                    </Pressable>
                  </View>

                  {/* Structured TextInput when Enter My Value is chosen */}
                  {isCorrecting && (
                    <View style={styles.inputContainer}>
                      <View style={styles.inputHeader}>
                        <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
                        <Text style={styles.inputLabel}>Enter My Value (Structured Input)</Text>
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Type accurate measurement or field value..."
                        placeholderTextColor={Colors.textTertiary}
                        value={currentCorrection?.corrected_value || ''}
                        onChangeText={(val) => handleAction(fr.field_name, 'corrected', aiVal, val)}
                        autoFocus
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Feature 1: REVIEW Field Acknowledgment Blocker Banner */}
        {!allAcknowledged && (
          <View style={styles.blockerBanner}>
            <Ionicons name="hand-left-outline" size={20} color={Colors.qualityMedium} />
            <Text style={styles.blockerText}>Please verify all flagged fields before submitting.</Text>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            (submitting || !allAcknowledged) && styles.submitBtnDisabled,
            pressed && !submitting && allAcknowledged && styles.submitBtnPressed,
          ]}
          onPress={handleSubmit}
          disabled={submitting || !allAcknowledged}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <View style={styles.submitBtnContent}>
              <Ionicons
                name="checkmark-done-circle"
                size={22}
                color={allAcknowledged ? Colors.white : Colors.textTertiary}
              />
              <Text
                style={[
                  styles.submitBtnText,
                  !allAcknowledged && styles.submitBtnTextDisabled,
                ]}
              >
                Finalize Inspection
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 48,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: Colors.fail,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  goBackBtn: {
    marginTop: 12,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goBackBtnText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.review + '1A',
    borderColor: Colors.review + '50',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    color: Colors.review,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 159, 10, 0.12)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.qualityMedium,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.qualityMedium,
  },
  warningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressCounter: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  successBox: {
    backgroundColor: Colors.pass + '12',
    borderColor: Colors.pass + '40',
    borderWidth: 1.5,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconCircle: {
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.pass,
    marginBottom: 6,
  },
  successText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldList: {
    gap: 16,
    marginBottom: 24,
  },
  fieldCard: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 3,
  },
  fieldCardResolved: {
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
    flex: 1,
  },
  reviewBadge: {
    backgroundColor: Colors.review + '20',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.review + '40',
  },
  reviewBadgeText: {
    color: Colors.review,
    fontSize: 11,
    fontWeight: '600',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.pass + '1A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.pass + '40',
  },
  resolvedBadgeText: {
    color: Colors.pass,
    fontSize: 11,
    fontWeight: '600',
  },
  diffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    borderColor: Colors.qualityMedium,
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  diffBannerText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  diffValueHighlight: {
    fontWeight: '800',
    color: Colors.qualityMedium,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  reasonIcon: {
    marginTop: 1,
  },
  reasonText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  valuesComparisonBox: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 6,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  valueTextInspector: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.qualityMedium,
  },
  valueTextAi: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  btnConfirm: {
    borderColor: Colors.pass,
    backgroundColor: Colors.pass + '15',
  },
  btnConfirmActive: {
    backgroundColor: Colors.pass,
  },
  btnConfirmText: {
    color: Colors.pass,
  },
  btnConfirmTextActive: {
    color: Colors.black,
  },
  btnCorrect: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  btnCorrectActive: {
    backgroundColor: Colors.primary,
  },
  btnCorrectText: {
    color: Colors.primary,
  },
  btnCorrectTextActive: {
    color: Colors.white,
  },
  btnAbsent: {
    borderColor: Colors.fail,
    backgroundColor: Colors.fail + '15',
  },
  btnAbsentActive: {
    backgroundColor: Colors.fail,
  },
  btnAbsentText: {
    color: Colors.fail,
  },
  btnAbsentTextActive: {
    color: Colors.white,
  },
  btnPressed: {
    opacity: 0.7,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputContainer: {
    marginTop: 14,
    backgroundColor: Colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  blockerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 10, 0.18)',
    borderColor: Colors.qualityMedium,
    borderWidth: 1.5,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  blockerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.qualityMedium,
    flex: 1,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: Colors.surfaceElevated,
    opacity: 0.6,
  },
  submitBtnPressed: {
    opacity: 0.8,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  submitBtnTextDisabled: {
    color: Colors.textTertiary,
  },
});
