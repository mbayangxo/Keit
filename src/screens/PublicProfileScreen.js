import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScreenBackground from '../components/ScreenBackground';
import ScreenHeader from '../components/ScreenHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import PressScale from '../components/PressScale';
import { useToast } from '../components/Toast';
import {
  addFriend,
  getMboloThreads,
  createMboloThread,
  getPublicProfile,
  respondFriendRequest,
  getFriendRequests,
  voteProfilePoll,
} from '../lib/api-client';
import { findDirectThreadForUser, navigateToMboloChat } from '../lib/mbolo-social';
import { colors, fontFamily, radius, spacing, type } from '../theme';

// What another member sees when they open your profile — ONLY what you chose
// to show: name, handle, quartier, status, current song, pinned photos, and
// your real Ngor honor score. Never phone, email, AFRI ID, or balances.
export default function PublicProfileScreen({ navigation, route }) {
  const handle = route.params?.handle ?? '';
  const showToast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voteError, setVoteError] = useState(null);
  const [friendBusy, setFriendBusy] = useState(false);
  const [incomingRequestId, setIncomingRequestId] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getPublicProfile(handle);
      setProfile(p);
      if (p.friendRelation === 'pending_in') {
        const reqs = await getFriendRequests();
        const match = (reqs?.incoming ?? []).find(
          (r) => String(r.user?.handle ?? '').replace(/^@+/, '').toLowerCase() === cleanHandleFrom(p.handle ?? handle),
        );
        setIncomingRequestId(match?.id ?? null);
      } else {
        setIncomingRequestId(null);
      }
    } catch (err) {
      setError(err.message ?? 'Profil indisponible');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const cleanHandle = String(profile?.handle ?? handle).replace(/^@+/, '');

  function cleanHandleFrom(value) {
    return String(value ?? '').replace(/^@+/, '').toLowerCase();
  }

  const addAsFriend = async () => {
    if (!cleanHandle) return;
    setFriendBusy(true);
    try {
      const result = await addFriend(cleanHandle);
      if (result?.alreadyFriends || result?.autoAccepted || result?.accepted) {
        showToast('Vous êtes amis ✓');
      } else {
        showToast('Demande envoyée ✓');
      }
      await loadProfile();
    } catch (err) {
      showToast(err.message ?? 'Ajout impossible');
    } finally {
      setFriendBusy(false);
    }
  };

  const acceptFriendRequest = async () => {
    if (!incomingRequestId) {
      await loadProfile();
      return;
    }
    setFriendBusy(true);
    try {
      await respondFriendRequest(incomingRequestId, true);
      showToast('Ami ajouté ✓');
      await loadProfile();
    } catch (err) {
      showToast(err.message ?? 'Acceptation impossible');
    } finally {
      setFriendBusy(false);
    }
  };

  const openMboolo = async () => {
    try {
      const threads = await getMboloThreads();
      let thread = findDirectThreadForUser(threads, profile?.id);
      if (!thread) {
        thread = await createMboloThread({ memberHandles: [cleanHandle] });
      }
      navigateToMboloChat(navigation, {
        threadId: thread.id,
        thread,
        title: profile?.name ?? cleanHandle,
      });
    } catch (err) {
      showToast(err.message ?? 'Mboolo indisponible');
    }
  };

  const vote = async (optionIx) => {
    setVoteError(null);
    try {
      await voteProfilePoll(profile.poll.id, optionIx);
      setProfile(await getPublicProfile(handle));
    } catch (err) {
      setVoteError(err.message ?? 'Vote impossible');
    }
  };

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
                {profile.communityConfirmed ? (
                  <View style={styles.confirmedPill}>
                    <Text style={styles.confirmedPillText}>🛡️ Confirmé par la communauté</Text>
                  </View>
                ) : null}
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

              {profile.poll ? (
                <View style={styles.pollCard}>
                  <Text style={styles.pollQuestion}>🤔 {profile.poll.question}</Text>
                  {profile.poll.options.map((opt) => {
                    const pct = profile.poll.totalVotes > 0 ? Math.round((opt.votes / profile.poll.totalVotes) * 100) : 0;
                    const chosen = profile.poll.myVoteIx === opt.ix;
                    const showResults = profile.poll.myVoteIx != null || profile.poll.mine;
                    return (
                      <PressScale
                        key={opt.ix}
                        scaleTo={0.98}
                        disabled={profile.poll.mine}
                        onPress={() => vote(opt.ix)}
                        style={[styles.pollOption, chosen && styles.pollOptionChosen]}
                      >
                        {showResults ? (
                          <View style={[styles.pollFill, { width: `${pct}%` }, chosen && styles.pollFillChosen]} />
                        ) : null}
                        <Text style={[styles.pollOptionText, chosen && { color: colors.greenDark }]} numberOfLines={1}>
                          {chosen ? '✓ ' : ''}{opt.label}
                        </Text>
                        {showResults ? <Text style={styles.pollPct}>{pct}%</Text> : null}
                      </PressScale>
                    );
                  })}
                  <Text style={styles.pollMeta}>
                    {profile.poll.totalVotes} vote{profile.poll.totalVotes === 1 ? '' : 's'}
                    {profile.poll.mine ? ' · ton sondage' : profile.poll.myVoteIx == null ? ' · touche un choix pour voter' : ''}
                  </Text>
                  {voteError ? <Text style={styles.pollError}>{voteError}</Text> : null}
                </View>
              ) : null}

              <View style={styles.ngorCard}>
                <Text style={styles.ngorScore}>{profile.ngor ?? 0}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ngorLabel}>NGOR</Text>
                  <Text style={styles.ngorSub}>Honneur gagné sur de vraies transactions K21</Text>
                </View>
                <Text style={styles.ngorStar}>✦</Text>
              </View>

              <View style={styles.actions}>
                {profile.friendRelation === 'self' ? null : profile.friendRelation === 'friends' ? (
                  <View style={styles.friendPill}>
                    <Text style={styles.friendPillText}>✓ Ami</Text>
                  </View>
                ) : profile.friendRelation === 'pending_out' ? (
                  <View style={styles.friendPill}>
                    <Text style={styles.friendPillText}>⏳ Demande envoyée</Text>
                  </View>
                ) : profile.friendRelation === 'pending_in' ? (
                  <PressScale
                    scaleTo={0.97}
                    onPress={acceptFriendRequest}
                    style={[styles.actionBtn, styles.actionFriend, friendBusy && { opacity: 0.6 }]}
                  >
                    <Text style={styles.actionFriendText}>{friendBusy ? '…' : '✓ Accepter la demande'}</Text>
                  </PressScale>
                ) : (
                  <PressScale
                    scaleTo={0.97}
                    onPress={addAsFriend}
                    style={[styles.actionBtn, styles.actionFriend, friendBusy && { opacity: 0.6 }]}
                  >
                    <Text style={styles.actionFriendText}>{friendBusy ? '…' : '＋ Ajouter'}</Text>
                  </PressScale>
                )}
                <PressScale
                  scaleTo={0.97}
                  onPress={() => navigation.navigate('SendMoney', { recipientHandle: cleanHandle })}
                  style={[styles.actionBtn, styles.actionSend]}
                >
                  <Text style={styles.actionSendText}>💸 Envoyer</Text>
                </PressScale>
                <PressScale
                  scaleTo={0.97}
                  onPress={openMboolo}
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
  confirmedPill: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    backgroundColor: 'rgba(26,240,96,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(15,188,72,0.3)',
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  confirmedPillText: { fontSize: 11, color: colors.greenDark, fontFamily: fontFamily.bodyBold },
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

  pollCard: {
    backgroundColor: 'rgba(232,92,26,0.08)', borderWidth: 1.5, borderColor: 'rgba(232,92,26,0.25)',
    borderRadius: radius.xl, borderBottomRightRadius: 10, padding: spacing.xl, gap: spacing.sm, marginBottom: spacing.xl,
  },
  pollQuestion: { fontFamily: fontFamily.displayBold, fontSize: 13, color: colors.ink, marginBottom: spacing.xs },
  pollOption: {
    minHeight: 40, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1, borderColor: 'rgba(5,8,5,0.1)', overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  pollOptionChosen: { borderColor: colors.greenA35 },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(232,92,26,0.16)' },
  pollFillChosen: { backgroundColor: colors.greenA15 },
  pollOptionText: { fontFamily: fontFamily.bodyBold, fontSize: 12.5, color: 'rgba(5,8,5,0.75)', flexShrink: 1 },
  pollPct: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: 'rgba(5,8,5,0.5)' },
  pollMeta: { fontSize: 10, color: 'rgba(5,8,5,0.5)', textAlign: 'center', marginTop: 2 },
  pollError: { fontSize: 10, color: colors.terracotta, textAlign: 'center' },

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

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  friendPill: {
    flexBasis: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radius.round,
    backgroundColor: 'rgba(26,240,96,0.12)',
    borderWidth: 1,
    borderColor: colors.greenA25,
  },
  friendPillText: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.greenDark },
  actionBtn: {
    flex: 1, minWidth: '30%', height: 52, borderRadius: radius.round, borderBottomRightRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  actionFriend: { backgroundColor: 'rgba(250,216,54,0.22)', borderWidth: 1.5, borderColor: 'rgba(232,146,10,0.35)' },
  actionFriendText: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.goldDark },
  actionSend: { backgroundColor: colors.green },
  actionSendText: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.ink },
  actionChat: { backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1.5, borderColor: 'rgba(5,8,5,0.12)' },
  actionChatText: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.terracotta },
});
