import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { MBOLO_GIFS, MBOLO_REACTIONS, MBOLO_STICKERS } from '../lib/mboolo-stickers';
import { getMboloGifs, getMboloStorageStatus } from '../lib/api-client';
import { createPersonalMboloGif, pickMboloGifFile } from '../lib/mbolo-media';
import { useToast } from './Toast';
import { colors, fontFamily, radius, spacing } from '../theme';

export default function MbooloAttachSheet({
  visible,
  onClose,
  onPhoto,
  onCamera,
  onVoice,
  onVideo,
  onReaction,
  onSticker,
  onGif,
  onGifStudio,
}) {
  const showToast = useToast();
  const [gifs, setGifs] = useState(MBOLO_GIFS);
  const [gifsLoading, setGifsLoading] = useState(false);
  const [creatingGif, setCreatingGif] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  const loadGifs = useCallback(async () => {
    setGifsLoading(true);
    try {
      const [rows, status] = await Promise.all([
        getMboloGifs(),
        getMboloStorageStatus().catch(() => ({ storage: 'legacy', configured: false })),
      ]);
      setStorageReady(status.storage === 'supabase' || status.configured === true);
      if (Array.isArray(rows) && rows.length > 0) {
        setGifs(rows.filter((g) => g.url));
      }
    } catch {
      setGifs(MBOLO_GIFS);
      setStorageReady(false);
    } finally {
      setGifsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) loadGifs();
  }, [visible, loadGifs]);

  const handleCreateGif = async () => {
    if (creatingGif) return;
    setCreatingGif(true);
    try {
      const picked = await pickMboloGifFile();
      if (!picked) return;
      showToast('Création du GIF…');
      const created = await createPersonalMboloGif({
        label: 'Mon GIF',
        uri: picked.uri,
        mimeType: picked.mimeType,
        blob: picked.blob,
      });
      await loadGifs();
      if (created?.id) onGif(created);
      else showToast('GIF ajouté à ta bibliothèque');
    } catch (err) {
      showToast(err.message ?? 'GIF impossible');
    } finally {
      setCreatingGif(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
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
            {onVideo ? (
              <PressScale scaleTo={0.95} onPress={onVideo} style={styles.actionBtn}>
                <Text style={styles.actionIcon}>🎬</Text>
                <Text style={styles.actionLabel}>Vidéo</Text>
              </PressScale>
            ) : null}
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

          <View style={styles.gifHeader}>
            <Text style={styles.sectionLabel}>GIFs Teranga</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {onGifStudio ? (
                <PressScale scaleTo={0.95} onPress={onGifStudio} style={styles.createGifBtn}>
                  <Text style={styles.createGifText}>🎬 Studio</Text>
                </PressScale>
              ) : null}
              {storageReady ? (
                <PressScale scaleTo={0.95} onPress={handleCreateGif} style={styles.createGifBtn} disabled={creatingGif}>
                  <Text style={styles.createGifText}>{creatingGif ? '…' : '+ Mon GIF'}</Text>
                </PressScale>
              ) : null}
            </View>
          </View>
          {gifsLoading ? (
            <ActivityIndicator color={colors.mboolo.terra} style={{ marginVertical: spacing.sm }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gifRow}>
              {gifs.map((gif) => (
                <PressScale key={gif.id} scaleTo={0.95} onPress={() => onGif(gif)} style={styles.gifCard}>
                  <Image source={{ uri: gif.url }} style={styles.gifImage} resizeMode="cover" />
                  <Text style={styles.gifLabel}>{gif.label}</Text>
                </PressScale>
              ))}
            </ScrollView>
          )}

          <PressScale scaleTo={0.98} onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Fermer</Text>
          </PressScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdropTap: { flex: 1 },
  sheet: {
    backgroundColor: colors.mboolo.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mboolo.ink3,
    marginBottom: spacing.md,
  },
  title: { fontFamily: fontFamily.bold, fontSize: 17, color: colors.mboolo.ink, marginBottom: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.mboolo.ink2 },
  sectionLabel: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.mboolo.ink2, marginBottom: spacing.sm },
  gifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  createGifBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    backgroundColor: colors.mboolo.terraSoft,
  },
  createGifText: { fontFamily: fontFamily.semibold, fontSize: 12, color: colors.mboolo.terra },
  stickerRow: { gap: spacing.sm, paddingBottom: spacing.md },
  stickerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mboolo.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerEmoji: { fontSize: 22 },
  stickerPackRow: { gap: spacing.sm, paddingBottom: spacing.md },
  packSticker: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.mboolo.bg,
    minWidth: 72,
  },
  packEmoji: { fontSize: 28 },
  packLabel: { fontFamily: fontFamily.medium, fontSize: 10, color: colors.mboolo.ink3, marginTop: 2 },
  gifRow: { gap: spacing.sm, paddingBottom: spacing.md },
  gifCard: { width: 88, alignItems: 'center' },
  gifImage: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.mboolo.bg },
  gifLabel: { fontFamily: fontFamily.medium, fontSize: 10, color: colors.mboolo.ink3, marginTop: 4, textAlign: 'center' },
  closeBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.mboolo.bg,
  },
  closeText: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.mboolo.ink2 },
});
