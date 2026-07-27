import { useAppState } from '../state/AppState';
import { useToast } from '../components/Toast';
import { useInviteDeepLink } from './useInviteDeepLink';
import { useStripeDepositReturn } from './useStripeDepositReturn';

/** Deep links + Stripe return handling (must run inside AppState + Toast providers). */
export default function NavSideEffects({ navigationRef, navReady }) {
  const { refreshWallet } = useAppState();
  const showToast = useToast();
  useInviteDeepLink(navigationRef, navReady);
  useStripeDepositReturn(navigationRef, navReady, { refreshWallet, showToast });
  return null;
}
