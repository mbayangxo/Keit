import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import WaxPattern from '../components/WaxPattern';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useFloatLoop, useBlink, useScalePulse, useColorPulse, useEntrance, useBarLoop, useRipple } from '../hooks/animations';

// Mboolo screens use the BRIGHT warm-white palette (#fff9f4) — never the
// dark #050805 ink shell used everywhere else in the app. See
// design/k21-mboolo-bright.html, Screen 1 (Home).

const STORIES = [
  { name: 'Mon statut', add: true },
  { name: 'Fatou 🎵', emoji: '👩🏾', ring: ['#1af060', '#0fbc48'], nameColor: colors.mboolo.greenDark },
  { name: 'Ibou', emoji: '👦🏿', ring: ['#e85c1a', '#ffb347'] },
  { name: 'Aminata 📍', emoji: '👩🏿', ring: ['#e8192c', '#e85c1a'] },
  { name: 'Cheikh', emoji: '👨🏾', ring: ['#fad836', '#ffb347'] },
];

const CONVERSATIONS = [
  {
    key: 'medina-squad',
    avaBg: '#fff5ee',
    emoji: '👥',
    presence: 'online',
    unread: true,
    name: 'Médina Squad',
    time: 'maintenant',
    preview: 'Ibou: Ñu lekk dibiterie 18h bi 🍖',
    badge: 4,
  },
  {
    key: 'fatou',
    avaBg: '#f0fff5',
    emoji: '👩🏾',
    presence: 'music',
    unread: true,
    name: 'Fatou',
    time: '2 min',
    preview: '🎵 partage "Yëkël" avec toi',
    previewType: 'music',
    badge: 1,
  },
  {
    key: 'ibou',
    avaBg: '#fffbee',
    emoji: '👦🏿',
    name: 'Ibou',
    time: '14h22',
    preview: 'Ok wallah on se voit à 18h inshallah',
  },
  {
    key: 'famille-diallo',
    avaBg: '#fff0f0',
    emoji: '👥',
    name: 'Famille Diallo',
    time: 'Hier',
    preview: '💸 Papa t’a envoyé 5 000 F',
    previewType: 'pay',
  },
  {
    key: 'aminata',
    avaBg: '#fff5ee',
    emoji: '👩🏿',
    presence: 'online',
    name: 'Aminata',
    time: 'Hier',
    preview: '📍 Sandaga · on mange ici ?',
  },
];

const DOTS = [
  { size: 5, left: '12%', color: 'rgba(232,92,26,0.25)', duration: 9000, delay: 0 },
  { size: 4, left: '45%', color: 'rgba(255,179,71,0.3)', duration: 13000, delay: 3000 },
  { size: 6, left: '75%', color: 'rgba(26,240,96,0.2)', duration: 10000, delay: 5000 },
  { size: 3, left: '88%', color: 'rgba(232,25,44,0.2)', duration: 11000, delay: 1500 },
];

// `fdot-float`: rises from bottom to top, fading in/out, rotating once, infinite.
function FloatingDot({ size, left, color, duration, delay }) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([Animated.delay(delay), Animated.timing(val, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })])
    );
    anim.start();
    return () => anim.stop();
  }, [val, duration, delay]);

  const translateY = val.interpolate({ inputRange: [0, 1], outputRange: [260, -60] });
  const rotate = val.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const opacity = val.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 0.6, 0] });
  const scale = val.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 1] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        bottom: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { rotate }, { scale }],
      }}
    />
  );
}

function StoryRing({ item, delay }) {
  const wobble = useScalePulse(4000, 1.05);
  const inner = item.add ? (
    <View style={[styles.storyInner, { backgroundColor: colors.mboolo.terraPale }]}>
      <Text style={{ fontSize: 20, color: colors.mboolo.terra, fontWeight: '700' }}>+</Text>
    </View>
  ) : (
    <View style={styles.storyInner}>
      <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
    </View>
  );

  return (
    <View style={styles.storyItem}>
      <Animated.View style={{ transform: [{ scale: wobble }] }}>
        {item.add ? (
          <View style={[styles.storyRing, styles.ringAdd]}>{inner}</View>
        ) : (
          <LinearGradient colors={item.ring} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.storyRing}>
            {inner}
          </LinearGradient>
        )}
      </Animated.View>
      <Text style={[styles.storyName, item.nameColor && { color: item.nameColor }]} numberOfLines={1}>
        {item.name}
      </Text>
    </View>
  );
}

function NowPlayingBar() {
  const fire = useScalePulse(800, 1.2);
  const b1 = useBarLoop(0);
  const b2 = useBarLoop(80);
  const b3 = useBarLoop(160);
  const b4 = useBarLoop(240);
  const b5 = useBarLoop(120);
  const bounce = useFloatLoop(0, 2, 1500);

  return (
    <Animated.View style={[styles.nowPlaying, { transform: [{ translateY: bounce }] }]}>
      <View style={styles.npBars}>
        <Animated.View style={[styles.npBar, { height: 8, transform: [{ scaleY: b1 }] }]} />
        <Animated.View style={[styles.npBar, { height: 16, transform: [{ scaleY: b2 }] }]} />
        <Animated.View style={[styles.npBar, { height: 10, transform: [{ scaleY: b3 }] }]} />
        <Animated.View style={[styles.npBar, { height: 18, transform: [{ scaleY: b4 }] }]} />
        <Animated.View style={[styles.npBar, { height: 6, transform: [{ scaleY: b5 }] }]} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.npTitle} numberOfLines={1}>Yëkël — Saliou K.</Text>
        <Text style={styles.npSub}>Chart 221 #1 · Médina écoute ✦</Text>
      </View>
      <Animated.Text style={[styles.npFire, { transform: [{ scale: fire }] }]}>🔥</Animated.Text>
    </Animated.View>
  );
}

function ConversationRow({ item, delay, onPress }) {
  const entrance = useEntrance(delay, 350, 10);
  const ripple = useRipple(2000, 1.18);
  const badgePulse = useScalePulse(1500, 1.1);
  const presencePulse = useBlink(2500, 0.5);
  const musicBadgePulse = useScalePulse(700, 1.25);

  const previewColor =
    item.previewType === 'music' ? colors.mboolo.greenDark : item.previewType === 'pay' ? colors.mboolo.mangoDark : colors.mboolo.ink3;

  return (
    <Animated.View style={entrance}>
      <PressScale scaleTo={0.98} onPress={onPress} style={[styles.convItem, item.unread && styles.convItemUnread]}>
        <View style={styles.ciAvaWrap}>
          {item.unread && (
            <Animated.View
              pointerEvents="none"
              style={[styles.ciAvaRing, { opacity: ripple.opacity, transform: [{ scale: ripple.scale }] }]}
            />
          )}
          <View
            style={[
              styles.ciAva,
              { backgroundColor: item.avaBg },
              item.unread && { borderColor: colors.mboolo.terraLight },
            ]}
          >
            <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
          </View>
          {item.presence === 'online' && (
            <Animated.View style={[styles.ciOnline, { opacity: presencePulse }]} />
          )}
          {item.presence === 'music' && (
            <Animated.View style={[styles.ciMusic, { transform: [{ scale: musicBadgePulse }] }]}>
              <Text style={{ fontSize: 9 }}>🎵</Text>
            </Animated.View>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.ciTop}>
            <Text style={[styles.ciName, item.unread && { color: colors.mboolo.terraDark }]}>{item.name}</Text>
            <Text style={styles.ciTime}>{item.time}</Text>
          </View>
          <Text
            style={[styles.ciPreview, item.unread && styles.ciPreviewUnread, item.previewType && { color: previewColor, fontWeight: '600' }]}
            numberOfLines={1}
          >
            {item.preview}
          </Text>
        </View>
        {item.badge != null && (
          <Animated.View style={[styles.ciBadge, { transform: [{ scale: badgePulse }] }]}>
            <Text style={styles.ciBadgeText}>{item.badge}</Text>
          </Animated.View>
        )}
      </PressScale>
    </Animated.View>
  );
}

export default function MbooloHomeScreen({ navigation }) {
  const logoBounce = useScalePulse(3000, 1.03);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const filteredConversations = CONVERSATIONS.filter(
    (c) => c.name.toLowerCase().includes(query.trim().toLowerCase()) || c.preview.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(232,92,26,0.04)" size={14} durationMs={25000} />
      {DOTS.map((d, i) => (
        <FloatingDot key={i} {...d} />
      ))}
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <Animated.Text style={[styles.logo, { transform: [{ scale: logoBounce }] }]}>Mboolo</Animated.Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <PressScale
              scaleTo={0.9}
              onPress={() => navigation.navigate('Info', { title: 'Nouvelle conversation', subtitle: 'Bientôt disponible.', icon: '✏️' })}
              style={styles.mbIcon}
            >
              <Text style={{ fontSize: 17 }}>✏️</Text>
            </PressScale>
            <PressScale scaleTo={0.9} onPress={() => searchRef.current?.focus()} style={styles.mbIcon}>
              <Text style={{ fontSize: 17 }}>🔍</Text>
            </PressScale>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: spacing.huge, paddingTop: spacing.lg }}>
            <SearchBar query={query} setQuery={setQuery} inputRef={searchRef} />
          </View>

          <View style={styles.storyRow}>
            {STORIES.map((s, i) => (
              <StoryRing key={s.name} item={s} delay={i * 300} />
            ))}
          </View>

          <View style={{ paddingHorizontal: spacing.huge }}>
            <NowPlayingBar />
          </View>

          <Text style={styles.convDivider}>Messages</Text>

          {filteredConversations.length === 0 && (
            <Text style={styles.noResults}>Aucune conversation pour "{query}"</Text>
          )}
          {filteredConversations.map((c, i) => (
            <View key={c.key}>
              <ConversationRow item={c} delay={i * 60} onPress={() => navigation.navigate('MbooloChat', { conversation: c })} />
              {i < filteredConversations.length - 1 && <View style={styles.convSep} />}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// `search-glow`: border-color oscillates rgba(232,92,26,.15) <-> .35, 4s, infinite.
const SearchBar = ({ query, setQuery, inputRef }) => {
  const borderColor = useColorPulse('rgba(232,92,26,0.15)', 'rgba(232,92,26,0.35)', 4000);
  return (
    <Animated.View style={[styles.searchBar, { borderColor }]}>
      <Text style={{ fontSize: 14, color: colors.mboolo.ink3 }}>🔍</Text>
      <TextInput
        ref={inputRef}
        style={styles.searchInput}
        placeholder="Rechercher..."
        placeholderTextColor={colors.mboolo.ink3}
        value={query}
        onChangeText={setQuery}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mboolo.bg },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.huge, paddingTop: spacing.lg, paddingBottom: spacing.md },
  logo: { fontFamily: fontFamily.displayBlack, fontSize: 20, letterSpacing: -0.5, color: colors.mboolo.terra },
  mbIcon: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.mboolo.terraPale, borderWidth: 1.5, borderColor: colors.mboolo.border, alignItems: 'center', justifyContent: 'center' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.mboolo.border, borderRadius: radius.xxl, paddingHorizontal: spacing.xxxl, height: 42, marginBottom: spacing.xxxl, shadowColor: '#b43c0a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 13, color: colors.mboolo.ink },
  noResults: { textAlign: 'center', fontSize: 12, color: colors.mboolo.ink3, paddingVertical: spacing.giant },

  storyRow: { flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.huge, paddingBottom: spacing.xxxl },
  storyItem: { alignItems: 'center', gap: spacing.xs },
  storyRing: { width: 56, height: 56, borderRadius: 28, padding: 3, alignItems: 'center', justifyContent: 'center' },
  ringAdd: { backgroundColor: 'rgba(232,92,26,0.15)', borderWidth: 2, borderColor: colors.mboolo.terraLight, borderStyle: 'dashed' },
  storyInner: { width: '100%', height: '100%', borderRadius: 26, backgroundColor: '#fff', borderWidth: 2.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  storyName: { fontSize: 9, fontWeight: '700', color: colors.mboolo.ink2, maxWidth: 56, textAlign: 'center' },

  nowPlaying: { backgroundColor: colors.mboolo.greenPale, borderWidth: 2, borderColor: 'rgba(26,240,96,0.3)', borderRadius: radius.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl, shadowColor: '#1af060', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 3 },
  npBars: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: 18, flexShrink: 0 },
  npBar: { width: 3, borderRadius: 2, backgroundColor: colors.mboolo.greenDark },
  npTitle: { fontSize: 12, fontWeight: '700', color: colors.mboolo.greenDark },
  npSub: { fontSize: 10, color: colors.mboolo.ink3 },
  npFire: { fontSize: 20 },

  convDivider: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.mboolo.ink3, textTransform: 'uppercase', paddingHorizontal: spacing.huge, paddingBottom: spacing.md },
  convItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingHorizontal: spacing.huge, paddingVertical: 11 },
  convItemUnread: { backgroundColor: 'rgba(255,240,230,0.6)' },
  ciAvaWrap: { position: 'relative', flexShrink: 0 },
  ciAvaRing: { position: 'absolute', top: 0, left: 0, width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: 'rgba(232,92,26,0.3)' },
  ciAva: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: 'transparent' },
  ciOnline: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.mboolo.green, borderWidth: 2.5, borderColor: colors.mboolo.bg },
  ciMusic: { position: 'absolute', bottom: -3, right: -3, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.mboolo.greenPale, borderWidth: 2, borderColor: colors.mboolo.green, alignItems: 'center', justifyContent: 'center' },
  ciTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  ciName: { fontSize: 14, fontWeight: '700', color: colors.mboolo.ink },
  ciTime: { fontSize: 10, color: colors.mboolo.ink3 },
  ciPreview: { fontSize: 12, color: colors.mboolo.ink3 },
  ciPreviewUnread: { color: colors.mboolo.ink2, fontWeight: '600' },
  ciBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.mboolo.terra, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, shadowColor: 'rgba(232,92,26,0.4)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3 },
  ciBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  convSep: { height: 1, backgroundColor: 'rgba(232,92,26,0.08)', marginHorizontal: spacing.huge, marginVertical: 2 },
});
