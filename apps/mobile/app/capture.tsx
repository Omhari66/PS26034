/**
 * CaptureScreen — camera capture flow.
 *
 * Allows the inspector to capture front / back / close-up photos.
 * Each photo is:
 *   1. Taken from camera (or picked from gallery as fallback)
 *   2. Uploaded to POST /inspections/{id}/images immediately
 *   3. Quality badge shown inline
 *
 * Coverage checklist from CONTRACTS.md #1: front + back are required;
 * close_up is optional but strongly recommended.
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
import { uploadImage } from '../lib/api';
import type { CapturedImage, ImageRole } from '../lib/types';
import { activeSession, setActiveSession } from './index';

import { calculatePHash, calculateSimilarity, isDuplicate } from '../lib/phash';

const ROLES: { role: ImageRole; label: string; hint: string; icon: string }[] = [
  { role: 'front', label: 'Front', hint: 'Full front of the package', icon: 'cube-outline' },
  { role: 'back', label: 'Back', hint: 'Full back of the package', icon: 'cube' },
  { role: 'close_up', label: 'Close-up', hint: 'MRP / details label (close)', icon: 'search' },
];

export default function CaptureScreen() {
  const router = useRouter();
  const [images, setImages] = useState<CapturedImage[]>(activeSession?.images || []);
  const [uploading, setUploading] = useState<ImageRole | null>(null);

  // Sync state with activeSession on mount or navigation
  React.useEffect(() => {
    if (activeSession?.images) {
      setImages(activeSession.images);
    }
  }, []);

  const updateSessionImages = useCallback((newImages: CapturedImage[]) => {
    setImages(newImages);
    if (activeSession) {
      setActiveSession({
        ...activeSession,
        images: newImages,
      });
    }
  }, []);

  const capturedRoles = new Set(
    images.filter((i) => i.uploadStatus !== 'failed').map((i) => i.role),
  );
  const canProceed = capturedRoles.has('front') && capturedRoles.has('back');

  const handleCapture = useCallback(
    async (role: ImageRole) => {
      if (!activeSession) {
        Alert.alert('Error', 'No active inspection session. Go back and start again.');
        return;
      }

      // Request camera permission
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        // Fallback to gallery if camera denied
        const galleryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!galleryPerm.granted) {
          Alert.alert('Permission denied', 'Camera or gallery access is required to capture images.');
          return;
        }
      }

      const result = perm.granted
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.85,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.85,
          });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      // ─── Duplicate Image Protection (pHash check) ─────────────────────────
      let phash: string | undefined;
      try {
        phash = await calculatePHash(asset.uri);
      } catch (err) {
        console.warn('pHash calculation failed:', err);
      }

      if (phash) {
        // Compare against images already captured in this session (excluding current role being retaken)
        const existingImages = (activeSession?.images || images).filter(
          (img) => img.role !== role && img.phash,
        );

        const duplicate = existingImages.find((img) => isDuplicate(phash!, img.phash!));
        if (duplicate) {
          const similarity = calculateSimilarity(phash, duplicate.phash!).toFixed(1);
          const roleName = duplicate.role.replace('_', ' ').toUpperCase();
          Alert.alert(
            'Duplicate Image Blocked',
            `This photo is ${similarity}% similar to the image already uploaded as "${roleName}".\n\nPlease retake a distinct photo of the package panel.`,
            [{ text: 'Retake Photo' }],
          );
          return; // Block upload and role assignment
        }
      }

      setUploading(role);

      try {
        const uploadRes = await uploadImage(
          activeSession.inspectionId,
          role,
          asset.uri,
          asset.mimeType ?? 'image/jpeg',
        );

        const captured: CapturedImage = {
          role,
          localUri: asset.uri,
          phash,
          uploadStatus: 'success',
          uploadResponse: uploadRes,
        };

        const newImages = [...images.filter((i) => i.role !== role), captured];
        updateSessionImages(newImages);

        if (!uploadRes.accepted) {
          Alert.alert(
            'Low Quality Image',
            `This image was accepted but flagged as low quality: ${uploadRes.reason}\n\nYou can re-capture for better results.`,
          );
        }
      } catch (err) {
        const errMsg = (err as Error).message;
        const failedCaptured: CapturedImage = {
          role,
          localUri: asset.uri,
          phash,
          uploadStatus: 'failed',
          uploadError: errMsg,
        };
        const newImages = [...images.filter((i) => i.role !== role), failedCaptured];
        updateSessionImages(newImages);

        Alert.alert(
          'Upload Failed (Saved Locally)',
          `The photo was captured but could not be sent to the server:\n\n${errMsg}\n\nPhoto saved locally. Tap "Retry Upload" when online.`,
        );
      } finally {
        setUploading(null);
      }
    },
    [images, updateSessionImages],
  );

  const handleRetryUpload = useCallback(
    async (role: ImageRole) => {
      const existing = images.find((i) => i.role === role);
      if (!existing || !activeSession) return;

      setUploading(role);

      try {
        const uploadRes = await uploadImage(
          activeSession.inspectionId,
          role,
          existing.localUri,
          'image/jpeg',
        );

        const updated: CapturedImage = {
          ...existing,
          uploadStatus: 'success',
          uploadError: undefined,
          uploadResponse: uploadRes,
        };

        const newImages = [...images.filter((i) => i.role !== role), updated];
        updateSessionImages(newImages);
      } catch (err) {
        const errMsg = (err as Error).message;
        const updated: CapturedImage = {
          ...existing,
          uploadStatus: 'failed',
          uploadError: errMsg,
        };
        const newImages = [...images.filter((i) => i.role !== role), updated];
        updateSessionImages(newImages);

        Alert.alert('Retry Failed', `Upload attempt failed again:\n\n${errMsg}`);
      } finally {
        setUploading(null);
      }
    },
    [images, updateSessionImages],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Coverage checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coverage</Text>
          <CoverageChecklist images={images} />
          <Text style={styles.hint}>Front and Back are required. Close-up is recommended.</Text>
        </View>

        {/* Capture buttons */}
        {ROLES.map(({ role, label, hint, icon }) => {
          const captured = images.find((i) => i.role === role);
          const isUploading = uploading === role;

          return (
            <View key={role} style={styles.roleCard}>
              <View style={styles.roleHeader}>
                <Ionicons name={icon as any} size={20} color={Colors.primary} />
                <View style={styles.roleInfo}>
                  <Text style={styles.roleLabel}>{label}</Text>
                  <Text style={styles.roleHint}>{hint}</Text>
                </View>
                {captured?.uploadResponse && (
                  <QualityBadge quality={captured.uploadResponse.quality} />
                )}
                {captured?.uploadStatus === 'failed' && (
                  <View style={styles.failedBadge}>
                    <Text style={styles.failedBadgeText}>⚠ Offline / Failed</Text>
                  </View>
                )}
              </View>

              {/* Thumbnail */}
              {captured && (
                <Image
                  source={{ uri: captured.localUri }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              )}

              {/* Error message if failed */}
              {captured?.uploadStatus === 'failed' && (
                <Text style={styles.errorText}>
                  ⚠ Sync failed: {captured.uploadError ?? 'Network error'}
                </Text>
              )}

              {/* Button group */}
              <View style={styles.btnRow}>
                {captured?.uploadStatus === 'failed' && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.retryBtn,
                      pressed && styles.captureBtnPressed,
                    ]}
                    onPress={() => handleRetryUpload(role)}
                    disabled={isUploading}
                    accessibilityRole="button"
                    accessibilityLabel={`Retry upload for ${label}`}
                  >
                    {isUploading ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload" size={16} color={Colors.white} />
                        <Text style={styles.retryBtnText}>Retry Upload</Text>
                      </>
                    )}
                  </Pressable>
                )}

                {/* Capture/Retake button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.captureBtn,
                    captured?.uploadStatus === 'failed' ? styles.captureBtnSecondary : captured ? styles.captureBtnRetake : styles.captureBtnPrimary,
                    pressed && styles.captureBtnPressed,
                  ]}
                  onPress={() => handleCapture(role)}
                  disabled={isUploading}
                  accessibilityRole="button"
                  accessibilityLabel={`Capture ${label} image`}
                >
                  {isUploading && captured?.uploadStatus !== 'failed' ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={captured ? 'refresh' : 'camera'}
                        size={16}
                        color={captured?.uploadStatus === 'failed' ? Colors.textPrimary : Colors.white}
                      />
                      <Text style={captured?.uploadStatus === 'failed' ? styles.captureBtnTextSecondary : styles.captureBtnText}>
                        {captured ? 'Retake Photo' : `Capture ${label}`}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* Next button */}
        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            !canProceed && styles.nextBtnDisabled,
            pressed && canProceed && styles.nextBtnPressed,
          ]}
          onPress={() => router.push('/category')}
          disabled={!canProceed}
          accessibilityRole="button"
          accessibilityLabel="Continue to category selection"
        >
          <Text style={styles.nextBtnText}>
            {canProceed ? 'Continue →' : 'Capture Front & Back to continue'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase' },
  hint: { fontSize: 12, color: Colors.textTertiary },
  roleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  roleHint: { fontSize: 12, color: Colors.textSecondary },
  failedBadge: { backgroundColor: Colors.fail + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  failedBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.fail },
  thumbnail: { width: '100%', height: 160, borderRadius: 10, backgroundColor: Colors.surfaceElevated },
  errorText: { fontSize: 12, color: Colors.fail, marginTop: -4 },
  btnRow: { flexDirection: 'row', gap: 8 },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.fail,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  captureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  captureBtnPrimary: { backgroundColor: Colors.primary },
  captureBtnRetake: { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  captureBtnSecondary: { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  captureBtnPressed: { opacity: 0.75 },
  captureBtnText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  captureBtnTextSecondary: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  nextBtn: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  nextBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  nextBtnPressed: { opacity: 0.8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
