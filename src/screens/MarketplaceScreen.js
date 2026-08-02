import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackground from '../components/ScreenBackground';
import FeatureTile from '../components/FeatureTile';
import { usePlatformFeatures } from '../lib/platform-features';
import { navigateFromRoot } from '../lib/root-navigation';
import { colors, fontFamily, spacing, type } from '../theme';

const SECTIONS = [
  {
    key: 'transport',
    label: 'Transport & livraison',
    tiles: [
      {
        key: 'movement',
        icon: '🛵',
        title: 'Mouvement',
        subtitle: 'Courses, livraison, chauffeur',
        route: 'Movement',
        feature: ['marketplace', 'movement'],
      },
      {
        key: 'worker',
        icon: '👷',
        title: 'Prestataires',
        subtitle: 'Profils vérifiés',
        route: 'Movement',
        feature: ['marketplace', 'movement'],
      },
    ],
  },
  {
    key: 'commerce',
    label: 'Manger & acheter',
    tiles: [
      {
        key: 'marche',
        icon: '🥬',
        title: 'Marché',
        subtitle: 'Cherche un produit · marchés proches',
        stack: 'Marche',
        feature: ['marketplace', 'delivery'],
      },
      {
        key: 'hubparcel',
        icon: '📦',
        title: 'Point K21',
        subtitle: 'Colis USA · Nigeria · CI → retrait ou livraison',
        stack: 'HubParcel',
        feature: ['marketplace', 'delivery'],
      },
      {
        key: 'eat',
        icon: '🍖',
        title: 'Restaurants',
        subtitle: 'Commander · payer en C',
        stack: 'Discover',
        stackParams: { initialTab: 'Eat' },
        feature: ['marketplace', 'delivery'],
      },
      {
        key: 'deals',
        icon: '⚡',
        title: 'Offres flash',
        subtitle: 'Promos du moment',
        stack: 'Discover',
        stackParams: { initialTab: 'Eat' },
        feature: ['marketplace', 'delivery'],
      },
      {
        key: 'nulekk',
        icon: '🍚',
        title: 'Ñu Lekk',
        subtitle: 'Repas communautaires',
        route: 'NuLekk',
        soon: 'nuLekk',
      },
      {
        key: 'seller',
        icon: '🛍️',
        title: 'Boutiques',
        subtitle: 'Vendeurs K21',
        stack: 'Discover',
        stackParams: { initialTab: 'Gigs' },
        feature: ['marketplace', 'seller'],
      },
    ],
  },
  {
    key: 'b2b',
    label: 'Commerce pro',
    tiles: [
      {
        key: 'distribution',
        icon: '📦',
        title: 'Distribution B2B',
        subtitle: 'Gros · factures · marques',
        stack: 'DistributionHub',
        feature: ['marketplace', 'delivery'],
      },
      {
        key: 'invoices',
        icon: '🧾',
        title: 'Factures B2B',
        subtitle: 'Payer tes fournisseurs',
        stack: 'TradeInvoices',
        feature: ['marketplace', 'delivery'],
      },
      {
        key: 'alerts',
        icon: '📡',
        title: 'Alertes région',
        subtitle: 'Infos Dakar · Cayor',
        stack: 'Trending',
        stackParams: { initialTab: 'alerts' },
        feature: ['marketplace', 'delivery'],
      },
    ],
  },
  {
    key: 'pay',
    label: 'Payer un marchand',
    tiles: [
      {
        key: 'merchant',
        icon: '🏪',
        title: 'Fey',
        subtitle: 'QR marchand',
        route: 'PayMerchant',
        feature: ['marketplace', 'merchantPay'],
      },
      {
        key: 'scan',
        icon: '📷',
        title: 'Scanner',
        subtitle: 'QR · code',
        route: 'QrScan',
        feature: ['wallet', 'send'],
      },
    ],
  },
];

export default function MarketplaceScreen({ navigation }) {
  const { feature, comingSoon } = usePlatformFeatures();

  const openTile = (tile) => {
    if (tile.soon && comingSoon(tile.soon)) {
      navigation.navigate('Info', { title: tile.title, icon: tile.icon });
      return;
    }
    if (tile.route) {
      navigateFromRoot(navigation, tile.route);
      return;
    }
    if (tile.stack) {
      navigation.navigate(tile.stack, tile.stackParams);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>K21</Text>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>Tout ce que tu paies — livraison, courses, billets, marchands.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {SECTIONS.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <View style={styles.grid}>
                {section.tiles.map((tile) => {
                  const enabled = tile.feature ? feature(...tile.feature) : !tile.soon;
                  const soon = tile.soon ? comingSoon(tile.soon) : false;
                  return (
                    <FeatureTile
                      key={tile.key}
                      icon={tile.icon}
                      title={tile.title}
                      subtitle={tile.subtitle}
                      disabled={!enabled && !soon}
                      soon={soon}
                      onPress={() => openTile(tile)}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
  header: { paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.lg, gap: spacing.xs },
  eyebrow: { ...type.eyebrow, color: colors.greenDark },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 20, color: colors.ink, letterSpacing: -0.5 },
  subtitle: { ...type.bodySmall, color: 'rgba(5,8,5,0.55)', lineHeight: 18, maxWidth: 320 },
  body: { paddingHorizontal: spacing.huge, paddingBottom: 88, gap: spacing.xxl },
  section: { gap: spacing.md },
  sectionLabel: { ...type.eyebrow, color: 'rgba(5,8,5,0.45)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
});
