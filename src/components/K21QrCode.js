import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, radius } from '../theme';

/** Web-safe QR — avoids react-native-qrcode-svg (can break Expo web export). */
export default function K21QrCode({ value, size = 200 }) {
  const [matrix, setMatrix] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const data = QRCode.create(String(value), { errorCorrectionLevel: 'M' });
        if (!cancelled) setMatrix(data.modules);
      } catch {
        if (!cancelled) setMatrix(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!value) return null;

  const cell = matrix ? size / matrix.size : 0;

  return (
    <View style={[styles.wrap, { width: size + 24, height: size + 24 }]}>
      {!matrix ? (
        <ActivityIndicator color={colors.green} />
      ) : (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Rect x={0} y={0} width={size} height={size} fill="#ffffff" />
          {matrix.data.map((on, index) => {
            if (!on) return null;
            const row = Math.floor(index / matrix.size);
            const col = index % matrix.size;
            return (
              <Rect
                key={index}
                x={col * cell}
                y={row * cell}
                width={cell}
                height={cell}
                fill={colors.ink}
              />
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 12,
  },
});
