import { useEffect, useState } from 'react';
import { Animated, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import ConfettiBurst from './ConfettiBurst';
import GlowButton from './GlowButton';
import { giftCardThemeMeta } from '../lib/gift-cards';
import { usePopIn } from '../hooks/animations';
import { colors, fontFamily, radius, spacing, type } from '../theme';

export default function GiftCardReveal({ visible, theme, amountLabel, senderLabel, note, onClose }) {
  const meta = giftCardThemeMeta(theme);
  const [burst, setBurst] = useState(false);
  const pop = usePopIn(visible ? 120 : 0, 550, 0.4);

  useEffect(() => {
    if (visible && theme && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible, theme]);

  useEffect(() => {
    if (visible && theme) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 2800);
      return () => clearTimeout(t);
    }
    setBurst(false);
    return undefined;
  }, [visible, theme]);

  if (!visible || !meta) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ConfettiBurst active={burst} />
        <Animated.View style={[styles.card, pop, { borderColor: meta.color }]}>
          <Text style={styles.bigEmoji}>{meta.emoji}</Text>
          <Text style={[styles.title, { color: meta.color }]}>{meta.label}</Text>
          <Text style={styles.amount}>{amountLabel}</Text>
          <Text style={styles.from}>De {senderLabel ?? 'quelqu\'un'}</Text>
          {note ? <Text style={styles.note}>« {note} »</Text> : null}
          <GlowButton label="Merci ! ✦" onPress={onClose} tone="gold" style={{ marginTop: spacing.xl }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,8,5,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
    borderWidth: 3,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  bigEmoji: { fontSize: 56, marginBottom: spacing.sm },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 28, marginBottom: spacing.md },
  amount: { fontFamily: fontFamily.displayBlack, fontSize: 32, color: colors.ink, marginBottom: spacing.sm },
  from: { ...type.body, color: 'rgba(5,8,5,0.65)', marginBottom: spacing.sm },
  note: { ...type.caption, fontStyle: 'italic', textAlign: 'center', color: colors.ink },
});
