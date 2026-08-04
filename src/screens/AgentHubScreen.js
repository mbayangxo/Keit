import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import GlowButton from '../components/GlowButton';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import ScreenHeader from '../components/ScreenHeader';
import { useToast } from '../components/Toast';
import { getAgentApplication } from '../lib/api-client';
import { colors, fontFamily, radius, spacing, type } from '../theme';

export default function AgentHubScreen({ navigation }) {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAgentApplication();
      setApplication(data.application ?? null);
    } catch (err) {
      showToast(err.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const status = application?.status;
  const isActive = status === 'active';

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenHeader onBack={() => navigation.goBack()} eyebrow="K21 AGENTS" title="Point agent & retraits" />

          {loading ? <ActivityIndicator color={colors.green} style={{ marginVertical: spacing.xl }} /> : null}

          {!loading ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Retirer ou déposer du cash</Text>
                <Text style={styles.cardSub}>
                  Trouve un agent près de toi — dépôt cash ou retrait wallet en espèces.
                </Text>
                <GlowButton
                  label="Trouver un agent (dépôt)"
                  onPress={() => navigation.navigate('AgentDiscovery', { mode: 'deposit' })}
                  style={{ marginTop: spacing.lg }}
                />
                <PressScale
                  scaleTo={0.97}
                  onPress={() => navigation.navigate('Cash', { initialMode: 'out' })}
                  style={styles.link}
                >
                  <Text style={styles.linkText}>Retrait chez un agent →</Text>
                </PressScale>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Devenir agent K21</Text>
                {application ? (
                  <>
                    <Text style={styles.cardSub}>
                      {application.message ?? `Statut : ${status}`}
                    </Text>
                    {application.agentCode ? (
                      <Text style={styles.code}>{application.agentCode} · {application.tier ?? 'standard'}</Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.cardSub}>
                    Ouvre un point marché / boutique — K21 charge ton float après validation.
                  </Text>
                )}

                {isActive ? (
                  <GlowButton
                    label="Ouvrir mode agent"
                    onPress={() => navigation.navigate('AgentHome')}
                    style={{ marginTop: spacing.lg }}
                  />
                ) : (
                  <GlowButton
                    label={status === 'pending' ? 'Demande en cours' : 'Postuler comme agent'}
                    onPress={() => navigation.navigate('AgentApply')}
                    disabled={status === 'pending'}
                    style={{ marginTop: spacing.lg }}
                  />
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Agents business</Text>
                <Text style={styles.cardSub}>
                  Retraits &gt; 500 000 F — uniquement chez les agents business (BAG-…). Contacte K21 pour en
                  devenir un.
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
  scroll: { paddingHorizontal: spacing.huge, paddingBottom: spacing.giant },
  card: {
    backgroundColor: colors.appCanvas.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.appCanvas.border,
  },
  cardTitle: { fontFamily: fontFamily.displayBlack, fontSize: 20, color: colors.ink },
  cardSub: { ...type.body, color: colors.appCanvas.textMuted, marginTop: spacing.sm, lineHeight: 22 },
  code: { ...type.caption, color: colors.greenDark, marginTop: spacing.sm, fontFamily: fontFamily.bodyBold },
  link: { alignItems: 'center', marginTop: spacing.md },
  linkText: { ...type.body, color: colors.greenDark, fontFamily: fontFamily.bodyMedium },
});
