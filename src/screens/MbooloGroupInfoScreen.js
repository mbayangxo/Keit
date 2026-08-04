import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import StoryAvatar from '../components/StoryAvatar';
import K21QrCode from '../components/K21QrCode';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useToast } from '../components/Toast';
import { getMboloThreads, addMboloThreadMembers, getMboloThreadInvite } from '../lib/api-client';

/** Group member list + add-member + invite code/QR/link, for one Mboolo group thread. */
export default function MbooloGroupInfoScreen({ navigation, route }) {
  const { threadId } = route.params ?? {};
  const showToast = useToast();
  const [thread, setThread] = useState(route.params?.thread ?? null);
  const [loading, setLoading] = useState(!route.params?.thread);
  const [handleInput, setHandleInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [invite, setInvite] = useState(null);
  const [invitingLoading, setInvitingLoading] = useState(false);

  const load = useCallback(async () => {
    if (!threadId) return;
    try {
      const list = await getMboloThreads();
      const found = (Array.isArray(list) ? list : []).find((t) => t.id === threadId);
      if (found) setThread(found);
    } catch (err) {
      showToast(err.message ?? 'Conversation introuvable');
    } finally {
      setLoading(false);
    }
  }, [threadId, showToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const addMembers = async () => {
    const handles = handleInput
      .split(/[,;\s]+/)
      .map((h) => h.replace(/^@/, '').trim())
      .filter(Boolean);
    if (handles.length === 0) {
      showToast('@handle requis');
      return;
    }
    setAdding(true);
    try {
      await addMboloThreadMembers(threadId, handles);
      showToast('Ajouté ✓');
      setHandleInput('');
      await load();
    } catch (err) {
      showToast(err.message ?? 'Ajout impossible');
    } finally {
      setAdding(false);
    }
  };

  const showInvite = async () => {
    setInvitingLoading(true);
    try {
      const result = await getMboloThreadInvite(threadId);
      setInvite(result);
    } catch (err) {
      showToast(err.message ?? 'Invitation impossible');
    } finally {
      setInvitingLoading(false);
    }
  };

  const shareInvite = () => {
    if (!invite) return;
    Share.share({
      message: `Rejoins "${thread?.name ?? 'notre groupe'}" sur K21 Mboolo : ${invite.webUrl}`,
    }).catch(() => {});
  };

  const members = thread?.members ?? [];

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 16 }}>←</Text>
          </PressScale>
          <Text style={styles.title}>{thread?.name ?? 'Groupe'}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.mboolo.terra} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.sectionLabel}>Membres · {members.length}</Text>
            {members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <StoryAvatar photoUrl={m.user?.avatarUrl} emoji={m.user?.avatarEmoji ?? '🧑🏾'} size={36} spin={false} />
                <Text style={styles.memberName}>{m.user?.name ?? m.user?.handle}</Text>
              </View>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Ajouter des membres</Text>
            <TextInput
              style={styles.input}
              placeholder="@fatou @ibou"
              placeholderTextColor="rgba(5,8,5,0.4)"
              value={handleInput}
              onChangeText={setHandleInput}
              autoCapitalize="none"
            />
            <GlowButton label={adding ? 'Ajout…' : 'Ajouter'} onPress={addMembers} disabled={adding} />

            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Inviter par code / QR / lien</Text>
            {invite ? (
              <View style={styles.inviteCard}>
                <K21QrCode value={invite.webUrl} size={160} />
                <Text style={styles.inviteCode}>{invite.inviteCode}</Text>
                <PressScale scaleTo={0.97} onPress={shareInvite} style={styles.shareBtn}>
                  <Text style={styles.shareBtnText}>Partager le lien d'invitation</Text>
                </PressScale>
              </View>
            ) : (
              <GlowButton
                label={invitingLoading ? 'Génération…' : 'Générer un code d’invitation'}
                onPress={showInvite}
                disabled={invitingLoading}
              />
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mboolo.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.mboolo.border },
  backBtn: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: 'rgba(5,8,5,0.05)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamily.displayBold, fontSize: 15, color: colors.mboolo.ink },
  body: { padding: spacing.lg, gap: spacing.sm },
  sectionLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.mboolo.ink3,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  memberName: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, color: colors.mboolo.ink },
  input: {
    height: 44,
    borderWidth: 2,
    borderColor: colors.mboolo.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    fontSize: 13,
    color: colors.mboolo.ink,
    backgroundColor: '#fff',
    marginBottom: spacing.sm,
  },
  inviteCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  inviteCode: { fontFamily: fontFamily.displayBold, fontSize: 18, letterSpacing: 2, color: colors.mboolo.terra },
  shareBtn: {
    backgroundColor: colors.mboolo.terra,
    borderRadius: radius.round,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  shareBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: '#fff' },
});
