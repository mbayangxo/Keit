import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import GlowButton from '../components/GlowButton';
import { useToast } from '../components/Toast';
import {
  getMyDistributionBrand,
  registerDistributionBrand,
  getTradeAccounts,
  upsertTradeAccount,
  getSupplierTradeInvoices,
  getSupplierReceivables,
} from '../lib/api-client';
import { formatKori } from '../lib/kori.js';
import { colors, fontFamily, radius, spacing, type } from '../theme';

const DEFAULT_PRODUCTS = [
  {
    title: 'Granulés volaille 50 kg',
    description: 'Aliment complet pour élevage avicole',
    price: 45000,
    b2bPrice: 42000,
    b2bMinQty: 2,
    unitLabel: 'sac',
    saleChannel: 'both',
    category: 'agro',
    inventory: 100,
  },
  {
    title: 'Beurre de cacahuète 500 g',
    description: '100% arachide — vente détail',
    price: 2500,
    unitLabel: 'pot',
    saleChannel: 'b2c',
    category: 'agro',
    inventory: 200,
  },
  {
    title: 'Carton beurre de cacahuète x12',
    description: 'Pour marchands et épiceries',
    price: 24000,
    b2bPrice: 21000,
    b2bMinQty: 1,
    unitLabel: 'carton',
    saleChannel: 'b2b',
    category: 'agro',
    inventory: 80,
  },
];

function TabPill({ label, active, onPress }) {
  return (
    <PressScale scaleTo={0.96} onPress={onPress} style={[styles.tab, active && styles.tabOn]}>
      <Text style={[styles.tabText, active && styles.tabTextOn]}>{label}</Text>
    </PressScale>
  );
}

export default function DistributionHubScreen({ navigation }) {
  const showToast = useToast();
  const [tab, setTab] = useState('brand');
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState(null);
  const [brandName, setBrandName] = useState('K21 Agro');
  const [registering, setRegistering] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receivables, setReceivables] = useState(null);
  const [buyerHandle, setBuyerHandle] = useState('');
  const [buyerLabel, setBuyerLabel] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('net30');
  const [creditLimit, setCreditLimit] = useState('500000');
  const [codEnabled, setCodEnabled] = useState(true);
  const [trustTier, setTrustTier] = useState('trusted');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyDistributionBrand();
      const b = res.brand ?? null;
      setBrand(b);
      if (b?.id) {
        const [acc, inv, rec] = await Promise.all([
          getTradeAccounts(b.id),
          getSupplierTradeInvoices(b.id, 'open'),
          getSupplierReceivables(b.id).catch(() => null),
        ]);
        setAccounts(acc.accounts ?? []);
        setInvoices(inv.invoices ?? []);
        setReceivables(rec);
      }
    } catch (err) {
      showToast(err.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const registerBrand = async () => {
    setRegistering(true);
    try {
      await registerDistributionBrand({
        name: brandName.trim() || 'K21 Agro',
        category: 'k21',
        description: 'Distribution K21 — agro & épicerie',
        products: DEFAULT_PRODUCTS,
      });
      showToast('Marque enregistrée ✓');
      await load();
      setTab('catalog');
    } catch (err) {
      showToast(err.message ?? 'Enregistrement impossible');
    } finally {
      setRegistering(false);
    }
  };

  const addTradeAccount = async () => {
    if (!brand?.id || !buyerHandle.trim()) {
      showToast('@handle requis');
      return;
    }
    try {
      await upsertTradeAccount(brand.id, {
        buyerHandle: buyerHandle.trim(),
        buyerLabel: buyerLabel.trim() || undefined,
        buyerType: 'merchant',
        paymentTerm,
        creditLimitKori: Number(creditLimit.replace(/\D/g, '')) || 0,
        codEnabled,
        trustTier,
        codLimitKori: Number(creditLimit.replace(/\D/g, '')) || 50000,
      });
      showToast('Client B2B ajouté ✓');
      setBuyerHandle('');
      setBuyerLabel('');
      await load();
    } catch (err) {
      showToast(err.message ?? 'Erreur');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 16 }}>←</Text>
          </PressScale>
          <Text style={styles.title}>Distribution K21</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          <TabPill label="Marque" active={tab === 'brand'} onPress={() => setTab('brand')} />
          {brand ? (
            <>
              <TabPill label="Catalogue" active={tab === 'catalog'} onPress={() => setTab('catalog')} />
              <TabPill label="Clients B2B" active={tab === 'b2b'} onPress={() => setTab('b2b')} />
              <TabPill label="Factures" active={tab === 'invoices'} onPress={() => setTab('invoices')} />
              <TabPill label="Créances" active={tab === 'receivables'} onPress={() => setTab('receivables')} />
              <TabPill label="Ops" active={tab === 'ops'} onPress={() => setTab('ops')} />
            </>
          ) : null}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={colors.green} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            {tab === 'brand' && !brand ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Enregistrer ta marque</Text>
                <Text style={styles.hint}>
                  Crée ta marque K21 (granulés, beurre de cacahuète, etc.) avec catalogue B2B + B2C et paiement KEBU.
                </Text>
                <TextInput
                  style={styles.input}
                  value={brandName}
                  onChangeText={setBrandName}
                  placeholder="Nom de la marque"
                  placeholderTextColor="rgba(5,8,5,0.4)"
                />
                <GlowButton label={registering ? 'Création…' : 'Créer la marque + produits'} onPress={registerBrand} disabled={registering} />
              </View>
            ) : null}

            {tab === 'brand' && brand ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{brand.name}</Text>
                <Text style={styles.meta}>KEBU {brand.kebuId}</Text>
                <Text style={styles.meta}>{brand.productCount} produits · {brand.orderCount} commandes</Text>
                <Text style={styles.meta}>Solde KEBU {formatKori(brand.kebuBalance ?? 0)}</Text>
              </View>
            ) : null}

            {tab === 'catalog' && brand ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Catalogue & prix</Text>
                <GlowButton
                  label="Gérer produits B2B/B2C"
                  onPress={() =>
                    navigation.navigate('MerchantCatalog', { businessId: brand.id, brandMode: true })
                  }
                />
                <PressScale
                  scaleTo={0.98}
                  style={styles.linkRow}
                  onPress={() => navigation.navigate('Marche', { highlightBrandId: brand.id })}
                >
                  <Text style={styles.linkText}>Voir la boutique publique →</Text>
                </PressScale>
              </View>
            ) : null}

            {tab === 'b2b' && brand ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Comptes clients B2B</Text>
                <TextInput style={styles.input} placeholder="@handle client" value={buyerHandle} onChangeText={setBuyerHandle} placeholderTextColor="rgba(5,8,5,0.4)" />
                <TextInput style={styles.input} placeholder="Nom ferme / magasin" value={buyerLabel} onChangeText={setBuyerLabel} placeholderTextColor="rgba(5,8,5,0.4)" />
                <View style={styles.termRow}>
                  {['immediate', 'net15', 'net30', 'monthly'].map((t) => (
                    <PressScale key={t} scaleTo={0.95} onPress={() => setPaymentTerm(t)} style={[styles.termChip, paymentTerm === t && styles.termChipOn]}>
                      <Text style={styles.termText}>{t}</Text>
                    </PressScale>
                  ))}
                </View>
                <TextInput style={styles.input} placeholder="Limite crédit (Kori)" value={creditLimit} onChangeText={setCreditLimit} keyboardType="number-pad" placeholderTextColor="rgba(5,8,5,0.4)" />
                <View style={styles.termRow}>
                  {['new', 'trusted', 'partner'].map((t) => (
                    <PressScale key={t} scaleTo={0.95} onPress={() => setTrustTier(t)} style={[styles.termChip, trustTier === t && styles.termChipOn]}>
                      <Text style={styles.termText}>{t}</Text>
                    </PressScale>
                  ))}
                </View>
                <PressScale scaleTo={0.98} onPress={() => setCodEnabled((v) => !v)} style={styles.linkRow}>
                  <Text style={styles.linkText}>{codEnabled ? '✓' : '○'} Paiement à la livraison autorisé</Text>
                </PressScale>
                <GlowButton label="Ajouter client" onPress={addTradeAccount} />
                {accounts.map((a) => (
                  <View key={a.id} style={styles.listRow}>
                    <Text style={styles.listTitle}>{a.buyerLabel ?? a.buyer?.handle}</Text>
                    <Text style={styles.listMeta}>{a.paymentTerm} · limite {a.creditLimitFormatted}{a.codEnabled ? ' · COD' : ''}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {tab === 'invoices' && brand ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Factures ouvertes</Text>
                <PressScale scaleTo={0.98} style={styles.linkRow} onPress={() => navigation.navigate('TradeInvoices')}>
                  <Text style={styles.linkText}>Mes factures à payer (acheteur) →</Text>
                </PressScale>
                {invoices.length === 0 ? (
                  <Text style={styles.hint}>Aucune facture ouverte.</Text>
                ) : (
                  invoices.map((inv) => (
                    <View key={inv.id} style={styles.listRow}>
                      <Text style={styles.listTitle}>{inv.reference}</Text>
                      <Text style={styles.listMeta}>
                        {inv.amountFormatted} · échéance {new Date(inv.dueAt).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ) : null}

            {tab === 'receivables' && brand ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Créances clients</Text>
                <Text style={styles.meta}>
                  Total à recevoir : {receivables?.totalReceivableFormatted ?? formatKori(0)} ·{' '}
                  {receivables?.buyerCount ?? 0} client(s)
                </Text>
                {(receivables?.buyers ?? []).length === 0 ? (
                  <Text style={styles.hint}>Aucune créance ouverte.</Text>
                ) : (
                  receivables.buyers.map((b) => (
                    <View key={`${b.buyerUserId}-${b.buyerBusinessId ?? 'p'}`} style={styles.listRow}>
                      <Text style={styles.listTitle}>{b.label}</Text>
                      <Text style={styles.listMeta}>
                        {b.totalOwedFormatted}
                        {b.openInvoiceCount ? ` · ${b.openInvoiceCount} fact.` : ''}
                        {b.pendingCodCount ? ` · ${b.pendingCodCount} COD` : ''}
                      </Text>
                      {b.invoiceBalance > 0 ? (
                        <Text style={styles.listMeta}>Factures : {b.invoiceBalanceFormatted}</Text>
                      ) : null}
                      {b.codBalance > 0 ? (
                        <Text style={styles.listMeta}>COD en cours : {b.codBalanceFormatted}</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            ) : null}

            {tab === 'ops' && brand ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Opérations</Text>
                <GlowButton
                  label="Commandes reçues"
                  onPress={() => navigation.navigate('MerchantOrders', { businessId: brand.id, mode: 'merchant' })}
                />
                <GlowButton
                  label="Paie employés"
                  onPress={() => navigation.navigate('BusinessMain', { businessId: brand.id, tab: 'payroll' })}
                />
                <GlowButton label="Livraisons (Mouvement)" onPress={() => navigation.navigate('Movement')} />
                <GlowButton label="Analytics" onPress={() => navigation.navigate('MerchantAnalytics', { businessId: brand.id })} />
              </View>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.huge },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.appCanvas.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 20, color: colors.ink },
  tabs: { paddingHorizontal: spacing.huge, gap: spacing.sm, paddingBottom: spacing.md },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.6)' },
  tabOn: { backgroundColor: colors.greenA12 },
  tabText: { fontSize: 11, fontWeight: '700', color: 'rgba(5,8,5,0.55)' },
  tabTextOn: { color: colors.greenDark },
  body: { padding: spacing.huge, gap: spacing.lg, paddingBottom: 80 },
  card: { backgroundColor: colors.appCanvas.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.appCanvas.border },
  cardTitle: { fontFamily: fontFamily.bodyBold, fontSize: 15, color: colors.ink },
  hint: { ...type.bodySmall, color: 'rgba(5,8,5,0.55)' },
  meta: { ...type.caption, color: 'rgba(5,8,5,0.55)' },
  input: { borderWidth: 1, borderColor: colors.appCanvas.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.ink, backgroundColor: '#fff' },
  linkRow: { paddingVertical: spacing.sm },
  linkText: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.greenDark },
  termRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  termChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: 'rgba(5,8,5,0.06)' },
  termChipOn: { backgroundColor: colors.goldA15 },
  termText: { fontSize: 10, fontWeight: '700', color: colors.ink },
  listRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.appCanvas.border },
  listTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink },
  listMeta: { ...type.caption, color: 'rgba(5,8,5,0.5)', marginTop: 2 },
});
