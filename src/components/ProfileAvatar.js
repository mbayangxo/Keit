import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../theme';

export default function ProfileAvatar({
  emoji,
  photoUrl,
  size = 68,
  style,
  textStyle,
  initial,
}) {
  const radius = size / 2;
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[styles.photo, { width: size, height: size, borderRadius: radius }, style]}
      />
    );
  }

  if (initial) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }, style]}>
        <Text style={[styles.initial, { fontSize: size * 0.38 }, textStyle]}>{initial}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }, style]}>
      {emoji && emoji !== '👤' ? (
        <Text style={[{ fontSize: size * 0.44 }, textStyle]}>{emoji}</Text>
      ) : (
        <Text style={[styles.at, { fontSize: size * 0.34 }, textStyle]}>@</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 3,
    borderColor: 'rgba(232,92,26,0.4)',
  },
  fallback: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 3,
    borderColor: 'rgba(232,92,26,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fontFamily.displayBlack,
    color: colors.ink,
  },
  at: {
    fontFamily: fontFamily.displayBlack,
    color: colors.greenDark,
  },
});
