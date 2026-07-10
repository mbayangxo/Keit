import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import WaxPattern from '../components/WaxPattern';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import GlowButton from '../components/GlowButton';
import { useToast } from '../components/Toast';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, radius, spacing } from '../theme';
import {
  getMyBusinesses,
  getPayrollEmployees,
  addPayrollEmployee,
  payPayrollEmployee,
  getSchoolStudents,
  createSchoolFeePeriod,
  getSchoolFeePeriods,
  getSchoolPeriodStatus,
  remindSchoolFees,
  enrollSchoolStudent,
  getCooperativeDeliveries,
  logCooperativeDelivery,
  verifyCooperativeDelivery,
  payoutCooperativeFarmer,
} from '../lib/api-client';

const TYPE_LABEL = {
  merchant: 'Marchand',
  employer: 'Employeur',
  school: 'École',
  cooperative: 'Coopérative',
};

function formatAmount(n) {
  return Math.round(n ?? 0).toLocaleString('fr-FR').replace(/ /g, ' ');
}

function TabPill({ label, active, onPress }) {
  return (
    <PressScale scaleTo={0.96} onPress={onPress} style={[styles.tab, active && styles.tabOn]}>
      <Text style={[styles.tabText, active && styles.tabTextOn]}>{label}</Text>
    </PressScale>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function BusinessHubScreen({ navigation }) {
  const { profile, balance, transactions, refreshWallet, setProfile } = useAppState();
  const { showToast } = useToast();
  const [businesses, setBusinesses] = useState(profile.businesses?.length ? profile.businesses : profile.business ? [profile.business] : []);
  const [activeId, setActiveId] = useState(profile.business?.id ?? profile.businesses?.[0]?.id ?? null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [newHandle, setNewHandle] = useState('');
  const [newPay, setNewPay] = useState('50000');
  const [newRole, setNewRole] = useState('staff');

  const [students, setStudents] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [periodStatus, setPeriodStatus] = useState(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newParentHandle, setNewParentHandle] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [periodAmount, setPeriodAmount] = useState('25000');

  const [deliveries, setDeliveries] = useState([]);
  const [deliveryTons, setDeliveryTons] = useState('1');
  const [farmerHandle, setFarmerHandle] = useState('');

  const business = businesses.find((b) => b.id === activeId) ?? businesses[0] ?? profile.business;
  const type = business?.type ?? 'merchant';

  const loadBusinesses = useCallback(async () => {
    try {
      const res = await getMyBusinesses();
      const owned = res.owned ?? [];
      setBusinesses(owned);
      if (owned.length && !activeId) setActiveId(owned[0].id);
      if (owned[0]) setProfile({ business: owned[0], businesses: owned });
    } catch {
      /* keep cached profile */
    }
  }, [activeId, setProfile]);

  const loadTabData = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      if (tab === 'payroll' || type === 'employer' || type === 'cooperative') {
        setEmployees(await getPayrollEmployees(business.id));
      }
      if (tab === 'school' || type === 'school') {
        setStudents(await getSchoolStudents(business.id));
        setPeriods(await getSchoolFeePeriods(business.id));
        if (periods[0]?.id) {
          setPeriodStatus(await getSchoolPeriodStatus(business.id, periods[0].id));
        }
      }
      if (tab === 'coop' || type === 'cooperative') {
        setDeliveries(await getCooperativeDeliveries(business.id));
      }
    } catch (err) {
      showToast(err.message ?? 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [business?.id, tab, type, periods, showToast]);

  useFocusEffect(
    useCallback(() => {
      refreshWallet().catch(() => {});
      loadBusinesses();
    }, [refreshWallet, loadBusinesses]),
  );

  useFocusEffect(
    useCallback(() => {
      if (business?.id) loadTabData();
    }, [business?.id, tab, loadTabData]),
  );

  const tabsForType = () => {
    const base = [{ key: 'overview', label: 'Aperçu' }];
    if (type === 'employer' || type === 'cooperative' || type === 'merchant') base.push({ key: 'payroll', label: 'Paie' });
    if (type === 'school') base.push({ key: 'school', label: 'École' });
    if (type === 'cooperative') base.push({ key: 'coop', label: 'Livraisons' });
    return base;
  };

  const addEmployee = async () => {
    if (!business?.id || !newHandle.trim()) return;
    setLoading(true);
    try {
      await addPayrollEmployee(business.id, {
        userHandle: newHandle.trim(),
        jobTitle: newRole,
        payAmount: parseInt(newPay, 10) || undefined,
      });
      setNewHandle('');
      showToast('Employé ajouté ✓');
      setEmployees(await getPayrollEmployees(business.id));
    } catch (err) {
      showToast(err.message ?? 'Ajout impossible');
    } finally {
      setLoading(false);
    }
  };

  const payEmployee = async (emp) => {
    setLoading(true);
    try {
      await payPayrollEmployee(business.id, { employeeId: emp.id });
      showToast(`Payé ${emp.user?.name ?? ''} ✓`);
      await refreshWallet();
    } catch (err) {
      showToast(err.message ?? 'Paiement impossible');
    } finally {
      setLoading(false);
    }
  };

  const enrollStudent = async () => {
    if (!newStudentName.trim() || !newParentHandle.trim()) return;
    setLoading(true);
    try {
      await enrollSchoolStudent(business.id, {
        studentName: newStudentName.trim(),
        parentHandle: newParentHandle.trim(),
      });
      setNewStudentName('');
      setNewParentHandle('');
      showToast('Élève inscrit ✓');
      setStudents(await getSchoolStudents(business.id));
    } catch (err) {
      showToast(err.message ?? 'Inscription impossible');
    } finally {
      setLoading(false);
    }
  };

  const openPeriod = async () => {
    if (!periodLabel.trim()) return;
    setLoading(true);
    try {
      const due = new Date();
      due.setDate(due.getDate() + 30);
      await createSchoolFeePeriod(business.id, {
        label: periodLabel.trim(),
        amount: parseInt(periodAmount, 10) || 25000,
        dueDate: due.toISOString(),
      });
      setPeriodLabel('');
      const p = await getSchoolFeePeriods(business.id);
      setPeriods(p);
      if (p[0]) setPeriodStatus(await getSchoolPeriodStatus(business.id, p[0].id));
      showToast('Période créée ✓');
    } catch (err) {
      showToast(err.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const sendReminders = async () => {
    const pid = periods[0]?.id;
    if (!pid) return;
    setLoading(true);
    try {
      const r = await remindSchoolFees(business.id, pid);
      showToast(`${r.reminded ?? 0} rappel(s) envoyé(s)`);
    } catch (err) {
      showToast(err.message ?? 'Rappel impossible');
    } finally {
      setLoading(false);
    }
  };

  const logDelivery = async () => {
    if (!farmerHandle.trim()) return;
    setLoading(true);
    try {
      const handle = farmerHandle.replace(/^@/, '').trim();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      await logCooperativeDelivery(business.id, {
        farmerHandle: handle,
        quantityTons: parseFloat(deliveryTons) || 1,
        periodStart: weekAgo.toISOString(),
        periodEnd: now.toISOString(),
        note: 'Log terrain',
      });
      showToast('Livraison enregistrée ✓');
      setDeliveries(await getCooperativeDeliveries(business.id));
    } catch (err) {
      showToast(err.message ?? 'Log impossible — utilise @handle du paysan');
    } finally {
      setLoading(false);
    }
  };

  if (!business) {
    return (
      <View style={styles.root}>
      <ScreenBackground />
        <SafeAreaView style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Aucun commerce</Text>
          <Text style={styles.emptySub}>Crée un compte business depuis l'inscription.</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(5,8,5,0.03)" size={18} animated={false} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bizName}>{business.name}</Text>
                <Text style={styles.bizMeta}>
                  {TYPE_LABEL[type] ?? 'Commerce'} · {business.kebuId ?? 'KEBU —'}
                </Text>
              </View>
              <PressScale scaleTo={0.9} onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
                <Text style={{ fontSize: 16 }}>🔔</Text>
              </PressScale>
            </View>
            {businesses.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                {businesses.map((b) => (
                  <PressScale key={b.id} scaleTo={0.96} onPress={() => setActiveId(b.id)} style={[styles.bizChip, activeId === b.id && styles.bizChipOn]}>
                    <Text style={[styles.bizChipText, activeId === b.id && styles.bizChipTextOn]}>{b.name}</Text>
                  </PressScale>
                ))}
              </ScrollView>
            ) : null}
            <Text style={styles.balance}>{formatAmount(balance)} F</Text>
            <Text style={styles.balanceLabel}>Solde du commerce</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {tabsForType().map((t) => (
              <TabPill key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
            ))}
          </ScrollView>

          {loading ? <ActivityIndicator color={colors.flagGold} style={{ marginVertical: spacing.lg }} /> : null}

          {tab === 'overview' && (
            <View style={styles.panel}>
              <View style={styles.actionsRow}>
                <PressScale scaleTo={0.9} onPress={() => navigation.navigate('Receive')} style={styles.actionBtn}>
                  <Text style={{ fontSize: 20 }}>💳</Text>
                  <Text style={styles.actionLabel}>Recevoir</Text>
                </PressScale>
                <PressScale scaleTo={0.9} onPress={() => navigation.navigate('PayMerchant')} style={styles.actionBtn}>
                  <Text style={{ fontSize: 20 }}>🏪</Text>
                  <Text style={styles.actionLabel}>Encaisser</Text>
                </PressScale>
                <PressScale scaleTo={0.9} onPress={() => setTab(type === 'school' ? 'school' : type === 'cooperative' ? 'coop' : 'payroll')} style={styles.actionBtn}>
                  <Text style={{ fontSize: 20 }}>⚙️</Text>
                  <Text style={styles.actionLabel}>Gérer</Text>
                </PressScale>
              </View>
              <Text style={styles.sectionEyebrow}>Transactions récentes</Text>
              {transactions.slice(0, 5).map((tx) => (
                <View key={tx.key} style={styles.txRow}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={[styles.txAmt, { color: tx.amount > 0 ? colors.flagGold : colors.terracotta }]}>
                    {tx.amount > 0 ? '+' : ''}{formatAmount(tx.amount)} F
                  </Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'payroll' && (
            <View style={styles.panel}>
              <SectionCard title="Ajouter un employé">
                <TextInput style={styles.input} placeholder="@handle K21" placeholderTextColor={'rgba(5,8,5,0.45)'} value={newHandle} onChangeText={setNewHandle} autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Rôle (staff, CEO…)" placeholderTextColor={'rgba(5,8,5,0.45)'} value={newRole} onChangeText={setNewRole} />
                <TextInput style={styles.input} placeholder="Salaire XOF" placeholderTextColor={'rgba(5,8,5,0.45)'} keyboardType="number-pad" value={newPay} onChangeText={setNewPay} />
                <GlowButton label="Ajouter" onPress={addEmployee} disabled={loading} />
              </SectionCard>
              <SectionCard title={`Équipe (${employees.length})`}>
                {employees.map((emp) => (
                  <View key={emp.id} style={styles.listRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{emp.user?.name ?? emp.user?.handle}</Text>
                      <Text style={styles.rowSub}>{emp.jobTitle} · {formatAmount(emp.payAmount)} F</Text>
                    </View>
                    <PressScale scaleTo={0.95} onPress={() => payEmployee(emp)} style={styles.payChip}>
                      <Text style={styles.payChipText}>Payer</Text>
                    </PressScale>
                  </View>
                ))}
              </SectionCard>
            </View>
          )}

          {tab === 'school' && (
            <View style={styles.panel}>
              <SectionCard title="Inscrire un élève">
                <TextInput style={styles.input} placeholder="Nom de l'enfant" placeholderTextColor={'rgba(5,8,5,0.45)'} value={newStudentName} onChangeText={setNewStudentName} />
                <TextInput style={styles.input} placeholder="@handle du parent" placeholderTextColor={'rgba(5,8,5,0.45)'} value={newParentHandle} onChangeText={setNewParentHandle} autoCapitalize="none" />
                <GlowButton label="Inscrire" onPress={enrollStudent} disabled={loading} />
              </SectionCard>
              <SectionCard title="Frais mensuels">
                <TextInput style={styles.input} placeholder="Ex: Mars 2026" placeholderTextColor={'rgba(5,8,5,0.45)'} value={periodLabel} onChangeText={setPeriodLabel} />
                <TextInput style={styles.input} placeholder="Montant XOF" placeholderTextColor={'rgba(5,8,5,0.45)'} keyboardType="number-pad" value={periodAmount} onChangeText={setPeriodAmount} />
                <GlowButton label="Ouvrir la période" onPress={openPeriod} disabled={loading} />
                {periods[0] ? (
                  <>
                    <GlowButton label="Rappeler les impayés" onPress={sendReminders} disabled={loading} />
                    {periodStatus ? (
                      <Text style={styles.rowSub}>
                        Payé: {periodStatus.summary?.paidCount ?? 0} · Impayé: {periodStatus.summary?.unpaidCount ?? 0}
                      </Text>
                    ) : null}
                  </>
                ) : null}
              </SectionCard>
              <SectionCard title={`Élèves (${students.length})`}>
                {students.map((s) => (
                  <Text key={s.id} style={styles.rowTitle}>{s.studentName} · parent @{s.parent?.handle}</Text>
                ))}
              </SectionCard>
            </View>
          )}

          {tab === 'coop' && (
            <View style={styles.panel}>
              <SectionCard title="Log livraison (offline OK)">
                <TextInput style={styles.input} placeholder="ID ou @handle paysan" placeholderTextColor={'rgba(5,8,5,0.45)'} value={farmerHandle} onChangeText={setFarmerHandle} />
                <TextInput style={styles.input} placeholder="Tonnes" placeholderTextColor={'rgba(5,8,5,0.45)'} keyboardType="decimal-pad" value={deliveryTons} onChangeText={setDeliveryTons} />
                <GlowButton label="Enregistrer" onPress={logDelivery} disabled={loading} />
              </SectionCard>
              <SectionCard title="Livraisons">
                {deliveries.map((d) => (
                  <View key={d.id} style={styles.listRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{d.farmer?.name ?? d.farmerUserId}</Text>
                      <Text style={styles.rowSub}>{d.quantityTons}t · {d.status}</Text>
                    </View>
                    {d.status === 'pending' ? (
                      <PressScale
                        scaleTo={0.95}
                        onPress={async () => {
                          await verifyCooperativeDelivery(business.id, d.id, { approved: true });
                          setDeliveries(await getCooperativeDeliveries(business.id));
                          showToast('Vérifié ✓');
                        }}
                        style={styles.payChip}
                      >
                        <Text style={styles.payChipText}>OK</Text>
                      </PressScale>
                    ) : null}
                  </View>
                ))}
              </SectionCard>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  emptyTitle: { fontFamily: fontFamily.displayBold, fontSize: 18, color: colors.ink },
  emptySub: { fontSize: 12, color: 'rgba(5,8,5,0.5)', marginTop: spacing.sm, textAlign: 'center' },
  hero: { padding: spacing.xxl, backgroundColor: colors.goldA10, borderBottomWidth: 1, borderBottomColor: colors.goldA20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  bizName: { fontFamily: fontFamily.displayBold, fontSize: 16, color: colors.ink },
  bizMeta: { fontSize: 11, color: 'rgba(5,8,5,0.5)', marginTop: 2 },
  notifBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  bizChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.round, backgroundColor: 'rgba(255,255,255,0.7)', marginRight: spacing.sm },
  bizChipOn: { backgroundColor: colors.goldA20 },
  bizChipText: { fontSize: 11, color: 'rgba(5,8,5,0.55)' },
  bizChipTextOn: { color: colors.goldDark, fontWeight: '700' },
  balance: { fontFamily: fontFamily.displayBlack, fontSize: 36, color: colors.goldDark, letterSpacing: -1 },
  balanceLabel: { fontSize: 11, color: 'rgba(5,8,5,0.45)' },
  tabRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.sm },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.round, backgroundColor: 'rgba(255,255,255,0.7)', marginRight: spacing.sm },
  tabOn: { backgroundColor: colors.goldA20 },
  tabText: { fontSize: 11, fontWeight: '700', color: 'rgba(5,8,5,0.5)' },
  tabTextOn: { color: colors.goldDark },
  panel: { paddingHorizontal: spacing.xxl, gap: spacing.lg },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  actionBtn: { alignItems: 'center', gap: spacing.xs },
  actionLabel: { fontSize: 9, color: 'rgba(5,8,5,0.55)', fontWeight: '700' },
  sectionEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(5,8,5,0.45)', textTransform: 'uppercase', marginBottom: spacing.sm },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(5,8,5,0.07)' },
  txTitle: { fontSize: 12, color: colors.ink },
  txAmt: { fontFamily: fontFamily.bodyBold, fontSize: 12 },
  card: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(5,8,5,0.08)', padding: spacing.lg, gap: spacing.sm },
  cardTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.goldDark, marginBottom: spacing.xs },
  input: { height: 44, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.09)', paddingHorizontal: spacing.lg, color: colors.ink, fontSize: 13 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(5,8,5,0.07)' },
  rowTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.ink },
  rowSub: { fontSize: 10, color: 'rgba(5,8,5,0.5)', marginTop: 2 },
  payChip: { backgroundColor: colors.greenA12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  payChipText: { fontSize: 10, fontWeight: '800', color: colors.greenDark },
});
