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
import type { FieldCorrection, RuleResult } from '../lib/types';
import { activeSession } from './index';

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
  const reviewFields = draftReport.field_results.filter((fr) => fr.decision === 'REVIEW');
  const acknowledgedCount = reviewFields.filter((fr) => corrections[fr.field_name]?.acknowledged).length;
  const allAcknowledged = reviewFields.length === 0 || acknowledgedCount === reviewFields.length;

  function handleAction(
    fieldName: string,
    action: 'confirmed' | 'corrected' | 'marked_absent',
    value?: string
  ) {
    setCorrections((prev) => ({
      ...prev,
      [fieldName]: {
        field_name: fieldName,
        action,
        value,
        reviewer_id: 'inspector_001', // Hardcoded for MVP, Phase 6 adds auth
        acknowledged: true,
      },
    }));
  }

  async function handleSubmit() {
    if (!session) return;
    if (!allAcknowledged) {
      Alert.alert('Incomplete', 'Please acknowledge all fields marked for REVIEW.');
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
            <Text style={styles.badgeText}>HUMAN RECONCILIATION</Text>
          </View>
          <Text style={styles.title}>Review Draft Report</Text>
          <Text style={styles.subtitle}>
            {reviewFields.length === 0
              ? 'All AI extraction rules passed with high confidence.'
              : `Verify AI extractions for ${reviewFields.length} field${reviewFields.length > 1 ? 's' : ''} flagged for review.`}
          </Text>
        </View>

        {/* Category Mismatch Warning Box - Prominent Amber/Orange Alert */}
        {draftReport.category_mismatch && (
          <View style={styles.warningBox}>
            <View style={styles.warningHeaderRow}>
              <Ionicons name="warning" size={22} color={Colors.qualityMedium} />
              <Text style={styles.warningTitle}>Category Mismatch Detected</Text>
            </View>
            <Text style={styles.warningText}>
              The AI detected packaging keywords that do not strongly match your selected category.
              Please verify field values carefully before finalizing.
            </Text>
          </View>
        )}

        {/* Progress Bar Header when review fields exist */}
        {reviewFields.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Reconciliation Progress</Text>
              <Text style={styles.progressCounter}>
                {acknowledgedCount} of {reviewFields.length} resolved
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${(acknowledgedCount / reviewFields.length) * 100}%`,
                    backgroundColor: allAcknowledged ? Colors.pass : Colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Review Fields List or Success State */}
        {reviewFields.length === 0 ? (
          <View style={styles.successBox}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={36} color={Colors.pass} />
            </View>
            <Text style={styles.successTitle}>Ready to Finalize</Text>
            <Text style={styles.successText}>
              All fields were processed automatically. No manual reconciliation is required.
            </Text>
          </View>
        ) : (
          <View style={styles.fieldList}>
            {reviewFields.map((fr: RuleResult) => {
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
                        <Text style={styles.resolvedBadgeText}>Resolved</Text>
                      </View>
                    ) : (
                      <View style={styles.reviewBadge}>
                        <Text style={styles.reviewBadgeText}>Needs Review</Text>
                      </View>
                    )}
                  </View>

                  {/* AI Uncertainty Reason */}
                  <View style={styles.reasonBox}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.review} style={styles.reasonIcon} />
                    <Text style={styles.reasonText}>{fr.reason}</Text>
                  </View>

                  {/* Extracted Value Callout */}
                  {fr.evidence.value ? (
                    <View style={styles.evidenceBox}>
                      <Text style={styles.evidenceLabel}>Extracted Value:</Text>
                      <Text style={styles.evidenceValue}>"{fr.evidence.value}"</Text>
                    </View>
                  ) : (
                    <View style={styles.evidenceBoxEmpty}>
                      <Text style={styles.evidenceLabel}>Extracted Value:</Text>
                      <Text style={styles.evidenceValueEmpty}>Not Detected</Text>
                    </View>
                  )}

                  {/* Distinct Color-Coded Action Buttons */}
                  <View style={styles.actionsRow}>
                    {/* 1. Confirm AI (Green) */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.btnConfirm,
                        isConfirmed && styles.btnConfirmActive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handleAction(fr.field_name, 'confirmed')}
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
                        Confirm AI
                      </Text>
                    </Pressable>

                    {/* 2. Correct (Blue) */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.btnCorrect,
                        isCorrecting && styles.btnCorrectActive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handleAction(fr.field_name, 'corrected', currentCorrection?.value || '')}
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
                        Correct
                      </Text>
                    </Pressable>

                    {/* 3. Mark Absent (Red/Amber) */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.btnAbsent,
                        isAbsent && styles.btnAbsentActive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handleAction(fr.field_name, 'marked_absent')}
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
                        Mark Absent
                      </Text>
                    </Pressable>
                  </View>

                  {/* TextInput when Correct is chosen */}
                  {isCorrecting && (
                    <View style={styles.inputContainer}>
                      <View style={styles.inputHeader}>
                        <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
                        <Text style={styles.inputLabel}>Enter Correct Value</Text>
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Type accurate measurement or text..."
                        placeholderTextColor={Colors.textTertiary}
                        value={currentCorrection?.value || ''}
                        onChangeText={(val) => handleAction(fr.field_name, 'corrected', val)}
                        autoFocus
                      />
                    </View>
                  )}
                </View>
              );
            })}
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
  evidenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 14,
    gap: 6,
  },
  evidenceBoxEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 14,
    gap: 6,
  },
  evidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  evidenceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  evidenceValueEmpty: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.textTertiary,
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
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Confirm AI Button Styles (Green) */
  btnConfirm: {
    backgroundColor: Colors.pass + '12',
    borderColor: Colors.pass + '50',
  },
  btnConfirmActive: {
    backgroundColor: Colors.pass,
    borderColor: Colors.pass,
  },
  btnConfirmText: {
    color: Colors.pass,
  },
  btnConfirmTextActive: {
    color: Colors.black,
  },

  /* Correct Button Styles (Blue) */
  btnCorrect: {
    backgroundColor: Colors.primary + '12',
    borderColor: Colors.primary + '50',
  },
  btnCorrectActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  btnCorrectText: {
    color: Colors.primary,
  },
  btnCorrectTextActive: {
    color: Colors.white,
  },

  /* Mark Absent Button Styles (Red) */
  btnAbsent: {
    backgroundColor: Colors.fail + '12',
    borderColor: Colors.fail + '50',
  },
  btnAbsentActive: {
    backgroundColor: Colors.fail,
    borderColor: Colors.fail,
  },
  btnAbsentText: {
    color: Colors.fail,
  },
  btnAbsentTextActive: {
    color: Colors.white,
  },

  inputContainer: {
    marginTop: 14,
    backgroundColor: Colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  submitBtnTextDisabled: {
    color: Colors.textTertiary,
  },
});

