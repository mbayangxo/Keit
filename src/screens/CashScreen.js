import { useMemo, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useBlink, useEntrance, usePopIn } from '../hooks/animations';

// No HTML prototype exists for Cash In/Out (Julaya agent network) — only
// mentioned in the brief's Phase 1 scope. Designed to match the established
// system exactly and mirror Pay Merchant / Send Money's step structure.

const QUICK_AMOUNTS = [2000, 5000, 10000, 25000];
const BALANCE = 47000;

const AGENTS = [
  { key: 'ndiaye', name: 'Boutique Ndiaye', distance: '250 m', rating: 4.8, open: true },
  { key: 'sandaga', name: 'Kiosque Sandaga', distance: '480 m', rating: 4.6, open: true },
  { key: 'medina-tel', name: 'Médina Télécom', distance: '620 m', rating: 4.9, open: true },
  { key: 'aminata-shop', name: 'Chez Aminata', distance: '900 m', rating: 4.5, open: false },
];

function formatAmount(n) {
  return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ');
}

function agentFee(amount) {
  return Math.max(100, Math.round(amount * 0.01));
}

function ModeToggle({ mode, setMode }) {
  return (
    <View style={styles.modeToggle}>
      {[
        { key: 'in', label: 'Dépôt' },
        { key: 'out', label: 'Retrait' },
      ].map((m) => (
        <PressScale key={m.key} scaleTo={0.95} onPress={() => setMode(m.key)} style={[styles.modeBtn, mode === m.key && styles.modeBtnOn]}>
          <Text style={[styles.modeBtnText, mode === m.key && styles.modeBtnTextOn]}>{m.label}</Text>
        </PressScale>
      ))}
    </View>
  );
}

function AmountStep({ mode, setMode, amount, setAmount, onContinue, onBack }) {
  const label = mode === 'in' ? 'Combien déposer ?' : 'Combien retirer ?';

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
          </PressScale>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>JULAYA · CASH</Text>
            <Text style={styles.title}>{mode === 'in' ? 'Déposer de l’argent' : 'Retirer de l’argent'}</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.huge, marginBottom: spacing.xxl }}>
        <ModeToggle mode={mode} setMode={setMode} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.amountHero}>
          <Text style={styles.amountLbl}>{label}</Text>
          <Text style={styles.amountNum}>
            {formatAmount(amount)} <Text style={styles.amountCurr}>F</Text>
          </Text>

          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((q) => (
              <PressScale key={q} scaleTo={0.92} onPress={() => setAmount(q)} style={[styles.chip, amount === q && styles.chipOn]}>
                <Text style={[styles.chipText, amount === q && styles.chipTextOn]}>{q / 1000}k</Text>
              </PressScale>
            ))}
          </View>

          {mode === 'out' && <Text style={styles.balanceNote}>Solde disponible : {formatAmount(BALANCE)} F</Text>}
        </View>

        <View style={styles.feeNote}>
          <Text style={styles.feeNoteText}>
            Frais agent estimés : <Text style={{ fontFamily: fontFamily.bodyBold, color: colors.white }}>{formatAmount(agentFee(amount))} F</Text>
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GlowButton label="Choisir un agent →" onPress={onContinue} disabled={amount <= 0 || (mode === 'out' && amount > BALANCE)} />
      </View>
    </View>
  );
}

function AgentRow({ agent, delay, onPress }) {
  const entrance = useEntrance(delay, 300, 8);
  const liveDot = useBlink(1400, 0.3);
  return (
    <Animated.View style={entrance}>
      <PressScale scaleTo={0.98} onPress={agent.open ? onPress : undefined}>
        <View style={[styles.agentRow, !agent.open && styles.agentRowClosed]}>
          <View style={styles.agentAva}>
            <Text style={{ fontSize: 20 }}>🏬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentMeta}>
              📍 {agent.distance} · ⭐ {agent.rating.toFixed(1)}
            </Text>
          </View>
          {agent.open ? (
            <View style={styles.agentStatusOpen}>
              <Animated.View style={[styles.agentDot, { opacity: liveDot }]} />
              <Text style={styles.agentStatusText}>Ouvert</Text>
            </View>
          ) : (
            <Text style={styles.agentStatusClosedText}>Fermé</Text>
          )}
        </View>
      </PressScale>
    </Animated.View>
  );
}

function AgentStep({ mode, amount, onBack, onSelect }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
          </PressScale>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>AGENT LE PLUS PROCHE</Text>
            <Text style={styles.title}>Choisis un agent</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {mode === 'in' ? 'Dépôt de' : 'Retrait de'} {formatAmount(amount)} F
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false}>
        {AGENTS.map((a, i) => (
          <AgentRow key={a.key} agent={a} delay={i * 60} onPress={() => onSelect(a)} />
        ))}
      </ScrollView>
    </View>
  );
}

function CodeStep({ mode, amount, agent, onDone }) {
  const pop = usePopIn(0, 450, 0.85);
  const note = useEntrance(200, 400, 8);
  const code = useMemo(() => String(Math.floor(100000 + Math.random() * 900000)), [agent]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.giant }}>
      <Text style={styles.codeEyebrow}>{mode === 'in' ? 'Code de dépôt' : 'Code de retrait'}</Text>
      <Animated.View style={[styles.codeCard, pop]}>
        <Text style={styles.codeDigits}>{code}</Text>
        <View style={styles.codeDivider} />
        <Text style={styles.codeAgent}>{agent.name}</Text>
        <Text style={styles.codeAmount}>{formatAmount(amount)} F CFA</Text>
      </Animated.View>

      <Animated.View style={note}>
        <Text style={styles.codeHint}>
          {mode === 'in'
            ? 'Donne ce code et le montant en espèces à l’agent pour créditer ton solde K21.'
            : 'Donne ce code à l’agent pour retirer tes espèces. Ton solde K21 sera débité automatiquement.'}
        </Text>
        <Text style={styles.codeExpiry}>⏱ Valide 10 minutes · Token sécurisé, à usage unique</Text>
      </Animated.View>

      <View style={{ width: '100%', marginTop: spacing.giant }}>
        <GlowButton label="J'ai terminé avec l'agent →" onPress={onDone} />
      </View>
    </View>
  );
}

function SuccessStep({ mode, amount, agent, onDone }) {
  const ring = usePopIn(0, 500, 0.3);
  const title = useEntrance(200, 500, 10);
  const sub = useEntrance(300, 500, 10);
  const receipt = useEntrance(400, 500, 10);
  const fee = agentFee(amount);

  return (
    <View style={styles.successRoot}>
      <Animated.View style={[styles.ssRing, ring]}>
        <Text style={{ fontSize: 38, color: colors.green }}>✓</Text>
      </Animated.View>
      <Animated.Text style={[styles.ssTitle, title]}>{mode === 'in' ? 'Dépôt reçu !' : 'Retrait confirmé !'}</Animated.Text>
      <Animated.Text style={[styles.ssSub, sub]}>
        {mode === 'in' ? 'Ton solde K21 a été crédité instantanément.' : 'Tes espèces sont prêtes chez l’agent.'}
      </Animated.Text>

      <Animated.View style={[styles.ssReceipt, receipt]}>
        <View style={styles.ssrRow}>
          <Text style={styles.ssrL}>Agent</Text>
          <Text style={styles.ssrR}>{agent.name}</Text>
        </View>
        <View style={styles.ssrRow}>
          <Text style={styles.ssrL}>Montant</Text>
          <Text style={[styles.ssrR, { color: colors.green }]}>{formatAmount(amount)} F CFA</Text>
        </View>
        <View style={styles.ssrRow}>
          <Text style={styles.ssrL}>Frais agent</Text>
          <Text style={styles.ssrR}>{formatAmount(fee)} F</Text>
        </View>
      </Animated.View>

      <GlowButton label="Retour à l'accueil" onPress={onDone} />
    </View>
  );
}

export default function CashScreen({ navigation }) {
  const [step, setStep] = useState('amount');
  const [mode, setMode] = useState('in');
  const [amount, setAmount] = useState(5000);
  const [agent, setAgent] = useState(null);

  const finish = () => {
    setStep('amount');
    setAmount(5000);
    setAgent(null);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'amount' && (
          <AmountStep
            mode={mode}
            setMode={setMode}
            amount={amount}
            setAmount={setAmount}
            onContinue={() => setStep('agent')}
            onBack={() => navigation.goBack()}
          />
        )}
        {step === 'agent' && (
          <AgentStep
            mode={mode}
            amount={amount}
            onBack={() => setStep('amount')}
            onSelect={(a) => {
              setAgent(a);
              setStep('code');
            }}
          />
        )}
        {step === 'code' && agent && <CodeStep mode={mode} amount={amount} agent={agent} onDone={() => setStep('success')} />}
        {step === 'success' && agent && <SuccessStep mode={mode} amount={amount} agent={agent} onDone={finish} />}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  header: { paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginBottom: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...type.eyebrow, color: colors.green, marginBottom: 4 },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 20, color: colors.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: colors.whiteA40, marginTop: spacing.xs },

  modeToggle: { flexDirection: 'row', backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA12, borderRadius: radius.lg, padding: 3, gap: 3 },
  modeBtn: { flex: 1, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  modeBtnOn: { backgroundColor: colors.green },
  modeBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.whiteA55 },
  modeBtnTextOn: { color: colors.ink },

  amountHero: { alignItems: 'center', paddingHorizontal: spacing.giant, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  amountLbl: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1.5, color: 'rgba(26,240,96,0.6)', textTransform: 'uppercase', marginBottom: spacing.lg },
  amountNum: { fontFamily: fontFamily.displayBlack, fontSize: 48, letterSpacing: -3, lineHeight: 48, color: colors.green },
  amountCurr: { fontFamily: fontFamily.bodyRegular, fontSize: 16, fontWeight: '400', color: 'rgba(26,240,96,0.4)' },

  quickRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginTop: spacing.xl },
  chip: { height: 34, paddingHorizontal: spacing.xxl, borderRadius: radius.round, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.greenA10, borderColor: colors.greenA30 },
  chipText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.white },
  chipTextOn: { color: colors.green },
  balanceNote: { marginTop: spacing.xl, fontSize: 11, color: colors.whiteA35 },

  feeNote: { marginHorizontal: spacing.huge, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  feeNoteText: { fontSize: 11, color: colors.whiteA40 },

  footer: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },

  agentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginHorizontal: spacing.huge, marginBottom: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06 },
  agentRowClosed: { opacity: 0.5 },
  agentAva: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.whiteA06, alignItems: 'center', justifyContent: 'center' },
  agentName: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  agentMeta: { fontSize: 10, color: colors.whiteA35, marginTop: 1 },
  agentStatusOpen: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  agentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  agentStatusText: { fontSize: 10, fontWeight: '700', color: colors.green },
  agentStatusClosedText: { fontSize: 10, fontWeight: '700', color: colors.whiteA30 },

  codeEyebrow: { ...type.eyebrow, color: colors.green, marginBottom: spacing.xxl },
  codeCard: { width: '100%', backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.greenA25, borderRadius: radius.xxl, paddingVertical: spacing.giant, alignItems: 'center', marginBottom: spacing.xxl },
  codeDigits: { fontFamily: fontFamily.displayBlack, fontSize: 40, letterSpacing: 6, color: colors.green },
  codeDivider: { width: '60%', height: 1, backgroundColor: colors.whiteA10, marginVertical: spacing.xl },
  codeAgent: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  codeAmount: { fontSize: 12, color: colors.whiteA40, marginTop: 2 },
  codeHint: { fontSize: 12, color: colors.whiteA55, textAlign: 'center', lineHeight: 18, marginBottom: spacing.md },
  codeExpiry: { fontSize: 10, color: colors.whiteA30, textAlign: 'center' },

  successRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl + 14 },
  ssRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.greenA08, borderWidth: 3, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxxl, shadowColor: colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 50, elevation: 8 },
  ssTitle: { fontFamily: fontFamily.displayBlack, fontSize: 24, letterSpacing: -0.8, color: colors.white, marginBottom: spacing.md, textAlign: 'center' },
  ssSub: { fontSize: 12, color: colors.whiteA40, marginBottom: spacing.giant + 2, lineHeight: 20.4, textAlign: 'center' },
  ssReceipt: { width: '100%', backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA10, borderRadius: radius.xxl, padding: spacing.xxl, gap: spacing.md, marginBottom: spacing.giant },
  ssrRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ssrL: { fontSize: 11, color: colors.whiteA30 },
  ssrR: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
});
