/**
 * CategoryScreen — inspector-confirmed product category.
 *
 * CONTRACTS.md #4 / AGENTS.md rule: category is NEVER auto-applied.
 * The inspector must explicitly select it from the dropdown.
 * This screen calls POST /inspections/{id}/category before proceeding.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { setCategory } from '../lib/api';
import { activeSession } from './index';

/** Legal Metrology (Packaged Commodities) Rules 2011 — key categories. */
const CATEGORIES: { value: string; label: string; description: string }[] = [
  {
    value: 'packaged_food',
    label: 'Packaged Food',
    description: 'Biscuits, chips, beverages, dairy, etc.',
  },
  {
    value: 'packaged_commodity',
    label: 'Packaged Commodity',
    description: 'Household goods, grains, pulses, edible oils, etc.',
  },
  {
    value: 'cosmetics',
    label: 'Cosmetics & Toiletries',
    description: 'Shampoo, soap, cream, toothpaste, etc.',
  },
  {
    value: 'drugs_pharma',
    label: 'Drugs & Pharmaceuticals',
    description: 'OTC medicines, supplements, etc.',
  },
  {
    value: 'textiles',
    label: 'Textiles & Garments',
    description: 'Fabric, clothing, footwear, etc.',
  },
];

export default function CategoryScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!selected || !activeSession) return;
    setLoading(true);
    try {
      await setCategory(activeSession.inspectionId, selected);
      activeSession.category = selected;
      router.push('/submit');
    } catch (err) {
      Alert.alert('Error', `Could not set category: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Product Category</Text>
          <Text style={styles.subtitle}>
            This must be confirmed by the inspector — it is never applied automatically.
          </Text>
        </View>

        <View style={styles.list}>
          {CATEGORIES.map((cat) => {
            const isSelected = selected === cat.value;
            return (
              <Pressable
                key={cat.value}
                style={({ pressed }) => [
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                  pressed && styles.categoryCardPressed,
                ]}
                onPress={() => setSelected(cat.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={cat.label}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.catLabel, isSelected && styles.catLabelSelected]}>
                    {cat.label}
                  </Text>
                  <Text style={styles.catDesc}>{cat.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            (!selected || loading) && styles.confirmBtnDisabled,
            pressed && selected && styles.confirmBtnPressed,
          ]}
          onPress={handleConfirm}
          disabled={!selected || loading}
          accessibilityRole="button"
          accessibilityLabel="Confirm category and review submission"
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.confirmBtnText}>
              {selected ? 'Confirm & Review →' : 'Select a category'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  header: { gap: 6 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  list: { gap: 10 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '11',
  },
  categoryCardPressed: { opacity: 0.8 },
  cardLeft: { justifyContent: 'center' },
  cardRight: { flex: 1, gap: 3 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  catLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  catLabelSelected: { color: Colors.primary },
  catDesc: { fontSize: 12, color: Colors.textSecondary },
  confirmBtn: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  confirmBtnPressed: { opacity: 0.8 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
