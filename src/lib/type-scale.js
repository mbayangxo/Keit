/** Scale font sizes when large-text accessibility mode is on. */
export function scaleFont(size, largeText) {
  if (!largeText) return size;
  if (size <= 9) return size + 3;
  if (size <= 12) return Math.round(size * 1.28);
  if (size <= 20) return Math.round(size * 1.22);
  return Math.round(size * 1.15);
}

export function scaledType(base, largeText) {
  if (!largeText) return base;
  return {
    ...base,
    fontSize: scaleFont(base.fontSize ?? 13, true),
    lineHeight: base.lineHeight ? scaleFont(base.lineHeight, true) : undefined,
  };
}
