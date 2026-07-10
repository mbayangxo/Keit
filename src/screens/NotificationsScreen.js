import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useEntrance, useScalePulse } from '../hooks/animations';
import { getNotifications, markNotificationRead } from '../lib/api-client';

const ACCENT_COLORS = { g: colors.green, o: colors.terracotta, r: colors.terracotta, y: colors.flagGold };

function inferKind(notification) {
  const t = `${notification.title} ${notification.body}`.toLowerCase();
  if (t.includes('demande')) return 'money';
  if (t.includes('mboolo') || t.includes('message')) return 'mboolo';
  if (t.includes('événement') || t.includes('event') || t.includes('concert')) return 'event';
  if (t.includes('tontine')) return 'tontine';
  if (t.includes('ngor') || t.includes('kersa') || t.includes('wakhna')) return 'ngor';
  return 'generic';
}

function mapNotification(n) {
  const kind = inferKind(n);
  const icons = { money: '💸', mboolo: '💬', event: '🎉', tontine: '🏦', ngor: '✦', generic: '🔔' };
  const accents = { money: 'g', mboolo: 'r', event: 'o', tontine: 'y', ngor: 'g', generic: 'g' };
  const time = new Date(n.createdAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return {
    id: n.id,
    key: n.id,
    kind,
    unread: !n.read,
    accent: accents[kind],
    icon: icons[kind],
    iconBg: colors.greenA10,
    text: n.body || n.title,
    time,
    action: kind === 'money' ? '✓' : kind === 'mboolo' ? 'Répondre' : kind === 'event' ? 'Voir' : null,
    actionStyle: kind === 'money' ? 'g' : 'o',
  };
}

function NotifItem({ item, delay, onAction }) {
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
        <PressScale
          scaleTo={0.9}
          onPress={() => onAction(item)}
          style={[styles.actionBtn, item.actionStyle === 'g' ? styles.actionBtnG : styles.actionBtnO]}
        >
          <Text style={[styles.actionText, item.actionStyle === 'g' && { color: colors.ink }]}>{item.action}</Text>
        </PressScale>
      )}
    </Animated.View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await getNotifications();
      setItems((Array.isArray(list) ? list : []).map(mapNotification));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (item) => {
    try {
      if (!item.read) await markNotificationRead(item.id);
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)));
    } catch {
      /* ignore mark read errors */
    }

    switch (item.kind) {
      case 'mboolo':
        navigation.navigate('Main', { screen: 'MbooloTab' });
        break;
      case 'event':
        navigation.navigate('Main', { screen: 'DiscoverTab', params: { initialTab: 'Events' } });
        break;
      case 'money':
        navigation.navigate('Receive');
        break;
      case 'tontine':
        navigation.navigate('Tontine');
        break;
      case 'ngor':
      case 'kersa':
      case 'wakhna':
        navigation.navigate('Main', { screen: 'MoiTab' });
        break;
      default:
        navigation.navigate('Main', { screen: 'HomeTab' });
        break;
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.ink }}>←</Text>
          </PressScale>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.filter((n) => n.unread).length || items.length}</Text>
          </View>
        </View>

        {loading && (
          <View style={{ padding: spacing.giant, alignItems: 'center' }}>
            <ActivityIndicator color={colors.green} />
          </View>
        )}

        {!loading && items.length === 0 && (
          <Text style={styles.empty}>Aucune notification pour l'instant.</Text>
        )}

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.map((n, i) => (
            <NotifItem key={n.key} item={n} delay={i * 40} onAction={handleAction} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.xl, backgroundColor: colors.greenA08, borderBottomWidth: 1, borderBottomColor: colors.greenA10 },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: colors.ink, flex: 1 },
  countBadge: { backgroundColor: colors.terracotta, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: 3 },
  countText: { fontSize: 10, fontWeight: '700', color: colors.ink },
  empty: { textAlign: 'center', color: 'rgba(5,8,5,0.5)', fontSize: 12, padding: spacing.giant },
  list: { padding: spacing.xxl, gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.xl, padding: spacing.xl, position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.6)' },
  itemCelebrate: { backgroundColor: 'rgba(250,216,54,0.08)', borderWidth: 1.5, borderColor: 'rgba(250,216,54,0.2)' },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  iconWrap: { width: 38, height: 38, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 11, lineHeight: 16.5, color: 'rgba(5,8,5,0.7)' },
  time: { fontSize: 10, color: 'rgba(5,8,5,0.5)', marginTop: 2 },
  actionBtn: { height: 26, paddingHorizontal: spacing.lg, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  actionBtnG: { backgroundColor: colors.green },
  actionBtnO: { backgroundColor: colors.terracottaA10, borderWidth: 1, borderColor: colors.terracottaA20 },
  actionText: { fontSize: 9, fontWeight: '700', color: colors.terracotta },
});
