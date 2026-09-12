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
          <Text style={styles.errorText}>No draft report available. Please go back.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { draftReport } = session;
  const reviewFields = draftReport.field_results.filter((fr) => fr.decision === 'REVIEW');
  const allAcknowledged = reviewFields.every((fr) => corrections[fr.field_name]?.acknowledged);

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
        <Text style={styles.title}>Review Draft Report</Text>

        {draftReport.category_mismatch && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠ Category Mismatch Detected</Text>
            <Text style={styles.warningText}>
              The AI detected keywords that do not strongly match your selected category.
              Please ensure your category selection is correct before finalizing.
            </Text>
          </View>
        )}

        {reviewFields.length === 0 ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              All fields were processed automatically. No manual review is required.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.subtitle}>
              {reviewFields.length} field(s) require manual verification
            </Text>
            {reviewFields.map((fr: RuleResult) => {
              const currentCorrection = corrections[fr.field_name];
              const isCorrecting = currentCorrection?.action === 'corrected';

              return (
                <View key={fr.field_name} style={styles.fieldCard}>
                  <Text style={styles.fieldName}>{fr.field_name}</Text>
                  <Text style={styles.reason}>{fr.reason}</Text>
                  {fr.evidence.value && (
                    <Text style={styles.extractedValue}>
                      Extracted: <Text style={styles.valueText}>{fr.evidence.value}</Text>
                    </Text>
                  )}

                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[
                        styles.actionBtn,
                        currentCorrection?.action === 'confirmed' && styles.actionBtnActive,
                      ]}
                      onPress={() => handleAction(fr.field_name, 'confirmed')}
                    >
                      <Text style={[
                        styles.actionBtnText,
                        currentCorrection?.action === 'confirmed' && styles.actionBtnTextActive,
                      ]}>Confirm AI</Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionBtn,
                        isCorrecting && styles.actionBtnActive,
                      ]}
                      onPress={() => handleAction(fr.field_name, 'corrected', '')}
                    >
                      <Text style={[
                        styles.actionBtnText,
                        isCorrecting && styles.actionBtnTextActive,
                      ]}>Correct</Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionBtn,
                        currentCorrection?.action === 'marked_absent' && styles.actionBtnActive,
                      ]}
                      onPress={() => handleAction(fr.field_name, 'marked_absent')}
                    >
                      <Text style={[
                        styles.actionBtnText,
                        currentCorrection?.action === 'marked_absent' && styles.actionBtnTextActive,
                      ]}>Mark Absent</Text>
                    </Pressable>
                  </View>

                  {isCorrecting && (
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter correct value..."
                      value={currentCorrection?.value || ''}
                      onChangeText={(val) => handleAction(fr.field_name, 'corrected', val)}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

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
            <Text style={styles.submitBtnText}>Finalize Inspection</Text>
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
    padding: 24,
    paddingBottom: 48,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.fail,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffe69c',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#664d03',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#664d03',
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#d1e7dd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  successText: {
    fontSize: 14,
    color: '#0f5132',
  },
  fieldCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  reason: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  extractedValue: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  valueText: {
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  actionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  actionBtnTextActive: {
    color: Colors.white,
  },
  textInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.border,
  },
  submitBtnPressed: {
    opacity: 0.8,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
