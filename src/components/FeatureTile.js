import { StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';

/**
 * Marketplace / wallet tile — greys out and labels “Bientôt” when disabled.
 */
export default function FeatureTile({ icon, title, subtitle, disabled, soon, onPress, tint = 'rgba(26,240,96,0.14)' }) {
  const locked = disabled || soon;
  return (
    <PressScale
      scaleTo={locked ? 1 : 0.96}
      onPress={locked ? undefined : onPress}
      style={[styles.tile, locked && styles.tileLocked]}
    >
      <View style={[styles.iconWrap, { backgroundColor: locked ? 'rgba(5,8,5,0.06)' : tint }]}>
        <Text style={{ fontSize: 26, opacity: locked ? 0.45 : 1 }}>{icon}</Text>
      </View>
      <Text style={[styles.title, locked && styles.titleLocked]} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
      {soon ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Bientôt</Text>
        </View>
      ) : null}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '47%',
    minHeight: 132,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.xl,
    borderBottomRightRadius: 10,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tileLocked: { opacity: 0.72 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fontFamily.displayBold, fontSize: 13, color: colors.ink, lineHeight: 17 },
  titleLocked: { color: 'rgba(5,8,5,0.55)' },
  subtitle: { fontSize: 10, color: 'rgba(5,8,5,0.5)', lineHeight: 14 },
  soonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(250,216,54,0.2)',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    marginTop: 2,
  },
  soonText: { fontSize: 8, fontFamily: fontFamily.bodyBold, color: colors.goldDark, letterSpacing: 0.5 },
});
