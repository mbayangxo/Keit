import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { getNotifications } from '../lib/api-client';
import { colors, fontFamily, spacing } from '../theme';

const TAB_ICONS = {
  MbooloTab: '💬',
  HomeTab: '💰',
  MarketplaceTab: '🛒',
  NotificationsTab: '🔔',
  MoiTab: '😊',
};

const TAB_LABELS = {
  MbooloTab: 'Mboolo',
  HomeTab: 'Argent',
  MarketplaceTab: 'Marché',
  NotificationsTab: 'Alertes',
  MoiTab: 'Moi',
};

function isMbooloChatFocused(route) {
  if (route?.name !== 'MbooloTab') return false;
  const focused = getFocusedRouteNameFromRoute(route);
  if (focused === 'MbooloChat') return true;
  const nested = route.state?.routes?.[route.state.index ?? 0];
  return nested?.name === 'MbooloChat';
}

export default function TabBar({ state, navigation }) {
  const focusedRoute = state.routes[state.index];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((list) => {
        if (cancelled) return;
        const items = Array.isArray(list) ? list : [];
        setUnreadCount(items.filter((n) => !n.read).length);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [state.index]);

  if (isMbooloChatFocused(focusedRoute)) return null;

  return (
    <BlurView intensity={45} tint="light" style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const showBadge = route.name === 'NotificationsTab' && unreadCount > 0;
        return (
          <Pressable
            key={route.key}
            style={styles.navItem}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          >
            <View style={styles.iconWrap}>
              <Text style={styles.navIcon}>{TAB_ICONS[route.name]}</Text>
              {showBadge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </View>
            {focused && <View style={styles.navDot} />}
            <Text style={[styles.navLabel, focused && { color: colors.greenDark }]} numberOfLines={1}>
              {TAB_LABELS[route.name]}
            </Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(5,8,5,0.08)',
    overflow: 'hidden',
  },
  navItem: { flex: 1, alignItems: 'center', gap: 2, minWidth: 0, paddingHorizontal: 1 },
  iconWrap: { position: 'relative' },
  navIcon: { fontSize: 19 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.orange,
    borderWidth: 1.5,
    borderColor: colors.appCanvas.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 8, fontFamily: fontFamily.bodyBold, color: '#fff' },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.greenDark },
  navLabel: { fontFamily: fontFamily.bodyBold, fontSize: 6.5, color: colors.appCanvas.textFaint, textAlign: 'center' },
});
