import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import WaxPattern from '../components/WaxPattern';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useLocale } from '../context/LocaleContext';
import { t } from '../i18n/translations';

const LANGS = ['FR', 'WO', 'EN'];
const SPLASH_FROM_CODE = { fr: 'FR', wo: 'WO', en: 'EN' };

export default function SplashScreen({ onCreateAccount, onHaveAccount, onContinueApple, onContinueGoogle }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const { langCode, setLanguageFromSplash } = useLocale();
  const lang = SPLASH_FROM_CODE[langCode] ?? 'FR';

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
  }, [entrance]);

  const features = [t(langCode, 'splashFeature1'), t(langCode, 'splashFeature2'), t(langCode, 'splashFeature3')];

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#22ff74', colors.green, '#0a5c28']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <WaxPattern color="rgba(5,8,5,0.05)" size={20} durationMs={32000} />

      <SafeAreaView style={{ flex: 1, width: '100%' }}>
        <View style={styles.langRow}>
          {LANGS.map((l) => (
            <PressScale key={l} scaleTo={0.92} onPress={() => setLanguageFromSplash(l)} style={[styles.langBtn, l === lang && styles.langBtnOn]}>
              <Text style={[styles.langBtnText, l === lang && styles.langBtnTextOn]}>{l}</Text>
            </PressScale>
          ))}
        </View>

        <View style={styles.content}>
          <Animated.View
            style={{
              alignItems: 'center',
              opacity: entrance,
              transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }, { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }}
          >
            <Text style={styles.logo}>K21</Text>
            <View style={styles.flagStripe}>
              <View style={[styles.flagSeg, { backgroundColor: colors.ink }]} />
              <View style={[styles.flagSeg, { backgroundColor: colors.flagGold }]} />
              <View style={[styles.flagSeg, { backgroundColor: colors.flagRed }]} />
            </View>
            <Text style={styles.slogan}>{t(langCode, 'splashSlogan')}</Text>
            <Text style={styles.tagline}>{t(langCode, 'splashTagline')}</Text>

            <View style={styles.featureRow}>
              {features.map((f) => (
                <View key={f} style={styles.featurePill}>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={styles.cta}>
            <PressScale scaleTo={0.96} onPress={onContinueApple} style={styles.darkBtn}>
              <Text style={{ fontSize: 15 }}>🍎</Text>
              <Text style={styles.darkBtnText}>{t(langCode, 'splashApple')}</Text>
            </PressScale>

            <PressScale scaleTo={0.96} onPress={onContinueGoogle} style={styles.lightBtn}>
              <View style={styles.googleG}>
                <Text style={styles.googleGText}>G</Text>
              </View>
              <Text style={styles.lightBtnText}>{t(langCode, 'splashGoogle')}</Text>
            </PressScale>

            <PressScale scaleTo={0.96} onPress={onCreateAccount} style={styles.darkBtn}>
              <Text style={{ fontSize: 15 }}>✉️</Text>
              <Text style={styles.darkBtnText}>{t(langCode, 'splashEmail')}</Text>
            </PressScale>
          </View>

          <PressScale scaleTo={0.96} onPress={onHaveAccount} style={{ marginTop: spacing.xl }}>
            <Text style={styles.signInText}>
              {t(langCode, 'splashSignIn')}{' '}
              <Text style={styles.signInBold}>{t(langCode, 'splashSignInAction')}</Text>
            </Text>
          </PressScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },

  langRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.xl },
  langBtn: { borderRadius: radius.round, paddingVertical: 5, paddingHorizontal: spacing.lg, backgroundColor: 'rgba(5,8,5,0.1)' },
  langBtnOn: { backgroundColor: colors.ink },
  langBtnText: { fontSize: 11, fontWeight: '700', color: 'rgba(5,8,5,0.55)' },
  langBtnTextOn: { color: colors.green },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: spacing.giant },

  logo: { fontFamily: fontFamily.displayBlack, fontSize: 56, letterSpacing: -2, color: colors.ink },
  flagStripe: { flexDirection: 'row', height: 3, borderRadius: 2, overflow: 'hidden', width: 64, marginTop: spacing.md, marginBottom: spacing.lg },
  flagSeg: { flex: 1 },
  slogan: { fontFamily: fontFamily.displayBold, fontSize: 15, color: colors.ink, textAlign: 'center', marginBottom: spacing.sm },
  tagline: { fontFamily: fontFamily.bodyRegular, fontSize: 12, color: 'rgba(5,8,5,0.65)', textAlign: 'center', marginBottom: spacing.xl, lineHeight: 18, maxWidth: 280 },

  featureRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.giant },
  featurePill: { backgroundColor: 'rgba(5,8,5,0.12)', borderRadius: radius.round, paddingVertical: 4, paddingHorizontal: spacing.lg },
  featureText: { fontSize: 10, fontWeight: '700', color: colors.ink, letterSpacing: 0.3 },

  cta: { width: '100%', gap: spacing.md },
  darkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, height: 52, borderRadius: radius.xl, backgroundColor: colors.ink },
  darkBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  lightBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, height: 52, borderRadius: radius.xl, backgroundColor: colors.white },
  lightBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink },
  googleG: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  googleGText: { fontFamily: fontFamily.displayBlack, fontSize: 13, color: '#4285F4' },

  signInText: { fontSize: 12, color: colors.ink, opacity: 0.7 },
  signInBold: { fontFamily: fontFamily.bodyBold, opacity: 1, textDecorationLine: 'underline' },
});
