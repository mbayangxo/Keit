import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { usePreferences } from '../context/PreferencesContext';
import { scaleFont } from '../lib/type-scale';
import { transferUndo } from '../lib/api-client';

const UNDO_SECONDS = 60;

export default function UndoTransferBar({ reference, amount, onUndo, onUndone, onExpired }) {
  const { largeText } = usePreferences();
  const [secondsLeft, setSecondsLeft] = useState(UNDO_SECONDS);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (done || secondsLeft <= 0) {
      onExpired?.();
      return undefined;
    }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft, done, onExpired]);

  const undo = async () => {
    setLoading(true);
    setError(null);
    try {
      if (onUndo) {
        await onUndo();
      } else {
        await transferUndo(reference);
      }
      setDone(true);
      onUndone?.();
    } catch (e) {
      setError(e.message ?? 'Annulation impossible');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.bar, styles.barDone]}>
        <Text style={[styles.doneText, { fontSize: scaleFont(12, largeText) }]}>✓ Paiement annulé — argent récupéré</Text>
      </View>
    );
  }

  if (secondsLeft <= 0) return null;

  const fs = scaleFont(12, largeText);
  const fsSm = scaleFont(10, largeText);

  return (
    <View style={styles.bar}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { fontSize: fs }]}>Tu t'es trompé ?</Text>
        <Text style={[styles.sub, { fontSize: fsSm }]}>
          Annule dans {secondsLeft}s — {Number(amount).toLocaleString('fr-FR')} F reviennent sur ton compte
        </Text>
        {error ? <Text style={styles.err}>{error}</Text> : null}
      </View>
      <PressScale scaleTo={0.95} onPress={undo} disabled={loading} style={styles.undoBtn}>
        {loading ? (
          <ActivityIndicator color={colors.ink} size="small" />
        ) : (
          <Text style={[styles.undoText, { fontSize: scaleFont(11, largeText) }]}>Annuler</Text>
        )}
      </PressScale>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: 'rgba(250,216,54,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(250,216,54,0.35)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignSelf: 'stretch',
  },
  barDone: { backgroundColor: colors.greenA08, borderColor: colors.greenA25 },
  title: { fontFamily: fontFamily.bodyBold, color: colors.goldDark },
  sub: { color: 'rgba(5,8,5,0.6)', marginTop: 2 },
  err: { fontSize: 10, color: colors.terracotta, marginTop: 4 },
  undoBtn: {
    backgroundColor: colors.flagGold,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minWidth: 72,
    alignItems: 'center',
  },
  undoText: { fontFamily: fontFamily.bodyBold, color: colors.ink },
  doneText: { fontFamily: fontFamily.bodyBold, color: colors.greenDark, textAlign: 'center', flex: 1 },
});
