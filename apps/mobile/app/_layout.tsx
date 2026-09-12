/**
 * Root layout for expo-router.
 * Sets up a dark-mode Stack navigator matching the iOS system feel.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'PS 26034' }} />
        <Stack.Screen name="capture" options={{ title: 'Capture Images' }} />
        <Stack.Screen name="category" options={{ title: 'Product Category' }} />
        <Stack.Screen name="submit" options={{ title: 'Review & Submit' }} />
        <Stack.Screen name="result" options={{ title: 'Inspection Result', headerBackVisible: false }} />
      </Stack>
    </>
  );
}
