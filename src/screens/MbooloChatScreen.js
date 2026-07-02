import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import WaxPattern from '../components/WaxPattern';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useFloatLoop, useGlowPulse, useColorPulse } from '../hooks/animations';

// design/k21-mboolo-bright.html, Screen 2 (Group Chat) — bright warm-white
// bubbles, never the dark ink chat shell used in the earlier redesign draft.

const STATUS_PILLS = [
  { avatar: '👩🏾', text: '🎵 Yëkël', music: true },
  { avatar: '👦🏿', text: '📍 Médina' },
  { avatar: '👩🏿', text: '☕ En ataya' },
];

function StatusPill({ item, delay }) {
  const float = useFloatLoop(delay, 3, 1500);
  return (
    <Animated.View style={[styles.sbPill, { transform: [{ translateY: float }] }]}>
      <View style={styles.sbpAva}>
        <Text style={{ fontSize: 10 }}>{item.avatar}</Text>
      </View>
      <Text style={[styles.sbpText, item.music && { color: colors.mboolo.greenDark }]}>{item.text}</Text>
    </Animated.View>
  );
}

// `music-glow`: shadow intensity pulses, 3s, infinite.
function MusicBubble() {
  const glow = useGlowPulse(3000, 0.3);
  return (
    <Animated.View
      style={[
        styles.musicBub,
        { shadowColor: colors.mboolo.green, shadowOffset: { width: 0, height: 3 }, shadowRadius: 12, shadowOpacity: glow, elevation: 3 },
      ]}
    >
      <View style={styles.mbCover}>
        <Text style={{ fontSize: 18 }}>🎵</Text>
      </View>
      <View>
        <Text style={styles.mbTrack}>"Yëkël"</Text>
        <Text style={styles.mbArtist}>Saliou K.</Text>
        <View style={styles.mbBadge}>
          <Text style={styles.mbBadgeText}>Chart 221 #1 🔥</Text>
        </View>
      </View>
      <FireIcon size={18} />
    </Animated.View>
  );
}

// `fire-bounce`: scale + rotate wiggle, .8s, infinite.
function FireIcon({ size = 18 }) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [val]);
  const rotate = val.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });
  const scale = val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  return (
    <Animated.Text style={{ fontSize: size, transform: [{ rotate }, { scale }] }}>🔥</Animated.Text>
  );
}

function PayBubble() {
  const borderColor = useColorPulse('rgba(232,146,10,0.25)', 'rgba(232,146,10,0.5)', 3000);
  return (
    <Animated.View style={[styles.payBub, { borderColor }]}>
      <View style={styles.pbRow}>
        <Text style={styles.pbTag}>💸 Envoyé</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={styles.pbAmount}>2 500</Text>
          <Text style={styles.nlCurr}>F</Text>
        </View>
      </View>
      <Text style={styles.pbReason}>Pour le taxi 🚕</Text>
    </Animated.View>
  );
}

function TypingIndicator() {
  const d1 = useDotBounce(0);
  const d2 = useDotBounce(120);
  const d3 = useDotBounce(240);
  return (
    <View style={styles.typing}>
      <View style={styles.msgAva}>
        <Text style={{ fontSize: 14 }}>👩🏾</Text>
      </View>
      <View style={styles.typingBub}>
        <Animated.View style={[styles.td, { transform: [{ translateY: d1 }] }]} />
        <Animated.View style={[styles.td, { transform: [{ translateY: d2 }] }]} />
        <Animated.View style={[styles.td, { transform: [{ translateY: d3 }] }]} />
      </View>
    </View>
  );
}

// `td-b`: translateY 0 -> -6 -> 0, .7s, infinite, staggered.
function useDotBounce(delay) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: -6, duration: 350, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [val, delay]);
  return val;
}

function ThemBubble({ avatar, name, children, time, delay, wide = true }) {
  const entrance = usePopMsg(delay);
  return (
    <Animated.View style={[styles.msg, styles.msgThem, entrance, !wide && { maxWidth: '72%' }]}>
      <View style={styles.msgAva}>
        <Text style={{ fontSize: 14 }}>{avatar}</Text>
      </View>
      <View style={styles.bubbleThem}>
        <Text style={styles.bName}>{name}</Text>
        {children}
        <Text style={styles.bTime}>{time}</Text>
      </View>
    </Animated.View>
  );
}

function MeBubble({ children, time, delay }) {
  const entrance = usePopMsg(delay);
  return (
    <Animated.View style={[styles.msg, styles.msgMe, entrance]}>
      <LinearGradient colors={[colors.mboolo.terra, colors.mboolo.terraLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubbleMe}>
        <Text style={styles.meText}>{children}</Text>
        <Text style={styles.bTimeMe}>{time}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// `msg-pop`: scale .8 -> 1 + translateY 10 -> 0, back-out ease, once.
function usePopMsg(delay = 0) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(val, {
      toValue: 1,
      duration: 300,
      delay,
      easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
      useNativeDriver: true,
    }).start();
  }, [val, delay]);
  return {
    opacity: val,
    transform: [
      { scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
      { translateY: val.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
    ],
  };
}

export default function MbooloChatScreen({ navigation }) {
  const sendPulse = useGlowShadow();

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(232,92,26,0.04)" size={14} durationMs={25000} animated={false} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.chatHead}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.chBack}>
            <Text style={{ fontSize: 15, color: '#fff' }}>←</Text>
          </PressScale>
          <View style={styles.chAvaStack}>
            <View style={[styles.chAva, { marginLeft: 0 }]}><Text style={{ fontSize: 15 }}>👩🏾</Text></View>
            <View style={styles.chAva}><Text style={{ fontSize: 15 }}>👦🏿</Text></View>
            <View style={styles.chAva}><Text style={{ fontSize: 15 }}>👩🏿</Text></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chName}>Médina Squad</Text>
            <Text style={styles.chSub}>8 membres · 3 en ligne</Text>
          </View>
          <View style={styles.chCall}>
            <Text style={{ fontSize: 15 }}>📞</Text>
          </View>
        </View>

        <View style={styles.statusBar}>
          {STATUS_PILLS.map((p, i) => (
            <StatusPill key={i} item={p} delay={i * 400} />
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.msgs} showsVerticalScrollIndicator={false}>
          <Text style={styles.dateChip}>Aujourd'hui</Text>

          <ThemBubble avatar="👩🏾" name="Fatou" time="14h18" delay={0}>
            <MusicBubble />
          </ThemBubble>

          <ThemBubble avatar="👦🏿" name="Ibou" time="14h19" delay={100}>
            <Text style={styles.themText}>Waw dafa baax lool 🔥🔥</Text>
          </ThemBubble>

          <MeBubble time="14h20 ✓✓" delay={200}>Merci dëkk bi sama yëkël la 🙏</MeBubble>

          <ThemBubble avatar="👩🏾" name="Fatou" time="14h21" delay={300} wide={false}>
            <PayBubble />
          </ThemBubble>

          <ThemBubble avatar="👩🏿" name="Aminata" time="14h22" delay={400}>
            <Text style={styles.themText}>Ñu lekk dibiterie 18h ? 🍖😋</Text>
          </ThemBubble>

          <TypingIndicator />
        </ScrollView>

        <View style={styles.inputRow}>
          <PressScale scaleTo={0.9} onPress={() => navigation.navigate('NuLekk')} style={styles.ciAttach}>
            <Text style={{ fontSize: 16 }}>📎</Text>
          </PressScale>
          <View style={styles.ciField}>
            <Text style={{ color: colors.mboolo.ink2, fontSize: 13 }}>Ok yes je viens</Text>
            <Cursor />
          </View>
          <Animated.View style={[styles.ciSend, { shadowOpacity: sendPulse.shadowOpacity, shadowRadius: sendPulse.shadowRadius }]}>
            <LinearGradient colors={[colors.mboolo.terra, colors.mboolo.terraDark]} style={StyleSheet.absoluteFill} borderRadius={19} />
            <Text style={{ fontSize: 17, color: '#fff' }}>➤</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// `cur-blink`: opacity 1 <-> 0, 1s, infinite.
function Cursor() {
  const val = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(val, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [val]);
  return <Animated.View style={{ width: 1.5, height: 14, backgroundColor: colors.mboolo.terra, marginLeft: 2, opacity: val }} />;
}

// `send-pulse`: box-shadow pulses in intensity, 2s, infinite.
function useGlowShadow() {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(val, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [val]);
  return {
    shadowOpacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.6] }),
    shadowRadius: val.interpolate({ inputRange: [0, 1], outputRange: [14, 20] }),
  };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mboolo.bg },

  chatHead: { backgroundColor: colors.mboolo.terra, paddingHorizontal: 14, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, shadowColor: '#b42800', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  chBack: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  chAvaStack: { flexDirection: 'row' },
  chAva: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.mboolo.terra, alignItems: 'center', justifyContent: 'center', marginLeft: -8, backgroundColor: '#fff' },
  chName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  chSub: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  chCall: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  statusBar: { backgroundColor: colors.mboolo.terraPale, borderBottomWidth: 2, borderBottomColor: colors.mboolo.border, paddingHorizontal: 14, paddingVertical: spacing.md, flexDirection: 'row', gap: spacing.md },
  sbPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.mboolo.border, borderRadius: radius.round, paddingVertical: 4, paddingRight: 10, paddingLeft: 5, shadowColor: '#b43c0a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  sbpAva: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.mboolo.terraPale, alignItems: 'center', justifyContent: 'center' },
  sbpText: { fontSize: 10, fontWeight: '600', color: colors.mboolo.ink2 },

  msgs: { padding: 14, gap: spacing.lg, flexGrow: 1 },
  dateChip: { alignSelf: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(232,92,26,0.12)', borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: 3, fontSize: 9, fontWeight: '700', color: colors.mboolo.ink3 },

  msg: { flexDirection: 'row', gap: 7, maxWidth: '82%', marginTop: spacing.lg },
  msgThem: { alignSelf: 'flex-start' },
  msgMe: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAva: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', flexShrink: 0, borderWidth: 1.5, borderColor: 'rgba(232,92,26,0.15)', backgroundColor: '#fff' },

  bubbleThem: { backgroundColor: '#fff', borderWidth: 2, borderColor: 'rgba(232,92,26,0.12)', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, shadowColor: '#b43c0a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  bName: { fontSize: 9, fontWeight: '700', color: colors.mboolo.terra, marginBottom: 3 },
  themText: { fontSize: 13, color: colors.mboolo.ink, lineHeight: 19.5 },
  bTime: { fontSize: 9, color: colors.mboolo.ink3, marginTop: 3, textAlign: 'right' },

  bubbleMe: { borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, shadowColor: 'rgba(232,92,26,0.35)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 14, elevation: 4 },
  meText: { fontSize: 13, color: '#fff', lineHeight: 19.5 },
  bTimeMe: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 3, textAlign: 'right' },

  musicBub: { backgroundColor: colors.mboolo.greenPale, borderWidth: 2, borderColor: 'rgba(26,240,96,0.3)', borderRadius: radius.xl, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  mbCover: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.mboolo.greenDark, alignItems: 'center', justifyContent: 'center' },
  mbTrack: { fontSize: 12, fontWeight: '700', color: colors.mboolo.greenDark },
  mbArtist: { fontSize: 10, color: colors.mboolo.ink3 },
  mbBadge: { backgroundColor: colors.mboolo.green, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2, alignSelf: 'flex-start' },
  mbBadgeText: { fontSize: 9, fontWeight: '700', color: colors.mboolo.ink },

  payBub: { backgroundColor: colors.mboolo.mangoPale, borderWidth: 2, borderRadius: radius.xl, padding: spacing.lg },
  pbRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  pbTag: { fontSize: 10, fontWeight: '700', color: colors.mboolo.mangoDark },
  pbAmount: { fontFamily: fontFamily.displayBlack, fontSize: 22, letterSpacing: -1, color: colors.mboolo.mangoDark },
  nlCurr: { fontSize: 13, color: colors.mboolo.ink3 },
  pbReason: { fontSize: 10, color: colors.mboolo.ink3 },

  typing: { flexDirection: 'row', gap: 7, alignItems: 'flex-end', alignSelf: 'flex-start', marginTop: spacing.lg },
  typingBub: { backgroundColor: '#fff', borderWidth: 2, borderColor: 'rgba(232,92,26,0.12)', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: spacing.xl, flexDirection: 'row', gap: 5, alignItems: 'center', shadowColor: '#b43c0a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  td: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.mboolo.terraLight },

  inputRow: { backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: 'rgba(232,92,26,0.1)', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  ciAttach: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.mboolo.terraPale, borderWidth: 1.5, borderColor: colors.mboolo.border, alignItems: 'center', justifyContent: 'center' },
  ciField: { flex: 1, height: 38, borderRadius: 19, backgroundColor: colors.mboolo.bg2, borderWidth: 2, borderColor: colors.mboolo.border, paddingHorizontal: spacing.xxxl, flexDirection: 'row', alignItems: 'center' },
  ciSend: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(232,92,26,0.45)', shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 4, overflow: 'hidden' },
});
