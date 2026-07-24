import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontFamily, radius, spacing } from '../theme';

// Lightweight snackbar for actions that need a "yep, that happened"
// acknowledgement but don't warrant a full screen (share receipt, invite
// sent, code resent) — replaces silent no-op buttons.

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  const showToast = useCallback(
    (text) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMessage(text);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      // Longer messages (error explanations, debug-tagged auth failures)
      // need more than a beat to read — and to screenshot.
      const visibleMs = Math.min(2200 + Math.max(0, String(text).length - 30) * 60, 6000);
      hideTimer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMessage(null));
      }, visibleMs);
    },
    [anim]
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {message ? (
        <SafeAreaView style={styles.wrap} pointerEvents="none">
          <Animated.View
            style={[
              styles.toast,
              {
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            <Text style={styles.text}>{message}</Text>
          </Animated.View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  toast: {
    marginBottom: spacing.giant,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radius.round,
    backgroundColor: '#101410',
    borderWidth: 1,
    borderColor: colors.whiteA12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  text: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
});
