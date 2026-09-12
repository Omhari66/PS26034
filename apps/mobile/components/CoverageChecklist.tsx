/**
 * CoverageChecklist — shows which of the 3 required angles have been captured.
 * Mirrors the coverage check from CONTRACTS.md #1.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import type { CapturedImage, ImageRole } from '../lib/types';

interface Props {
  images: CapturedImage[];
}

const ROLES: { role: ImageRole; label: string }[] = [
  { role: 'front', label: 'Front' },
  { role: 'back', label: 'Back' },
  { role: 'close_up', label: 'Close-up' },
];

export function CoverageChecklist({ images }: Props) {
  const captured = new Set(images.map((i) => i.role));

  return (
    <View style={styles.row}>
      {ROLES.map(({ role, label }) => {
        const done = captured.has(role);
        return (
          <View
            key={role}
            style={[styles.chip, done ? styles.chipDone : styles.chipPending]}
          >
            <Text style={[styles.icon]}>{done ? '✓' : '○'}</Text>
            <Text style={[styles.label, done ? styles.labelDone : styles.labelPending]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipDone: {
    backgroundColor: Colors.pass + '22',
    borderColor: Colors.pass,
  },
  chipPending: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },
  icon: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  labelDone: {
    color: Colors.pass,
  },
  labelPending: {
    color: Colors.textSecondary,
  },
});
