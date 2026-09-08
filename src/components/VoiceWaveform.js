import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius } from '../theme';

function pseudoWaveform(seed = 0) {
  const bars = [];
  for (let i = 0; i < 24; i += 1) {
    const h = 0.25 + ((Math.sin(i * 0.7 + seed) + 1) / 2) * 0.75;
    bars.push(h);
  }
  return bars;
}

export default function VoiceWaveform({ durationMs, isMe, progress = 0, waveformJson }) {
  const bars = Array.isArray(waveformJson) && waveformJson.length > 0 ? waveformJson.slice(0, 24) : pseudoWaveform(durationMs ?? 0);
  const playedBars = Math.floor(bars.length * Math.min(1, Math.max(0, progress)));

  return (
    <View style={styles.row}>
      {bars.map((h, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: 6 + h * 18,
              backgroundColor: i <= playedBars ? (isMe ? '#fff' : colors.mboolo.terra) : (isMe ? 'rgba(255,255,255,0.35)' : colors.mboolo.ink3),
            },
          ]}
        />
      ))}
      {durationMs ? (
        <Text style={[styles.time, isMe && styles.timeMe]}>
          {Math.max(1, Math.round(durationMs / 1000))}s
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, flex: 1, flexWrap: 'nowrap' },
  bar: { width: 3, borderRadius: 2 },
  time: { fontSize: 10, fontFamily: fontFamily.medium, color: colors.mboolo.ink3, marginLeft: 6 },
  timeMe: { color: 'rgba(255,255,255,0.85)' },
});
