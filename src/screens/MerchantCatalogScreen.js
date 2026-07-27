import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { pickProfilePhoto } from '../lib/profile-photo';
import {
  createBusiness,
  createProduct,
  getMyBusinesses,
  getSellerProfile,
  registerSellerProfile,
} from '../lib/api-client';
import { colors, fontFamily, radius, spacing, type } from '../theme';

export default function MerchantCatalogScreen({ navigation }) {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState('10');
  const [category, setCategory] = useState('grocery');
  const [imageUrl, setImageUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, seller] = await Promise.all([
        getMyBusinesses().catch(() => ({ owned: [], member: [] })),
        getSellerProfile().catch(() => ({ profile: null, businesses: [] })),
      ]);
      const owned = mine?.owned ?? seller?.businesses ?? [];
      setBusinesses(owned);
      if (owned[0]?.id) setSelectedBusinessId(owned[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ensureShop = async () => {
    if (selectedBusinessId) return selectedBusinessId;
    try {
      await registerSellerProfile({ shopName: 'Ma boutique', category: 'grocery' });
    } catch {
      /* profile may exist */
    }
    const biz = await createBusiness({
      name: 'Mon marché',
      type: 'merchant',
      category: 'grocery',
      arrondissement: 'medina',
      address: 'Dakar',
      lat: 14.6892,
      lng: -17.4421,
    });
    setBusinesses((prev) => [...prev, biz]);
    setSelectedBusinessId(biz.id);
    return biz.id;
  };

  const pickPhoto = async () => {
    const uri = await pickProfilePhoto();
    if (uri) setImageUrl(uri);
  };

  const submit = async () => {
    const priceNum = parseInt(price.replace(/\D/g, ''), 10);
    const inv = parseInt(inventory.replace(/\D/g, ''), 10);
    if (!title.trim() || !priceNum || priceNum <= 0) {
      showToast('Titre et prix requis');
      return;
    }
    setSubmitting(true);
    try {
      const businessId = await ensureShop();
      await createProduct({
        businessId,
        title: title.trim(),
        price: priceNum,
        inventory: Number.isFinite(inv) ? inv : 10,
        category,
        imageUrl: imageUrl ?? undefined,
      });
      showToast('Produit publié ✓');
      setTitle('');
      setPrice('');
      setImageUrl(null);
    } catch (err) {
      showToast(err.message ?? 'Publication impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 18 }}>←</Text>
          </PressScale>
          <Text style={styles.title}>Mon catalogue</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.greenDark} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Commerce</Text>
            {businesses.length === 0 ? (
              <Text style={styles.hint}>Aucun commerce — le premier produit créera ton marché.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bizRow}>
                {businesses.map((b) => {
                  const active = b.id === selectedBusinessId;
                  return (
                    <PressScale
                      key={b.id}
                      scaleTo={0.97}
                      onPress={() => setSelectedBusinessId(b.id)}
                      style={[styles.bizChip, active && styles.bizChipOn]}
                    >
                      <Text style={[styles.bizChipText, active && styles.bizChipTextOn]}>{b.name}</Text>
                    </PressScale>
                  );
                })}
              </ScrollView>
            )}

            <PressScale scaleTo={0.98} onPress={pickPhoto} style={styles.photoBox}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.photo} />
              ) : (
                <>
                  <Text style={{ fontSize: 32 }}>📷</Text>
                  <Text style={styles.photoHint}>Photo du produit</Text>
                </>
              )}
            </PressScale>

            <Text style={styles.label}>Nom du produit</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex. Riz brisé 1 kg"
              placeholderTextColor={colors.appCanvas.textFaint}
            />

            <Text style={styles.label}>Prix (₭)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              placeholder="500"
              placeholderTextColor={colors.appCanvas.textFaint}
            />

            <Text style={styles.label}>Stock</Text>
            <TextInput
              style={styles.input}
              value={inventory}
              onChangeText={setInventory}
              keyboardType="number-pad"
              placeholderTextColor={colors.appCanvas.textFaint}
            />

            <PressScale
              scaleTo={0.98}
              onPress={submit}
              disabled={submitting}
              style={[styles.submit, submitting && { opacity: 0.6 }]}
            >
              <Text style={styles.submitText}>{submitting ? 'Publication…' : 'Publier le produit'}</Text>
            </PressScale>
          </ScrollView>
        )}
      </SafeAreaView>
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
  title: { fontFamily: fontFamily.displayBlack, fontSize: 20, color: colors.ink },
  body: { paddingHorizontal: spacing.huge, paddingBottom: 80, gap: spacing.md },
  label: { ...type.caption, color: 'rgba(5,8,5,0.5)' },
  hint: { ...type.bodySmall, color: 'rgba(5,8,5,0.55)' },
  bizRow: { gap: spacing.sm },
  bizChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.1)',
  },
  bizChipOn: { backgroundColor: 'rgba(26,240,96,0.12)', borderColor: colors.green },
  bizChipText: { ...type.bodySmall, color: 'rgba(5,8,5,0.6)' },
  bizChipTextOn: { color: colors.greenDark, fontFamily: fontFamily.bodySemiBold },
  photoBox: {
    height: 160,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: spacing.sm,
  },
  photo: { width: '100%', height: '100%' },
  photoHint: { ...type.bodySmall, color: 'rgba(5,8,5,0.5)' },
  input: {
    ...type.body,
    color: colors.ink,
    backgroundColor: colors.appCanvas.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    padding: spacing.md,
  },
  submit: {
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: { fontFamily: fontFamily.bodySemiBold, color: colors.ink },
});
