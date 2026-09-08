import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius } from '../theme';

export default function MbooloLazyMedia({
  uri,
  lowData,
  style,
  isGif,
  onPress,
  children,
}) {
  const [loaded, setLoaded] = useState(!lowData);

  if (!uri) return null;

  if (!lowData) {
    return children ?? (
      <Image source={{ uri }} style={style} resizeMode="cover" />
    );
  }

  if (!loaded) {
    return (
      <Pressable onPress={() => setLoaded(true)} style={[style, styles.placeholder]}>
        <Text style={styles.placeholderIcon}>{isGif ? 'GIF' : '📷'}</Text>
        <Text style={styles.placeholderHint}>Appuyer pour charger</Text>
      </Pressable>
    );
  }

  return children ?? (
    <Image source={{ uri }} style={style} resizeMode="cover" onLoad={() => setLoaded(true)} />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.mboolo.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  placeholderIcon: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.mboolo.ink2 },
  placeholderHint: { fontSize: 10, color: colors.mboolo.ink3, marginTop: 4 },
});
