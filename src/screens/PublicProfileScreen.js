import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScreenBackground from '../components/ScreenBackground';
import ScreenHeader from '../components/ScreenHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import PressScale from '../components/PressScale';
import { getPublicProfile } from '../lib/api-client';
import { colors, fontFamily, radius, spacing, type } from '../theme';

// What another member sees when they open your profile — ONLY what you chose
// to show: name, handle, quartier, status, current song, pinned photos, and
// your real Ngor honor score. Never phone, email, AFRI ID, or balances.
export default function PublicProfileScreen({ navigation, route }) {
  const handle = route.params?.handle ?? '';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getPublicProfile(handle)
        .then((p) => {
          if (!cancelled) setProfile(p);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message ?? 'Profil indisponible');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [handle]),
  );

  const cleanHandle = String(profile?.handle ?? handle).replace(/^@+/, '');

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ScreenHeader onBack={() => navigation.goBack()} title="Profil" style={{ marginBottom: spacing.xl }} />

          {loading ? (
            <ActivityIndicator color={colors.green} style={{ marginTop: spacing.giant }} />
          ) : error || !profile ? (
            <Text style={styles.empty}>{error ?? 'Profil introuvable.'}</Text>
          ) : (
            <>
              <View style={styles.hero}>
                <View style={styles.avatarRing}>
                  <ProfileAvatar
                    emoji={profile.avatarEmoji}
                    photoUrl={profile.avatarUrl}
                    size={88}
                    initial={(profile.name || cleanHandle || '?').charAt(0).toUpperCase()}
                    style={{ borderWidth: 0 }}
                  />
                </View>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profile.name || `@${cleanHandle}`}</Text>
                  {profile.verified ? (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedTick}>✓</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.handle}>@{cleanHandle}</Text>
                {profile.arrondissement?.name ? (
                  <Text style={styles.location}>📍 {profile.arrondissement.name}</Text>
                ) : null}
              </View>

              {(profile.statusText || profile.currentSong) && (
                <View style={styles.pillsRow}>
                  {profile.statusText ? (
                    <View style={styles.pill}>
                      <Text style={styles.pillIcon}>✨</Text>
                      <Text style={styles.pillText} numberOfLines={1}>{profile.statusText}</Text>
                    </View>
                  ) : null}
                  {profile.currentSong ? (
                    <View style={[styles.pill, styles.pillSong]}>
                      <Text style={styles.pillIcon}>🎵</Text>
                      <Text style={[styles.pillText, { color: colors.greenDark }]} numberOfLines={1}>
                        {profile.currentSong}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {(profile.pinnedPhotos?.length ?? 0) > 0 && (
                <View style={styles.photosBlock}>
                  <Text style={styles.sectionLabel}>Photos</Text>
                  <View style={styles.photosRow}>
                    {profile.pinnedPhotos.slice(0, 3).map((uri, i) => (
                      <Image key={i} source={{ uri }} style={styles.photo} />
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.ngorCard}>
                <Text style={styles.ngorScore}>{profile.ngor ?? 0}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ngorLabel}>NGOR</Text>
                  <Text style={styles.ngorSub}>Honneur gagné sur de vraies transactions K21</Text>
                </View>
                <Text style={styles.ngorStar}>✦</Text>
              </View>

              <View style={styles.actions}>
                <PressScale
                  scaleTo={0.97}
                  onPress={() => navigation.navigate('SendMoney', { recipientHandle: cleanHandle })}
                  style={[styles.actionBtn, styles.actionSend]}
                >
                  <Text style={styles.actionSendText}>💸 Envoyer</Text>
                </PressScale>
                <PressScale
                  scaleTo={0.97}
                  onPress={() => navigation.navigate('Main', { screen: 'MbooloTab' })}
                  style={[styles.actionBtn, styles.actionChat]}
                >
                  <Text style={styles.actionChatText}>💬 Mboolo</Text>
                </PressScale>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  scroll: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.giant },
  empty: { textAlign: 'center', fontSize: 13, color: 'rgba(5,8,5,0.5)', marginTop: spacing.giant },

  hero: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
  avatarRing: {
    padding: 5, borderRadius: 54, borderWidth: 2.5, borderColor: 'rgba(232,92,26,0.4)',
    marginBottom: spacing.lg,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: fontFamily.displayBlack, fontSize: 20, letterSpacing: -0.6, color: colors.ink },
  verifiedBadge: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedTick: { fontSize: 11, fontWeight: '900', color: colors.ink },
  handle: { fontSize: 13, color: colors.greenDark, marginTop: 3 },
  location: { fontSize: 11, color: 'rgba(5,8,5,0.55)', marginTop: 4 },

  pillsRow: { gap: spacing.sm, marginBottom: spacing.xl },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.round, borderBottomRightRadius: 8,
    paddingVertical: 7, paddingHorizontal: spacing.xl, maxWidth: '92%',
  },
  pillSong: { backgroundColor: colors.greenA08, borderColor: colors.greenA20 },
  pillIcon: { fontSize: 13 },
  pillText: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: 'rgba(5,8,5,0.7)', flexShrink: 1 },

  photosBlock: { marginBottom: spacing.xl },
  sectionLabel: { ...type.eyebrow, color: 'rgba(5,8,5,0.45)', marginBottom: spacing.md },
  photosRow: { flexDirection: 'row', gap: spacing.md },
  photo: {
    flex: 1, aspectRatio: 1, borderRadius: radius.xl, borderBottomRightRadius: 10,
    backgroundColor: 'rgba(5,8,5,0.05)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.08)',
  },

  ngorCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    backgroundColor: 'rgba(250,216,54,0.16)', borderWidth: 1, borderColor: 'rgba(232,146,10,0.28)',
    borderRadius: radius.xl, borderBottomRightRadius: 10,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, marginBottom: spacing.xl,
  },
  ngorScore: { fontFamily: fontFamily.displayBlack, fontSize: 26, letterSpacing: -1, color: colors.goldDark },
  ngorLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1, color: colors.goldDark },
  ngorSub: { fontSize: 11, color: 'rgba(5,8,5,0.55)', marginTop: 1 },
  ngorStar: { fontSize: 18, color: colors.goldDark },

  actions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    flex: 1, height: 52, borderRadius: radius.round, borderBottomRightRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  actionSend: { backgroundColor: colors.green },
  actionSendText: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.ink },
  actionChat: { backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1.5, borderColor: 'rgba(5,8,5,0.12)' },
  actionChatText: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.terracotta },
});
