import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';

/** Block screenshots and screen recording on sensitive screens. */
export function useScreenshotBlock(enabled = true) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return undefined;

    let active = true;
    (async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        active = true;
      } catch {
        /* unsupported platform */
      }
    })();

    return () => {
      if (active) {
        ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      }
    };
  }, [enabled]);
}
