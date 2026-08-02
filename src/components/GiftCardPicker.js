import { ScrollView, StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { GIFT_CARD_THEMES } from '../lib/gift-cards';
import { colors, fontFamily, radius, spacing } from '../theme';

export default function GiftCardPicker({ value, onChange }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.lbl}>Carte cadeau (optionnel)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <PressScale
          scaleTo={0.95}
          onPress={() => onChange(null)}
          style={[styles.chip, !value && styles.chipOn]}
        >
          <Text style={styles.chipText}>Aucune</Text>
        </PressScale>
        {GIFT_CARD_THEMES.map((t) => (
          <PressScale
            key={t.key}
            scaleTo={0.92}
            onPress={() => onChange(t.key)}
            style={[styles.chip, value === t.key && styles.chipOn, value === t.key && { borderColor: t.color }]}
          >
            <Text style={styles.emoji}>{t.emoji}</Text>
            <Text style={styles.chipText}>{t.label}</Text>
          </PressScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  lbl: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, color: 'rgba(5,8,5,0.55)', marginBottom: spacing.xs },
  row: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(5,8,5,0.1)',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  chipOn: { borderColor: colors.green, backgroundColor: 'rgba(26,240,96,0.12)' },
  emoji: { fontSize: 16 },
  chipText: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, color: colors.ink },
});
