import { useEffect, useState } from 'react';
import GiftCardReveal from '../components/GiftCardReveal';
import { getTransactions } from '../lib/api-client';
import { formatKori } from '../lib/kori.js';

/** Opens a gift card reveal for a receive ledger reference. */
export default function GiftRevealScreen({ navigation, route }) {
  const { reference, amount, senderLabel, note, theme } = route.params ?? {};
  const [giftTheme, setGiftTheme] = useState(theme ?? null);
  const [meta, setMeta] = useState({ amount, senderLabel, note });

  useEffect(() => {
    if (giftTheme || !reference) return;
    getTransactions(30)
      .then((rows) => {
        const hit = (Array.isArray(rows) ? rows : []).find((r) => r.reference === reference || r.reference === `${reference}-R`);
        if (hit?.giftCardTheme) {
          setGiftTheme(hit.giftCardTheme);
          setMeta({
            amount: Math.abs(hit.amount),
            senderLabel: hit.counterpartyName ?? hit.counterpartyHandle,
            note: hit.note,
          });
        } else {
          navigation.goBack();
        }
      })
      .catch(() => navigation.goBack());
  }, [reference, giftTheme, navigation]);

  return (
    <GiftCardReveal
      visible={Boolean(giftTheme)}
      theme={giftTheme}
      amountLabel={formatKori(meta.amount ?? 0)}
      senderLabel={meta.senderLabel}
      note={meta.note}
      onClose={() => navigation.goBack()}
    />
  );
}
