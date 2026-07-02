import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useEntrance, useScalePulse } from '../hooks/animations';

// design/k21-complete-redesign.html, Notifications section — reproduced
// closely. The "Défi Freestyle" notification is swapped for an Events one
// (Défis is excluded from Phase 1).

const NOTIFS = [
  {
    key: 'cauris',
    celebrate: true,
    icon: '🪸',
    iconBg: 'rgba(250,216,54,0.1)',
    text: '"Yëkël" vient d’obtenir la certification Cauris — tu y as contribué !',
    time: 'Il y a 5 min 🎉',
    action: 'Voir',
    actionStyle: 'g',
  },
  {
    key: 'money',
    unread: true,
    accent: 'g',
    icon: '💸',
    iconBg: colors.greenA10,
    text: '+5 000 F reçu de Papa Diallo',
    time: 'Il y a 12 min',
    action: '✓',
    actionStyle: 'g',
  },
  {
    key: 'event',
    unread: true,
    accent: 'o',
    icon: '🎉',
    iconBg: colors.orangeA10,
    text: 'Nouvel événement près de toi — Soirée Mbalax ce soir, Place de l’Obélisque',
    time: 'Il y a 28 min',
    action: 'Voir',
    actionStyle: 'o',
  },
  {
    key: 'mboolo',
    unread: true,
    accent: 'r',
    icon: '💬',
    iconBg: 'rgba(232,92,26,0.1)',
    text: '4 messages dans Médina Squad — Ibou : Ñu lekk 18h bi 🍖',
    time: 'Il y a 35 min',
    action: 'Répondre',
    actionStyle: 'o',
  },
  {
    key: 'wakhna',
    unread: true,
    accent: 'g',
    icon: '✦',
    iconBg: colors.greenA08,
    text: 'Ton Wakhna passe à 840 — tu es dans le top 12% de Médina 🏅',
    time: 'Il y a 1h',
  },
  {
    key: 'tontine',
    accent: 'y',
    icon: '🏦',
    iconBg: colors.goldA08,
    text: 'Tontine Médina Squad — collecte de mars confirmée. Ton tour en Avril !',
    time: 'Hier',
  },
];

const ACCENT_COLORS = { g: colors.green, o: colors.orange, r: colors.flagRed, y: colors.flagGold };

function NotifItem({ item, delay }) {
  const entrance = useEntrance(delay, 300, 8);
  const glow = useScalePulse(item.celebrate ? 2000 : 100000, item.celebrate ? 1.01 : 1);

  return (
    <Animated.View style={[styles.item, entrance, item.celebrate && styles.itemCelebrate]}>
      {item.unread && item.accent && <View style={[styles.accentBar, { backgroundColor: ACCENT_COLORS[item.accent] }]} />}
      <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
        <Text style={{ fontSize: 17 }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>{item.text}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      {item.action && (
        <PressScale scaleTo={0.9} style={[styles.actionBtn, item.actionStyle === 'g' ? styles.actionBtnG : styles.actionBtnO]}>
          <Text style={[styles.actionText, item.actionStyle === 'g' && { color: colors.ink }]}>{item.action}</Text>
        </PressScale>
      )}
    </Animated.View>
  );
}

export default function NotificationsScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
          </PressScale>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{NOTIFS.length}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {NOTIFS.map((n, i) => (
            <NotifItem key={n.key} item={n} delay={i * 40} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.xl, backgroundColor: colors.greenA08, borderBottomWidth: 1, borderBottomColor: colors.greenA10 },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: colors.white, flex: 1 },
  countBadge: { backgroundColor: colors.flagRed, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: 3 },
  countText: { fontSize: 10, fontWeight: '700', color: colors.white },

  list: { padding: spacing.xxl, gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.xl, padding: spacing.xl, position: 'relative', overflow: 'hidden' },
  itemCelebrate: { backgroundColor: 'rgba(250,216,54,0.08)', borderWidth: 1.5, borderColor: 'rgba(250,216,54,0.2)' },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  iconWrap: { width: 38, height: 38, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 11, lineHeight: 16.5, color: colors.whiteA70 },
  time: { fontSize: 9, color: colors.whiteA30, marginTop: 2 },
  actionBtn: { height: 26, paddingHorizontal: spacing.lg, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  actionBtnG: { backgroundColor: colors.green },
  actionBtnO: { backgroundColor: colors.orangeA10, borderWidth: 1, borderColor: colors.orangeA20 },
  actionText: { fontSize: 9, fontWeight: '700', color: colors.orange },
});
