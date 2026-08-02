import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import { useToast } from '../components/Toast';
import { useAppState } from '../state/AppState';
import { coordsFromArrondissement } from '../lib/dakar-coords';
import { getMarketplaceShop, placeMarketplaceOrder } from '../lib/api-client';
import { colors, fontFamily, radius, spacing, type } from '../theme';

function ProductRow({ product, qty, onChangeQty }) {
  return (
    <View style={styles.productRow}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.productImg} />
      ) : (
        <View style={[styles.productImg, styles.productImgPh]}>
          <Text style={{ fontSize: 22 }}>🛒</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.productPrice}>{product.effectivePrice?.toLocaleString('fr-FR')} ₭</Text>
        {product.inventory <= 3 ? (
          <Text style={styles.stockLow}>Plus que {product.inventory}</Text>
        ) : null}
      </View>
      <View style={styles.qtyRow}>
        <PressScale scaleTo={0.9} onPress={() => onChangeQty(Math.max(0, qty - 1))} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>−</Text>
        </PressScale>
        <Text style={styles.qtyVal}>{qty}</Text>
        <PressScale
          scaleTo={0.9}
          onPress={() => onChangeQty(Math.min(product.inventory, qty + 1))}
          style={styles.qtyBtn}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </PressScale>
      </View>
    </View>
  );
}

export default function ShopDetailScreen({ navigation, route }) {
  const businessId = route.params?.businessId;
  const showToast = useToast();
  const { profile } = useAppState();
  const coords = useMemo(
    () => coordsFromArrondissement(profile?.arrondissement?.key),
    [profile?.arrondissement?.key],
  );

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [fulfillment, setFulfillment] = useState('delivery');
  const [dropoffArea, setDropoffArea] = useState(profile?.arrondissement?.name ?? 'Dakar');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await getMarketplaceShop(businessId, { lat: coords.lat, lng: coords.lng });
      setShop(data.shop);
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      showToast(err.message ?? 'Commerce introuvable');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [businessId, coords.lat, coords.lng, navigation, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => ({ productId, quantity })),
    [cart],
  );

  const totalKori = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const p = products.find((x) => x.id === item.productId);
      return sum + (p?.effectivePrice ?? 0) * item.quantity;
    }, 0);
  }, [cartItems, products]);

  const setQty = (productId, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  };

  const submitOrder = async () => {
    if (!cartItems.length) {
      showToast('Ajoute au moins un produit');
      return;
    }
    if (fulfillment === 'delivery' && !dropoffAddress.trim()) {
      showToast('Indique ton adresse de livraison');
      return;
    }
    setSubmitting(true);
    try {
      const result = await placeMarketplaceOrder({
        businessId,
        items: cartItems,
        fulfillmentType: fulfillment,
        dropoff:
          fulfillment === 'delivery'
            ? {
                area: dropoffArea.trim() || 'Dakar',
                address: dropoffAddress.trim(),
                lat: coords.lat,
                lng: coords.lng,
              }
            : undefined,
      });
      setCheckoutOpen(false);
      setCart({});
      const msg =
        fulfillment === 'pickup'
          ? `Commande OK — à retirer chez ${shop?.name}`
          : result.delivery
            ? `Commande OK — livraison ~${result.delivery.deliveryFeeNational?.toLocaleString('fr-FR')} F`
            : 'Commande confirmée ✓';
      showToast(msg);
    } catch (err) {
      showToast(err.message ?? 'Paiement impossible');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <ActivityIndicator color={colors.greenDark} style={{ marginTop: 80 }} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 18 }}>←</Text>
          </PressScale>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{shop?.name}</Text>
            <Text style={styles.meta}>
              {[shop?.arrondissement, shop?.distanceLabel, shop?.address].filter(Boolean).join(' · ')}
            </Text>
            {shop?.statusText ? (
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText} numberOfLines={2}>✦ {shop.statusText}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              qty={cart[p.id] ?? 0}
              onChangeQty={(q) => setQty(p.id, q)}
            />
          ))}
        </ScrollView>

        {cartItems.length > 0 ? (
          <View style={styles.footer}>
            <Text style={styles.footerTotal}>{totalKori.toLocaleString('fr-FR')} ₭</Text>
            <PressScale scaleTo={0.98} onPress={() => setCheckoutOpen(true)} style={styles.checkoutBtn}>
              <Text style={styles.checkoutBtnText}>Commander</Text>
            </PressScale>
          </View>
        ) : null}
      </SafeAreaView>

      <Modal visible={checkoutOpen} animationType="slide" transparent onRequestClose={() => setCheckoutOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Comment récupérer ?</Text>
            <View style={styles.fulfillmentRow}>
              {['delivery', 'pickup'].map((mode) => {
                const active = fulfillment === mode;
                return (
                  <PressScale
                    key={mode}
                    scaleTo={0.97}
                    onPress={() => setFulfillment(mode)}
                    style={[styles.fulfillmentBtn, active && styles.fulfillmentBtnOn]}
                  >
                    <Text style={[styles.fulfillmentText, active && styles.fulfillmentTextOn]}>
                      {mode === 'delivery' ? '🛵 Livraison' : '🏪 Retrait sur place'}
                    </Text>
                  </PressScale>
                );
              })}
            </View>

            {fulfillment === 'delivery' ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sheetLabel}>Quartier</Text>
                <TextInput
                  style={styles.sheetInput}
                  value={dropoffArea}
                  onChangeText={setDropoffArea}
                  placeholder="Ex. Médina"
                  placeholderTextColor={colors.appCanvas.textFaint}
                />
                <Text style={styles.sheetLabel}>Adresse</Text>
                <TextInput
                  style={[styles.sheetInput, { minHeight: 72 }]}
                  value={dropoffAddress}
                  onChangeText={setDropoffAddress}
                  placeholder="Rue, repère, téléphone…"
                  placeholderTextColor={colors.appCanvas.textFaint}
                  multiline
                />
                <Text style={styles.sheetHint}>
                  Un livreur K21 verra la course dans Mouvement. Frais de livraison payés à l’acceptation.
                </Text>
              </View>
            ) : (
              <Text style={styles.sheetHint}>
                Paie maintenant en ₭. Retire ta commande directement chez {shop?.name}.
              </Text>
            )}

            <Text style={styles.sheetTotal}>Total produits : {totalKori.toLocaleString('fr-FR')} ₭</Text>

            <View style={styles.sheetActions}>
              <PressScale scaleTo={0.97} onPress={() => setCheckoutOpen(false)} style={styles.sheetCancel}>
                <Text style={styles.sheetCancelText}>Annuler</Text>
              </PressScale>
              <PressScale
                scaleTo={0.97}
                onPress={submitOrder}
                disabled={submitting}
                style={[styles.sheetConfirm, submitting && { opacity: 0.6 }]}
              >
                <Text style={styles.sheetConfirmText}>{submitting ? '…' : 'Payer en ₭'}</Text>
              </PressScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.appCanvas.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 18, color: colors.ink },
  meta: { ...type.bodySmall, color: 'rgba(5,8,5,0.5)' },
  statusPill: {
    marginTop: spacing.sm, alignSelf: 'flex-start',
    backgroundColor: 'rgba(250,216,54,0.16)', borderWidth: 1, borderColor: 'rgba(232,146,10,0.3)',
    borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: 3,
  },
  statusPillText: { fontFamily: fontFamily.bodyBold, fontSize: 10.5, color: colors.goldDark },
  body: { paddingHorizontal: spacing.huge, paddingBottom: 120, gap: spacing.md },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.appCanvas.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.06)',
  },
  productImg: { width: 64, height: 64, borderRadius: radius.md },
  productImgPh: { backgroundColor: 'rgba(5,8,5,0.05)', alignItems: 'center', justifyContent: 'center' },
  productTitle: { fontFamily: fontFamily.bodySemiBold, color: colors.ink },
  productPrice: { ...type.bodySmall, color: colors.greenDark, marginTop: 2 },
  stockLow: { ...type.caption, color: colors.terracottaDark },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(5,8,5,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, color: colors.ink },
  qtyVal: { minWidth: 20, textAlign: 'center', fontFamily: fontFamily.bodySemiBold },
  footer: {
    position: 'absolute',
    left: spacing.huge,
    right: spacing.huge,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.appCanvas.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
  },
  footerTotal: { flex: 1, fontFamily: fontFamily.displayBlack, fontSize: 18, color: colors.ink },
  checkoutBtn: {
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  checkoutBtnText: { fontFamily: fontFamily.bodySemiBold, color: colors.ink },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetCard: {
    backgroundColor: colors.appCanvas.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.huge,
    gap: spacing.md,
    paddingBottom: spacing.giant,
  },
  sheetTitle: { fontFamily: fontFamily.displayBlack, fontSize: 18, color: colors.ink },
  fulfillmentRow: { flexDirection: 'row', gap: spacing.sm },
  fulfillmentBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.1)',
    alignItems: 'center',
  },
  fulfillmentBtnOn: { backgroundColor: 'rgba(26,240,96,0.12)', borderColor: colors.green },
  fulfillmentText: { ...type.bodySmall, color: 'rgba(5,8,5,0.6)' },
  fulfillmentTextOn: { color: colors.greenDark, fontFamily: fontFamily.bodySemiBold },
  sheetLabel: { ...type.caption, color: 'rgba(5,8,5,0.5)' },
  sheetInput: {
    ...type.body,
    color: colors.ink,
    backgroundColor: colors.appCanvas.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    padding: spacing.md,
  },
  sheetHint: { ...type.bodySmall, color: 'rgba(5,8,5,0.55)', lineHeight: 18 },
  sheetTotal: { fontFamily: fontFamily.bodySemiBold, color: colors.ink },
  sheetActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  sheetCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.1)',
  },
  sheetCancelText: { ...type.body, color: colors.ink },
  sheetConfirm: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.green,
  },
  sheetConfirmText: { fontFamily: fontFamily.bodySemiBold, color: colors.ink },
});
