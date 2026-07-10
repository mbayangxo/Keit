import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import GlowButton from '../components/GlowButton';
import { useToast } from '../components/Toast';
import { getFriends, addFriend, getMboloThreads, createMboloThread } from '../lib/api-client';
import { findDirectThreadForUser, navigateToMboloChat } from '../lib/mbolo-social';
import ProfileShareButtons from '../components/ProfileShareButtons';
import { useAppState } from '../state/AppState';
import { buildWebFriendUrl } from '../lib/k21-qr';
import { navigateFromRoot } from '../lib/root-navigation';
import { colors, fontFamily, radius, spacing } from '../theme';

function FriendRow({ friend, onSend, onMbolo }) {
  return (
    <PressScale scaleTo={0.98} onPress={onSend} style={styles.row}>
      <View style={styles.ava}>
        <Text style={{ fontSize: 22 }}>{friend.avatarEmoji ?? '👤'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{friend.name}</Text>
        <Text style={styles.rowMeta}>@{String(friend.handle ?? '').replace(/^@+/, '')}</Text>
      </View>
      <PressScale scaleTo={0.9} onPress={onMbolo} style={styles.mboloBtn}>
        <Text style={styles.mboloBtnText}>💬</Text>
      </PressScale>
    </PressScale>
  );
}

export default function FriendsScreen({ navigation, route }) {
  const { profile } = useAppState();
  const showToast = useToast();
  const open = (name, params) => navigateFromRoot(navigation, name, params);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handle, setHandle] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const incoming = route.params?.addHandle;
    if (incoming) {
      setHandle(`@${String(incoming).replace(/^@/, '')}`);
    }
  }, [route.params?.addHandle]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getFriends();
      setFriends(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast(err.message ?? 'Impossible de charger les amis');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const submitAdd = async () => {
    const h = handle.replace(/^@/, '').trim();
    if (h.length < 3) return;
    setAdding(true);
    try {
      await addFriend(h);
      showToast('Ami ajouté ✓');
      setHandle('');
      await load();
    } catch (err) {
      showToast(err.message ?? 'Ajout impossible');
    } finally {
      setAdding(false);
    }
  };

  const openMbooloWithFriend = async (friend) => {
    try {
      const threads = await getMboloThreads();
      let thread = findDirectThreadForUser(threads, friend.id);
      if (!thread) {
        thread = await createMboloThread({ memberHandles: [friend.handle] });
      }
      navigateToMboloChat(navigation, {
        threadId: thread.id,
        thread,
        title: friend.name ?? friend.handle,
      });
    } catch (err) {
      showToast(err.message ?? 'Mboolo indisponible');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenHeader onBack={() => navigation.goBack()} title="Mes amis" style={styles.header} />
          <Text style={styles.sub}>Envoie de l'argent ou ouvre Mboolo en un tap.</Text>

          {profile.handle ? (
            <View style={styles.inviteCard}>
              <Text style={styles.inviteTitle}>Invite tes amis sur K21</Text>
              <Text style={styles.inviteMeta}>@{profile.handle}</Text>
              {buildWebFriendUrl(profile.handle) ? (
                <Text style={styles.inviteLink}>{buildWebFriendUrl(profile.handle)}</Text>
              ) : null}
              <ProfileShareButtons profile={profile} mode="friend" />
              <PressScale scaleTo={0.97} onPress={() => open('MyQr')} style={styles.inviteQr}>
                <Text style={styles.inviteQrText}>📲 Mon QR à scanner</Text>
              </PressScale>
            </View>
          ) : null}

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={handle}
              onChangeText={setHandle}
              placeholder="@handle"
              placeholderTextColor={'rgba(5,8,5,0.45)'}
              autoCapitalize="none"
            />
            <GlowButton label={adding ? '…' : 'Ajouter'} onPress={submitAdd} disabled={adding || handle.trim().length < 3} style={styles.addBtn} />
          </View>

          <PressScale scaleTo={0.97} onPress={() => open('QrScan', { mode: 'friend' })} style={styles.scanLink}>
            <Text style={styles.scanLinkText}>📷 Scanner un QR pour ajouter</Text>
          </PressScale>

          {loading ? (
            <ActivityIndicator color={colors.green} style={{ marginTop: spacing.xxl }} />
          ) : friends.length === 0 ? (
            <Text style={styles.empty}>Pas encore d'amis — ajoute quelqu'un par @handle ou QR.</Text>
          ) : (
            <View style={styles.list}>
              {friends.map((f) => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  onSend={() => open('SendMoney', { recipientHandle: f.handle })}
                  onMbolo={() => openMbooloWithFriend(f)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.giant },
  header: { marginBottom: spacing.sm },
  sub: { fontSize: 12, color: 'rgba(5,8,5,0.5)', marginBottom: spacing.xl },
  inviteCard: {
    backgroundColor: colors.greenA08,
    borderWidth: 1,
    borderColor: colors.greenA20,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  inviteTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink },
  inviteMeta: { fontSize: 12, color: colors.greenDark },
  inviteLink: { fontSize: 10, color: 'rgba(5,8,5,0.45)' },
  inviteQr: { alignSelf: 'center', marginTop: spacing.xs },
  inviteQrText: { fontSize: 11, color: colors.greenDark, fontFamily: fontFamily.bodyBold },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(5,8,5,0.1)',
    paddingHorizontal: spacing.lg,
    color: colors.ink,
    fontSize: 14,
  },
  addBtn: { width: 112 },
  scanLink: { alignSelf: 'center', marginBottom: spacing.xxl },
  scanLinkText: { fontSize: 12, color: colors.greenDark, fontFamily: fontFamily.bodyBold },
  empty: { textAlign: 'center', color: 'rgba(5,8,5,0.45)', fontSize: 12, marginTop: spacing.xxl },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  ava: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.greenA08, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink },
  rowMeta: { fontSize: 11, color: 'rgba(5,8,5,0.45)' },
  mboloBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.greenA10, alignItems: 'center', justifyContent: 'center' },
  mboloBtnText: { fontSize: 16 },
});
