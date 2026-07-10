import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import GlowButton from '../components/GlowButton';
import { useToast } from '../components/Toast';
import { getFriends, addFriend } from '../lib/api-client';
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

export default function FriendsScreen({ navigation }) {
  const showToast = useToast();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handle, setHandle] = useState('');
  const [adding, setAdding] = useState(false);

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

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenHeader onBack={() => navigation.goBack()} title="Mes amis" style={styles.header} />
          <Text style={styles.sub}>Envoie de l'argent ou ouvre Mboolo en un tap.</Text>

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

          <PressScale scaleTo={0.97} onPress={() => navigation.navigate('QrScan', { mode: 'friend' })} style={styles.scanLink}>
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
                  onSend={() => navigation.navigate('SendMoney', { recipientHandle: f.handle })}
                  onMbolo={() => {
                    showToast('Mboolo ouvert ✓');
                    navigation.navigate('Main', { screen: 'Mboolo' });
                  }}
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
