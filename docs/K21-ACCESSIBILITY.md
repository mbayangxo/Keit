# K21 — Accessibilité & connexions lentes

Réglages dans **Moi → Accessibilité** (persistés sur l'appareil).

## Mode données réduites

- Désactive les animations décoratives (wax pattern, etc.)
- En-tête `X-Low-Data: 1` sur les appels API
- Cache court (45 s) sur les GET
- Timeout plus long (45 s) + 1 retry automatique sur erreur réseau
- Messages d'erreur clairs si la connexion est trop lente

## Grand texte

- Augmente la taille des polices sur les reçus et écrans clés
- Pensé pour les utilisateurs plus âgés

## Vérification simple

- **Tier 1 :** téléphone + code SMS uniquement
- CNI / passeport : optionnel à l'inscription (« Faire ça plus tard »)
- Limites de compte tant que la CNI n'est pas vérifiée

## Reçus & annulation

- Partage WhatsApp en un tap (lien `wa.me` avec texte du reçu)
- Partage Mboolo : ouvre l'onglet Mboolo avec toast pour coller le reçu
- **Annuler** pendant 60 secondes après un envoi ou paiement marchand (barre jaune visible sur l'écran de succès)
- L'annulation côté API est **atomique** — voir `docs/K21-FINANCIAL-SECURITY.md` §1b
