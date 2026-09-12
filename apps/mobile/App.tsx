/**
 * PS 26034 Inspector App — placeholder screen (Phase 0)
 *
 * Imports EvidenceState and Decision from the shared TypeScript schema to
 * verify the import path is wired correctly. This screen will be replaced in
 * Phase 3 with the real capture + result flow.
 */

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Importing from the TS mirror keeps the schema exercised from day one.
// Path is relative; in later phases this becomes a workspace dep.
import { EvidenceState, Decision } from '../../packages/shared-schema/ts/schema';

// These assignments exist only to satisfy TypeScript and prove the import works.
const _states: string[] = Object.values(EvidenceState);
const _decisions: string[] = Object.values(Decision);

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PS 26034 Inspector App</Text>
      <Text style={styles.subtitle}>Phase 0 scaffold. Capture UI begins in Phase 3.</Text>
      <Text style={styles.debug}>
        {'EvidenceState: ' + _states.join(', ')}
      </Text>
      <Text style={styles.debug}>
        {'Decision:      ' + _decisions.join(', ')}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  debug: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
