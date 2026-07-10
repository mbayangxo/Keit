import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { colors, fontFamily, spacing } from '../theme';

const TAB_ICONS = {
  HomeTab: '🏠',
  MbooloTab: '💬',
  DiscoverTab: '🔍',
  MovementTab: '🛵',
  MoiTab: '😊',
};

const TAB_LABELS = {
  HomeTab: 'Accueil',
  MbooloTab: 'Mboolo',
  DiscoverTab: 'Discover',
  MovementTab: 'Mouvement',
  MoiTab: 'Moi',
};

export default function TabBar({ state, navigation }) {
  const focusedRoute = state.routes[state.index];
  if (getFocusedRouteNameFromRoute(focusedRoute) === 'MbooloChat') return null;

  return (
    <BlurView intensity={45} tint="light" style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            style={styles.navItem}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          >
            <Text style={styles.navIcon}>{TAB_ICONS[route.name]}</Text>
            {focused && <View style={styles.navDot} />}
            <Text style={[styles.navLabel, focused && { color: colors.orange }]}>{TAB_LABELS[route.name]}</Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingTop: spacing.lg, paddingBottom: spacing.xxxl, borderTopWidth: 1, borderTopColor: 'rgba(5,8,5,0.08)', overflow: 'hidden' },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navIcon: { fontSize: 20 },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.orange },
  navLabel: { fontFamily: fontFamily.bodyBold, fontSize: 7, color: colors.appCanvas.textFaint },
});
