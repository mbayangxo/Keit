import { colors, fontFamily, radius, spacing } from './index';

/** Short alias for onboarding palette (orange + ink + green only). */
export const ob = colors.onboarding;

/** Common onboarding field / card styles on light orange bg. */
export const onboardingUi = {
  root: { flex: 1, backgroundColor: ob.bg },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: ob.orangeSoft,
    borderWidth: 1,
    borderColor: ob.orangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 14, color: ob.ink },
  headTitle: { fontFamily: fontFamily.displayBold, fontSize: 14, color: ob.ink },
  headline: {
    fontFamily: fontFamily.displayBlack,
    fontSize: 22,
    letterSpacing: -0.6,
    lineHeight: 27,
    color: ob.ink,
    marginBottom: spacing.sm,
  },
  accent: { color: ob.green },
  sub: { fontSize: 12, color: ob.muted, lineHeight: 18 },
  field: {
    backgroundColor: ob.surface,
    borderWidth: 1.5,
    borderColor: ob.border,
    color: ob.ink,
  },
  fieldFilled: { borderColor: ob.greenBorder },
  stepTrack: { backgroundColor: ob.orangeSoft },
  stepLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: ob.faint, textTransform: 'uppercase' },
  row: {
    backgroundColor: ob.surface,
    borderWidth: 1,
    borderColor: ob.border,
  },
  rowSelected: { backgroundColor: ob.greenSoft, borderColor: ob.greenBorder },
  searchInput: {
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: ob.surface,
    borderWidth: 1.5,
    borderColor: ob.border,
    paddingHorizontal: spacing.xxxl,
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13,
    color: ob.ink,
  },
};
