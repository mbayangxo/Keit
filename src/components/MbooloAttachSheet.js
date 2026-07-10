import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { MBOLO_GIFS, MBOLO_REACTIONS, MBOLO_STICKERS } from '../lib/mboolo-stickers';
import { colors, fontFamily, radius, spacing } from '../theme';

export default function MbooloAttachSheet({
  visible,
  onClose,
  onPhoto,
  onCamera,
  onVoice,
  onReaction,
  onSticker,
  onGif,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Envoyer dans Mboolo</Text>

          <View style={styles.actions}>
            <PressScale scaleTo={0.95} onPress={onPhoto} style={styles.actionBtn}>
              <Text style={styles.actionIcon}>🖼️</Text>
              <Text style={styles.actionLabel}>Photo</Text>
            </PressScale>
            <PressScale scaleTo={0.95} onPress={onCamera} style={styles.actionBtn}>
              <Text style={styles.actionIcon}>📷</Text>
              <Text style={styles.actionLabel}>Caméra</Text>
            </PressScale>
            <PressScale scaleTo={0.95} onPress={onVoice} style={styles.actionBtn}>
              <Text style={styles.actionIcon}>🎤</Text>
              <Text style={styles.actionLabel}>Vocal</Text>
            </PressScale>
          </View>

          <Text style={styles.sectionLabel}>Réactions rapides</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerRow}>
            {MBOLO_REACTIONS.map((emoji) => (
              <PressScale key={emoji} scaleTo={0.9} onPress={() => onReaction(emoji)} style={styles.stickerBtn}>
                <Text style={styles.stickerEmoji}>{emoji}</Text>
              </PressScale>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>Stickers K21</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerPackRow}>
            {MBOLO_STICKERS.map((sticker) => (
              <PressScale key={sticker.id} scaleTo={0.92} onPress={() => onSticker(sticker)} style={styles.packSticker}>
                <Text style={styles.packEmoji}>{sticker.emoji}</Text>
                <Text style={styles.packLabel}>{sticker.label}</Text>
              </PressScale>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>GIFs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gifRow}>
            {MBOLO_GIFS.map((gif) => (
              <PressScale key={gif.id} scaleTo={0.95} onPress={() => onGif(gif)} style={styles.gifCard}>
                <Image source={{ uri: gif.url }} style={styles.gifImage} resizeMode="cover" />
                <Text style={styles.gifLabel}>{gif.label}</Text>
              </PressScale>
            ))}
          </ScrollView>

          <PressScale scaleTo={0.98} onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Fermer</Text>
          </PressScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5,8,5,0.45)', justifyContent: 'flex-end' },
  backdropTap: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: colors.mboolo.bg,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.giant,
    borderWidth: 1,
    borderColor: colors.mboolo.border,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(5,8,5,0.15)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fontFamily.displayBold, fontSize: 16, color: colors.mboolo.ink, marginBottom: spacing.xl },
  actions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.mboolo.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
  },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.mboolo.ink },
  sectionLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.mboolo.ink3,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  stickerRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  stickerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.mboolo.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerEmoji: { fontSize: 22 },
  stickerPackRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  packSticker: {
    width: 72,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.mboolo.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  packEmoji: { fontSize: 32 },
  packLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 9, color: colors.mboolo.ink, textAlign: 'center' },
  gifRow: { gap: spacing.md, paddingBottom: spacing.xl },
  gifCard: {
    width: 96,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.mboolo.border,
  },
  gifImage: { width: 96, height: 72 },
  gifLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 10, color: colors.mboolo.ink, padding: 6, textAlign: 'center' },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.mboolo.terraPale,
    borderWidth: 1.5,
    borderColor: colors.mboolo.border,
  },
  closeText: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.mboolo.terraDark },
});
