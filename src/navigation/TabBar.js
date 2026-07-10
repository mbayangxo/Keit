import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { colors, fontFamily, spacing } from '../theme';

// Matches `.bnav` from the Home Dashboard prototype exactly — extracted so
// every tab (not just Home) shares the identical blurred bottom nav.
const TAB_ICONS = {
  HomeTab: '🏠',
  MbooloTab: '💬',
  ExplorerTab: '🔍',
  MoiTab: '😊',
};

const TAB_LABELS = {
  HomeTab: 'Accueil',
  MbooloTab: 'Mboolo',
  ExplorerTab: 'Discover',
  MoiTab: 'Moi',
};

export default function TabBar({ state, navigation }) {
  // Hide the tab bar once the Mboolo tab has pushed into the chat screen —
  // it has its own full-height input row that shouldn't fight the nav bar.
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
            <Text style={[styles.navLabel, focused && { color: colors.greenDark }]}>{TAB_LABELS[route.name]}</Text>
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
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.greenDark },
  navLabel: { fontFamily: fontFamily.bodyBold, fontSize: 8, color: 'rgba(5,8,5,0.45)' },
});
