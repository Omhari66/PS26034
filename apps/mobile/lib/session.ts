/**
 * Session persistence helper using expo-file-system.
 *
 * Saves active inspection session state locally to prevent silent data loss
 * if the app is closed or killed mid-inspection/sync.
 */

import * as FileSystem from 'expo-file-system/legacy';
import type { InspectionSession } from './types';

const SESSION_FILE = `${FileSystem.documentDirectory}active_session.json`;

/** Save current active session to local storage. */
export async function saveSession(session: InspectionSession): Promise<void> {
  try {
    const json = JSON.stringify(session);
    await FileSystem.writeAsStringAsync(SESSION_FILE, json);
  } catch (err) {
    console.warn('Failed to persist session locally:', err);
  }
}

/** Load persisted active session from local storage, if present. */
export async function loadSession(): Promise<InspectionSession | null> {
  try {
    const info = await FileSystem.getInfoAsync(SESSION_FILE);
    if (!info.exists) return null;
    const json = await FileSystem.readAsStringAsync(SESSION_FILE);
    return JSON.parse(json) as InspectionSession;
  } catch (err) {
    console.warn('Failed to load local session:', err);
    return null;
  }
}

/** Clear persisted active session file (e.g. after successful submission). */
export async function clearSession(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(SESSION_FILE);
    if (info.exists) {
      await FileSystem.deleteAsync(SESSION_FILE, { idempotent: true });
    }
  } catch (err) {
    console.warn('Failed to clear local session:', err);
  }
}
