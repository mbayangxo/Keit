import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import WaxPattern from '../components/WaxPattern';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useToast } from '../components/Toast';
import { useAppState } from '../state/AppState';
import { getMe, getMboloMessages, sendMboloMessage } from '../lib/api-client';
import { pickMboloImage, startMboloVoiceRecording } from '../lib/mbolo-media';

function formatMsgTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
}

function playVoice(url) {
  if (Platform.OS === 'web' && typeof Audio !== 'undefined') {
    new Audio(url).play().catch(() => {});
  }
}

function MessageBubble({ message, isMe }) {
  const time = formatMsgTime(message.createdAt);
  const sender = message.sender;

  if (isMe) {
    return (
      <View style={[styles.msg, styles.msgMe]}>
        <LinearGradient colors={[colors.mboolo.terra, colors.mboolo.terraLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubbleMe}>
          {message.kind === 'image' && message.mediaUrl ? (
            <Image source={{ uri: message.mediaUrl }} style={styles.msgImage} resizeMode="cover" />
          ) : message.kind === 'voice' && message.mediaUrl ? (
            <PressScale scaleTo={0.98} onPress={() => playVoice(message.mediaUrl)}>
              <Text style={styles.meText}>🎤 {message.body || 'Message vocal'} · Écouter</Text>
            </PressScale>
          ) : (
            <Text style={styles.meText}>{message.body}</Text>
          )}
          <Text style={styles.bTimeMe}>{time} ✓</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.msg, styles.msgThem]}>
      <View style={styles.msgAva}>
        <Text style={{ fontSize: 14 }}>{sender?.avatarEmoji ?? '👤'}</Text>
      </View>
      <View style={styles.bubbleThem}>
        <Text style={styles.bName}>{sender?.name ?? 'Membre'}</Text>
          {message.kind === 'image' && message.mediaUrl ? (
            <Image source={{ uri: message.mediaUrl }} style={styles.msgImage} resizeMode="cover" />
          ) : message.kind === 'voice' && message.mediaUrl ? (
            <PressScale scaleTo={0.98} onPress={() => playVoice(message.mediaUrl)}>
              <Text style={styles.themText}>🎤 {message.body || 'Message vocal'} · Écouter</Text>
            </PressScale>
          ) : (
            <Text style={styles.themText}>{message.body}</Text>
          )}
        <Text style={styles.bTime}>{time}</Text>
      </View>
    </View>
  );
}

export default function MbooloChatScreen({ navigation, route }) {
  const { threadId, thread, title } = route.params ?? {};
  const showToast = useToast();
  const { profile } = useAppState();
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(null);
  const scrollRef = useRef(null);

  const chatTitle = title ?? thread?.name ?? 'Mboolo';
  const memberCount = thread?.members?.length ?? 0;

  const loadMessages = useCallback(async () => {
    if (!threadId) return;
    try {
      const [me, msgs] = await Promise.all([getMe(), getMboloMessages(threadId)]);
      setUserId(me.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      showToast(err.message ?? 'Messages indisponibles');
    } finally {
      setLoading(false);
    }
  }, [threadId, showToast]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadMessages();
      const timer = setInterval(loadMessages, 8000);
      return () => clearInterval(timer);
    }, [loadMessages])
  );

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const postMessage = async (payload) => {
    setSending(true);
    try {
      const msg = await sendMboloMessage(threadId, payload);
      setMessages((prev) => [...prev, msg]);
      setText('');
    } catch (err) {
      showToast(err.message ?? 'Envoi impossible');
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const body = text.trim();
    if (!body || sending) return;
    postMessage({ body, kind: 'text' });
  };

  const handleImage = async () => {
    try {
      const mediaUrl = await pickMboloImage();
      if (!mediaUrl) return;
      await postMessage({ kind: 'image', mediaUrl, body: '📷 Photo' });
    } catch (err) {
      showToast(err.message ?? 'Photo impossible');
    }
  };

  const toggleVoice = async () => {
    if (recording) {
      try {
        const mediaUrl = await recording.stop();
        await postMessage({ kind: 'voice', mediaUrl, body: '🎤 Message vocal' });
      } catch (err) {
        showToast(err.message ?? 'Enregistrement impossible');
      } finally {
        setRecording(null);
      }
      return;
    }
    try {
      const session = await startMboloVoiceRecording();
      setRecording(session);
      showToast('Enregistrement… appuie à nouveau pour envoyer');
    } catch (err) {
      showToast(err.message ?? 'Micro indisponible');
    }
  };

  if (!threadId) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.mboolo.ink3 }}>Conversation introuvable</Text>
          <PressScale scaleTo={0.96} onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }}>
            <Text style={{ color: colors.mboolo.terra }}>Retour</Text>
          </PressScale>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(232,92,26,0.04)" size={14} durationMs={25000} animated={false} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.chatHead}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.chBack}>
            <Text style={{ fontSize: 15, color: '#fff' }}>←</Text>
          </PressScale>
          <View style={{ flex: 1 }}>
            <Text style={styles.chName}>{chatTitle}</Text>
            <Text style={styles.chSub}>
              {memberCount > 0 ? `${memberCount} membre${memberCount > 1 ? 's' : ''}` : `@${String(profile.handle ?? '').replace(/^@+/, '')}`}
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.msgs}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {loading && <ActivityIndicator color={colors.mboolo.terra} style={{ marginVertical: spacing.xl }} />}
          {!loading && messages.length === 0 && (
            <Text style={styles.emptyHint}>Aucun message — envoie le premier 👋</Text>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} isMe={m.senderId === userId} />
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <PressScale scaleTo={0.9} onPress={handleImage} style={styles.ciAttach} disabled={sending}>
            <Text style={{ fontSize: 16 }}>📷</Text>
          </PressScale>
          <PressScale scaleTo={0.9} onPress={toggleVoice} style={[styles.ciAttach, recording && styles.ciRecording]} disabled={sending}>
            <Text style={{ fontSize: 16 }}>{recording ? '⏹' : '🎤'}</Text>
          </PressScale>
          <TextInput
            style={styles.ciField}
            placeholder="Message…"
            placeholderTextColor={colors.mboolo.ink3}
            value={text}
            onChangeText={setText}
            editable={!sending}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <PressScale scaleTo={0.9} onPress={handleSend} style={styles.ciSend} disabled={sending || !text.trim()}>
            <LinearGradient colors={[colors.mboolo.terra, colors.mboolo.terraDark]} style={StyleSheet.absoluteFill} borderRadius={19} />
            <Text style={{ fontSize: 17, color: '#fff' }}>{sending ? '…' : '➤'}</Text>
          </PressScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mboolo.bg },
  chatHead: { backgroundColor: colors.mboolo.terra, paddingHorizontal: 14, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  chBack: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  chName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  chSub: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  msgs: { padding: 14, flexGrow: 1 },
  emptyHint: { textAlign: 'center', color: colors.mboolo.ink3, fontSize: 12, marginTop: spacing.giant },
  msg: { flexDirection: 'row', gap: 7, maxWidth: '88%', marginTop: spacing.lg },
  msgThem: { alignSelf: 'flex-start' },
  msgMe: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAva: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', borderWidth: 1.5, borderColor: 'rgba(232,92,26,0.15)', backgroundColor: '#fff' },
  bubbleThem: { backgroundColor: '#fff', borderWidth: 2, borderColor: 'rgba(232,92,26,0.12)', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  bName: { fontSize: 9, fontWeight: '700', color: colors.mboolo.terra, marginBottom: 3 },
  themText: { fontSize: 13, color: colors.mboolo.ink, lineHeight: 19.5 },
  bTime: { fontSize: 9, color: colors.mboolo.ink3, marginTop: 3, textAlign: 'right' },
  bubbleMe: { borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, maxWidth: '100%' },
  meText: { fontSize: 13, color: '#fff', lineHeight: 19.5 },
  bTimeMe: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 3, textAlign: 'right' },
  msgImage: { width: 200, height: 150, borderRadius: radius.lg, marginBottom: 4 },
  inputRow: { backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: 'rgba(232,92,26,0.1)', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  ciAttach: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.mboolo.terraPale, borderWidth: 1.5, borderColor: colors.mboolo.border, alignItems: 'center', justifyContent: 'center' },
  ciRecording: { backgroundColor: 'rgba(232,92,26,0.15)', borderColor: colors.terracotta },
  ciField: { flex: 1, minHeight: 38, borderRadius: 19, backgroundColor: colors.mboolo.bg2, borderWidth: 2, borderColor: colors.mboolo.border, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.sm, fontSize: 13, color: colors.mboolo.ink },
  ciSend: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
