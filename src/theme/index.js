// K21 design system — extracted from the locked design brief (§03) and the
// HTML/CSS prototypes (k21completeredesign.html, k21remainingflows.html,
// k21mboolobright.html, k21logoalive.html). Values are copied 1:1, not
// approximated — do not "round" a color or spacing value found here.

export const colors = {
  // ── Core (brief §03 — locked forever) ──
  ink: '#050805',        // app background, near-black — NEVER white on payment/Rect screens
  green: '#1af060',      // --G — primary accent
  greenDark: '#0fbc48',  // --Gd
  gold: '#f7b731',       // --Y — secondary
  goldDark: '#e8920a',   // --Yd
  orange: '#ff6422',     // --O — tertiary
  rectRed: '#e0364a',    // --R — Rect products ONLY, never used elsewhere

  // ── General UI accent red / gold (Senegal flag derivatives used across
  //    prototypes for notifications, live dots, trending, flag stripes) ──
  flagGreen: '#1af060',  // --SG / .fg (same value as green — single source)
  flagGold: '#fad836',   // --SY — badges, poll leading state, chart #2
  flagRed: '#e8192c',    // --SR — notif dot, live indicators, trending #1

  // ── Terracotta (Mboolo brand color inside the dark app shell) ──
  terracotta: '#e85c1a',
  terracottaDark: '#c44010',
  terracottaLight: '#ff8c52',

  white: '#ffffff',
  black: '#000000',

  // White-opacity overlay scale used everywhere for borders/dividers/text
  // on the dark #050805 base (--w04 … --w85 in the prototypes)
  whiteA04: 'rgba(255,255,255,0.04)',
  whiteA06: 'rgba(255,255,255,0.06)',
  whiteA08: 'rgba(255,255,255,0.08)',
  whiteA10: 'rgba(255,255,255,0.10)',
  whiteA12: 'rgba(255,255,255,0.12)',
  whiteA20: 'rgba(255,255,255,0.20)',
  whiteA25: 'rgba(255,255,255,0.25)',
  whiteA30: 'rgba(255,255,255,0.30)',
  whiteA35: 'rgba(255,255,255,0.35)',
  whiteA40: 'rgba(255,255,255,0.40)',
  whiteA55: 'rgba(255,255,255,0.55)',
  whiteA70: 'rgba(255,255,255,0.70)',
  whiteA85: 'rgba(255,255,255,0.85)',

  // Green-tint overlays (rgba(26,240,96, x)) — cards, borders, glows
  greenA05: 'rgba(26,240,96,0.05)',
  greenA06: 'rgba(26,240,96,0.06)',
  greenA08: 'rgba(26,240,96,0.08)',
  greenA10: 'rgba(26,240,96,0.10)',
  greenA12: 'rgba(26,240,96,0.12)',
  greenA15: 'rgba(26,240,96,0.15)',
  greenA18: 'rgba(26,240,96,0.18)',
  greenA20: 'rgba(26,240,96,0.20)',
  greenA25: 'rgba(26,240,96,0.25)',
  greenA30: 'rgba(26,240,96,0.30)',
  greenA35: 'rgba(26,240,96,0.35)',

  // Gold-tint overlays (rgba(250,216,54, x))
  goldA08: 'rgba(250,216,54,0.08)',
  goldA09: 'rgba(250,216,54,0.09)',
  goldA10: 'rgba(250,216,54,0.10)',
  goldA20: 'rgba(250,216,54,0.20)',

  // Orange-tint overlays (rgba(255,100,34, x))
  orangeA08: 'rgba(255,100,34,0.08)',
  orangeA09: 'rgba(255,100,34,0.09)',
  orangeA10: 'rgba(255,100,34,0.10)',
  orangeA20: 'rgba(255,100,34,0.20)',

  // Terracotta-tint overlays (rgba(232,92,26, x)) — Mboolo pulse card etc.
  terracottaA08: 'rgba(232,92,26,0.08)',
  terracottaA09: 'rgba(232,92,26,0.09)',
  terracottaA10: 'rgba(232,92,26,0.10)',
  terracottaA20: 'rgba(232,92,26,0.20)',
  terracottaA25: 'rgba(232,92,26,0.25)',
  terracottaA45: 'rgba(232,92,26,0.45)',

  // Red-tint overlays (rgba(232,25,44, x))
  redA06: 'rgba(232,25,44,0.06)',
  redA08: 'rgba(232,25,44,0.08)',

  // ── Mboolo Bright palette — warm white world, ONLY inside Mboolo screens ──
  mboolo: {
    bg: '#fff9f4',        // --bg — warm white, paper in sunlight
    bg2: '#fff3e8',       // --bg2
    terra: '#e85c1a',
    terraDark: '#c44010',
    terraLight: '#ff8c52',
    terraPale: '#fff0e6',
    mango: '#ffb347',
    mangoDark: '#e8920a',
    mangoPale: '#fff8e6',
    green: '#1af060',
    greenDark: '#0fbc48',
    greenPale: '#e8fff0',
    red: '#e8192c',
    redPale: '#fff0f1',
    ink: '#1a0e08',       // warm dark text
    ink2: '#5a3a28',      // secondary text
    ink3: '#c4845a',      // muted warm text
    border: 'rgba(232,92,26,0.15)',
    shadow: 'rgba(180,60,10,0.12)',
  },
};

// ── Typography ──
// Display/Headers: Unbounded (700, 900). Body/UI: Outfit (400, 500, 600, 700).
// Family names match the @expo-google-fonts export keys loaded via useFonts.
export const fontFamily = {
  displayBold: 'Unbounded_700Bold',
  displayBlack: 'Unbounded_900Black',
  bodyRegular: 'Outfit_400Regular',
  bodyMedium: 'Outfit_500Medium',
  bodySemiBold: 'Outfit_600SemiBold',
  bodyBold: 'Outfit_700Bold',
};

// Map of every font asset to load with useFonts() — keys are the exact
// react-native font family strings used above.
export const fontsToLoad = {
  Unbounded_700Bold: require('@expo-google-fonts/unbounded/700Bold/Unbounded_700Bold.ttf'),
  Unbounded_900Black: require('@expo-google-fonts/unbounded/900Black/Unbounded_900Black.ttf'),
  Outfit_400Regular: require('@expo-google-fonts/outfit/400Regular/Outfit_400Regular.ttf'),
  Outfit_500Medium: require('@expo-google-fonts/outfit/500Medium/Outfit_500Medium.ttf'),
  Outfit_600SemiBold: require('@expo-google-fonts/outfit/600SemiBold/Outfit_600SemiBold.ttf'),
  Outfit_700Bold: require('@expo-google-fonts/outfit/700Bold/Outfit_700Bold.ttf'),
};

// Font-size / weight presets seen repeatedly across the prototypes, named by
// where they occur so screen code reads like the HTML it was copied from.
export const type = {
  balanceAmount: { fontFamily: fontFamily.displayBlack, fontSize: 44, letterSpacing: -3, lineHeight: 44 }, // .bd-amount
  amountKeypad: { fontFamily: fontFamily.displayBlack, fontSize: 52, letterSpacing: -3, lineHeight: 52 },  // .ah-num
  confirmAmount: { fontFamily: fontFamily.displayBlack, fontSize: 54, letterSpacing: -3, lineHeight: 54 }, // .cs-amount
  wakhnaScore: { fontFamily: fontFamily.displayBlack, fontSize: 28, letterSpacing: -1, lineHeight: 28 },   // .wm-score
  screenTitle: { fontFamily: fontFamily.displayBlack, fontSize: 16, letterSpacing: -0.4 },
  cardTitle: { fontFamily: fontFamily.displayBlack, fontSize: 14 },
  sqValue: { fontFamily: fontFamily.displayBlack, fontSize: 16, letterSpacing: -0.5, lineHeight: 16 },
  buttonLabel: { fontFamily: fontFamily.displayBlack, fontSize: 11, letterSpacing: 0.5 }, // .btn-g
  eyebrow: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }, // .lbl / .as-label
  actionLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9 }, // .ha-label
  body: { fontFamily: fontFamily.bodyRegular, fontSize: 13 },
  bodySmall: { fontFamily: fontFamily.bodyRegular, fontSize: 11 },
  caption: { fontFamily: fontFamily.bodyMedium, fontSize: 10 },
  tiny: { fontFamily: fontFamily.bodyBold, fontSize: 8 },
};

// ── Spacing ── (4px base grid, matches padding values seen: 4,6,8,9,10,12,13,14,16,18,20)
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  xxxl: 16,
  huge: 18,
  giant: 20,
};

// ── Radius ── (from .ha-btn 16, .home-cards items 14-18, .phone 36-38, pills 100)
export const radius = {
  sm: 8,
  md: 11,
  lg: 12,
  xl: 14,
  xxl: 16,
  xxxl: 18,
  round: 999, // pill / circle
};

// ── Shadows / glows ──
// React Native shadow props (iOS) + elevation (Android) approximating the
// CSS box-shadow glow effects used throughout (e.g. .btn-g, .send button).
export const shadow = {
  greenGlow: {
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  greenGlowSoft: {
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 6,
  },
  cardLift: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  phoneFrame: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.9,
    shadowRadius: 72,
    elevation: 20,
  },
};

// ── Animation timing ── (durations in ms, matched to the CSS keyframe durations)
export const motion = {
  instant: 150,   // :active transform scale (.15s)
  fast: 200,      // .tt transition (.2s)
  quick: 250,     // react-pop (.25s)
  base: 280,      // message pop-in (.28s)
  medium: 350,    // notif-item slide-in (.35s)
  entrance: 400,  // card scale-in (.4s)
  reveal: 500,    // success ring pop (.5s)
  count: 1000,    // amount count-up (1s)
  fill: 1200,     // wakhna bar fill (1.2s)
  breatheFast: 800,   // dot-blink (.8s)
  breathe: 2000,      // play-pulse (2s)
  breatheSlow: 2500,  // btn-g glow pulse (2.5s)
  pulse: 3000,        // mboolo-pulse / act-float (3s)
  pulseSlow: 4000,     // rect-glow (4s)
  breatheSlowest: 7000, // hh-breathe hero gradient (7s)
  waxDrift: 28000,      // wax pattern drift (28s)
  easeOutBack: [0.175, 0.885, 0.32, 1.275], // cubic-bezier used for pop-ins
};
