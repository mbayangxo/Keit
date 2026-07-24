/** Expo config — embeds API URL so the phone app always reaches production. */
export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://keit-six.vercel.app',
  },
});
