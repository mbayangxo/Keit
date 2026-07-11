import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import PressScale from './PressScale';
import { geoSearchAddress } from '../lib/api-client';
import { colors, fontFamily, radius, spacing } from '../theme';

/**
 * Real address picker backed by OpenStreetMap (via our server-side Nominatim
 * proxy). Debounced search-as-you-type; selecting a result returns
 * { label, lat, lng } — nothing stored unless the user picks a real place.
 */
export default function AddressSearchInput({ value, onSelect, placeholder = 'Adresse (rue, quartier…)' }) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onChange = (text) => {
    setQuery(text);
    onSelect?.(null);
    clearTimeout(timer.current);
    if (text.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await geoSearchAddress(text.trim());
        setResults(res.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 600);
  };

  const pick = (r) => {
    setQuery(r.label);
    setResults([]);
    setOpen(false);
    onSelect?.({ label: r.label, lat: r.lat, lng: r.lng });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Text style={{ fontSize: 14 }}>📍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={'rgba(5,8,5,0.45)'}
          autoCorrect={false}
        />
        {searching ? <ActivityIndicator size="small" color={colors.green} /> : null}
      </View>
      {open && results.length > 0 ? (
        <View style={styles.dropdown}>
          {results.map((r, i) => (
            <PressScale key={`${r.lat}-${r.lng}-${i}`} scaleTo={0.98} onPress={() => pick(r)} style={styles.option}>
              <Text style={styles.optionText} numberOfLines={2}>{r.label}</Text>
            </PressScale>
          ))}
          <Text style={styles.credit}>Adresses © OpenStreetMap</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(5,8,5,0.1)',
    paddingHorizontal: spacing.lg,
  },
  input: { flex: 1, color: colors.ink, fontSize: 14, height: '100%' },
  dropdown: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.1)',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  option: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(5,8,5,0.06)' },
  optionText: { fontSize: 12, color: colors.ink, lineHeight: 16 },
  credit: { fontSize: 8, color: 'rgba(5,8,5,0.4)', textAlign: 'right', paddingHorizontal: spacing.lg, paddingVertical: 4, fontFamily: fontFamily.bodyMedium },
});
