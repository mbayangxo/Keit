import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { getStripeDepositStatus } from '../lib/api-client';

/** After Stripe Checkout redirect (?stripe_deposit=success&ref=…) refresh wallet. */
export function useStripeDepositReturn(navigationRef, ready, { refreshWallet, showToast }) {
  useEffect(() => {
    if (!ready) return undefined;

    const handle = async (url) => {
      if (!url) return;
      let parsed;
      try {
        parsed = new URL(url, Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://k21.app');
      } catch {
        return;
      }
      const status = parsed.searchParams.get('stripe_deposit');
      const ref = parsed.searchParams.get('ref');
      if (!status || !ref) return;

      if (status === 'cancel') {
        showToast?.('Paiement carte annulé');
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
        return;
      }

      if (status === 'success') {
        try {
          const deposit = await getStripeDepositStatus(ref);
          if (deposit.status === 'completed') {
            await refreshWallet?.();
            showToast?.('Dépôt carte reçu — wallet crédité ✓');
          } else {
            showToast?.('Paiement reçu — crédit en cours (quelques secondes)…');
            setTimeout(async () => {
              try {
                const again = await getStripeDepositStatus(ref);
                if (again.status === 'completed') {
                  await refreshWallet?.();
                  showToast?.('Wallet crédité ✓');
                }
              } catch {
                /* webhook may still be pending */
              }
            }, 4000);
          }
        } catch {
          showToast?.('Retour Stripe — vérifie ton solde dans quelques instants');
        }

        const nav = navigationRef.current;
        if (nav) {
          nav.navigate('Main', { screen: 'HomeTab' });
        }
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };

    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handle(window.location.href);
    }
    return () => sub.remove();
  }, [ready, navigationRef, refreshWallet, showToast]);
}
