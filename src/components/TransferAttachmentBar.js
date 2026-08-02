import { StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { colors, fontFamily, radius, spacing, type } from '../theme';

/** Photo / video / voice chips — shared by Send (Yónnee) and Receive (Jël). */
export default function TransferAttachmentBar({
  attachmentLabel,
  onPickPhoto,
  onPickVideo,
  onToggleVoice,
  voiceBusy,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <PressScale scaleTo={0.95} onPress={onPickPhoto} style={styles.chip}>
          <Text style={styles.chipText}>📷 Photo</Text>
        </PressScale>
        <PressScale scaleTo={0.95} onPress={onPickVideo} style={styles.chip}>
          <Text style={styles.chipText}>🎬 Vidéo</Text>
        </PressScale>
        <PressScale
          scaleTo={0.95}
          onPress={onToggleVoice}
          style={[styles.chip, voiceBusy && styles.chipOn]}
        >
          <Text style={styles.chipText}>{voiceBusy ? '⏹ Vocal' : '🎤 Vocal'}</Text>
        </PressScale>
      </View>
      {attachmentLabel ? <Text style={styles.hint}>{attachmentLabel}</Text> : null}
    </View>
  );
}

export function attachmentLabelFromMedia({ voiceNoteUrl, photoUrl, videoUrl }) {
  if (voiceNoteUrl) return 'Message vocal joint';
  if (photoUrl) return 'Photo jointe';
  if (videoUrl) return 'Vidéo jointe';
  return '';
}

export function requestMediaSummary(req) {
  if (req.note) return req.note;
  if (req.voiceNoteUrl) return '🎤 Message vocal';
  if (req.photoUrl) return '📷 Photo jointe';
  if (req.videoUrl) return '🎬 Vidéo jointe';
  return null;
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.12)',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  chipOn: { borderColor: colors.green, backgroundColor: 'rgba(26,240,96,0.12)' },
  chipText: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, color: colors.ink },
  hint: { ...type.caption, color: colors.greenDark, marginTop: spacing.xs },
});
