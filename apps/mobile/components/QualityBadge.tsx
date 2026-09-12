/**
 * QualityBadge — chip showing image quality level (high / medium / low).
 * Used in the CaptureScreen thumbnail strip.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import type { ImageQuality } from '../lib/types';

interface Props {
  quality: ImageQuality;
}

const LABEL: Record<ImageQuality, string> = {
  high: '✓ High',
  medium: '~ Medium',
  low: '✗ Low',
};

const COLOR: Record<ImageQuality, string> = {
  high: Colors.qualityHigh,
  medium: Colors.qualityMedium,
  low: Colors.qualityLow,
};

export function QualityBadge({ quality }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: COLOR[quality] + '33' }]}>
      <Text style={[styles.label, { color: COLOR[quality] }]}>
        {LABEL[quality]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
