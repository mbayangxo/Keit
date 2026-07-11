import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import ScreenHeader from '../components/ScreenHeader';
import GlowButton from '../components/GlowButton';
import { useToast } from '../components/Toast';
import { getWeeklyChart, submitChartSong, voteChartSong } from '../lib/api-client';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useEntrance } from '../hooks/animations';

// K21 Charts — "221 Bëgg". 100% real: the community chart is ranked purely
// by user votes (one per person per week), and the YouTube section is what
// Senegal actually streams (cached by the daily cron). No editorial list.

const RANK_TONES = [colors.greenDark, colors.goldDark, colors.terracotta];

function rankColor(i) {
  return RANK_TONES[i] ?? 'rgba(5,8,5,0.45)';
}

function SongRow({ item, index, onVote, voting }) {
  const entrance = useEntrance(index * 60, 320, 8);
  return (
    <View style={[styles.songRow, item.mine && styles.songRowMine, entrance]}>
      <Text style={[styles.songRank, { color: rankColor(index) }]}>#{index + 1}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <Text style={styles.songVotes}>🔥 {item.votes}</Text>
      <PressScale
        scaleTo={0.92}
        onPress={() => onVote(item)}
        disabled={voting || item.mine}
        style={[styles.voteBtn, item.mine && styles.voteBtnMine]}
      >
        <Text style={[styles.voteBtnText, item.mine && styles.voteBtnTextMine]}>
          {item.mine ? '✓ Mon vote' : 'Voter'}
        </Text>
      </PressScale>
    </View>
  );
}

export default function ChartsScreen({ navigation }) {
  const showToast = useToast();
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setChart(await getWeeklyChart());
    } catch (err) {
      showToast(err.message ?? 'Chart indisponible');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const submit = async () => {
    if (title.trim().length < 1 || artist.trim().length < 1) return;
    setBusy(true);
    try {
      await submitChartSong({ title: title.trim(), artist: artist.trim() });
      setTitle('');
      setArtist('');
      showToast('Chanson ajoutée — ton vote est compté ✓');
      await load();
    } catch (err) {
      showToast(err.message ?? 'Ajout impossible');
    } finally {
      setBusy(false);
    }
  };

  const vote = async (song) => {
    setBusy(true);
    try {
      await voteChartSong(song.id);
      showToast(`Ton vote : ${song.title} ✓`);
      await load();
    } catch (err) {
      showToast(err.message ?? 'Vote impossible');
    } finally {
      setBusy(false);
    }
  };

  const weekNum = chart?.weekKey?.split('-W')[1];

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            onBack={() => navigation.goBack()}
            eyebrow="K21 CHARTS"
            title="221 Bëgg"
            style={{ marginBottom: spacing.sm }}
          />
          <Text style={styles.sub}>
            Le chart de la communauté — classé uniquement par vos votes.
            {weekNum ? ` Semaine ${weekNum}.` : ''}
          </Text>

          <View style={styles.pollCard}>
            <Text style={styles.pollQuestion}>🎶 {chart?.question ?? 'Ta chanson préférée cette semaine ?'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre de la chanson"
              placeholderTextColor={'rgba(5,8,5,0.45)'}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <TextInput
              style={styles.input}
              placeholder="Artiste"
              placeholderTextColor={'rgba(5,8,5,0.45)'}
              value={artist}
              onChangeText={setArtist}
              maxLength={60}
            />
            <GlowButton
              tone="gold"
              label={busy ? '…' : 'Proposer + voter →'}
              onPress={submit}
              disabled={busy || title.trim().length < 1 || artist.trim().length < 1}
            />
            <Text style={styles.pollHint}>Un vote par personne par semaine — tu peux le déplacer.</Text>
          </View>

          <Text style={styles.sectionLabel}>Classement de la semaine</Text>
          {loading ? (
            <ActivityIndicator color={colors.green} style={{ marginVertical: spacing.xxl }} />
          ) : (chart?.songs?.length ?? 0) === 0 ? (
            <Text style={styles.empty}>
              Aucune chanson cette semaine — propose la première et lance le chart !
            </Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {chart.songs.map((s, i) => (
                <SongRow key={s.id} item={s} index={i} onVote={vote} voting={busy} />
              ))}
            </View>
          )}

          <Text style={[styles.sectionLabel, { marginTop: spacing.xxl }]}>En tendance · YouTube Sénégal</Text>
          {(chart?.youtube?.length ?? 0) === 0 ? (
            <Text style={styles.empty}>
              Les tendances YouTube Sénégal apparaîtront ici après la première mise à jour quotidienne.
            </Text>
          ) : (
            <View style={styles.ytGrid}>
              {chart.youtube.map((y) => (
                <View key={y.rank} style={styles.ytTile}>
                  <Text style={[styles.ytRank, { color: rankColor(y.rank - 1) }]}>#{y.rank}</Text>
                  <Text style={styles.ytTitle} numberOfLines={2}>{y.title}</Text>
                  <Text style={styles.ytMeta} numberOfLines={1}>{y.meta}</Text>
                </View>
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
  scroll: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.giant },
  sub: { fontSize: 12, color: 'rgba(5,8,5,0.55)', marginBottom: spacing.xl, lineHeight: 17 },

  pollCard: {
    backgroundColor: 'rgba(250,216,54,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(232,146,10,0.3)',
    borderRadius: radius.xxl,
    borderBottomRightRadius: 10,
    padding: spacing.xxl,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  pollQuestion: { fontFamily: fontFamily.displayBold, fontSize: 13, color: colors.ink, marginBottom: spacing.xs },
  input: {
    height: 46,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.1)',
    paddingHorizontal: spacing.lg,
    color: colors.ink,
    fontSize: 14,
  },
  pollHint: { fontSize: 10, color: 'rgba(5,8,5,0.5)', textAlign: 'center' },

  sectionLabel: { ...type.eyebrow, color: 'rgba(5,8,5,0.45)', marginBottom: spacing.md },
  empty: { fontSize: 12, color: 'rgba(5,8,5,0.5)', lineHeight: 18, marginBottom: spacing.lg },

  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.xl,
    borderBottomRightRadius: 9,
    padding: spacing.xl,
  },
  songRowMine: { borderColor: colors.greenA35, backgroundColor: colors.greenA08 },
  songRank: { fontFamily: fontFamily.displayBlack, fontSize: 14, width: 30 },
  songTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink },
  songArtist: { fontSize: 11, color: 'rgba(5,8,5,0.55)', marginTop: 1 },
  songVotes: { fontSize: 11, fontWeight: '700', color: colors.goldDark },
  voteBtn: {
    height: 28,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.round,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteBtnMine: { backgroundColor: 'rgba(15,188,72,0.15)', borderWidth: 1, borderColor: colors.greenA35 },
  voteBtnText: { fontSize: 10, fontWeight: '800', color: colors.ink },
  voteBtnTextMine: { color: colors.greenDark },

  ytGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  ytTile: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.xl,
    borderBottomRightRadius: 9,
    padding: spacing.xl,
    minHeight: 84,
  },
  ytRank: { fontFamily: fontFamily.displayBlack, fontSize: 13, marginBottom: 4 },
  ytTitle: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.ink, lineHeight: 15 },
  ytMeta: { fontSize: 9, color: 'rgba(5,8,5,0.5)', marginTop: 3 },
});
