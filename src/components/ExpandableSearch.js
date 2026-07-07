import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import PressScale from './PressScale';
import { fontFamily, radius, spacing } from '../theme';
import { ob } from '../theme/onboarding';

/** Tap 🔍 to expand into a full search bar; ✕ collapses it. */
export default function ExpandableSearch({ value, onChangeText, placeholder, placeholderTextColor = ob.faint }) {
  const [open, setOpen] = useState(false);
  const showField = open || value.length > 0;

  if (!showField) {
    return (
      <PressScale
        scaleTo={0.92}
        onPress={() => setOpen(true)}
        style={styles.iconBtn}
      >
        <Text style={{ fontSize: 18 }}>🔍</Text>
      </PressScale>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          value={value}
          onChangeText={onChangeText}
          autoFocus={open}
          onBlur={() => {
            if (!value.length) setOpen(false);
          }}
        />
      </View>
      <PressScale
        scaleTo={0.92}
        onPress={() => {
          onChangeText('');
          setOpen(false);
        }}
        style={styles.closeBtn}
      >
        <Text style={styles.closeText}>✕</Text>
      </PressScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, maxWidth: 220 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: ob.surface,
    borderWidth: 1.5,
    borderColor: ob.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: ob.surface,
    borderWidth: 1.5,
    borderColor: ob.greenBorder,
    paddingHorizontal: spacing.lg,
  },
  icon: { fontSize: 14, opacity: 0.5 },
  input: { flex: 1, fontFamily: fontFamily.bodyRegular, fontSize: 13, color: ob.ink, padding: 0 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: ob.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 12, color: ob.muted, fontWeight: '700' },
});
