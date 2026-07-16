# K21 — Appels Mboolo avec LiveKit (auto-hébergé, gratuit)

Les appels vocaux et vidéo de Mboolo passent par **LiveKit**, un serveur
WebRTC open source que tu héberges toi-même. **Aucune minute facturée** —
tu paies seulement ton petit serveur (~5–10 $/mois chez Hetzner,
DigitalOcean, Scaleway…).

**Tant que les 3 variables ci-dessous ne sont pas configurées dans Vercel,
l'app affiche honnêtement « Les appels ouvrent bientôt » — rien n'est cassé.**

## Comment ça marche

1. L'app demande un jeton à ton API (`POST /api/calls/token`) — seuls les
   membres de la conversation Mboolo peuvent en avoir un.
2. L'audio/vidéo passe **directement** par ton serveur LiveKit, jamais par
   Vercel. Une conversation = une salle (`mbolo-<id>`).
3. Celui qui appelle « sonne » : un message « 📞 Appel en cours — rejoins ! »
   apparaît dans le chat + une notification, et l'autre personne rejoint en
   tapant dessus.

## Installation (une seule fois, ~30 minutes)

### 1. Loue un petit serveur Linux
N'importe quel VPS à 2 Go de RAM suffit pour commencer (Ubuntu 22+).
Prends une IP publique et pointe un sous-domaine dessus, ex. `calls.k21.app`.

### 2. Installe LiveKit avec le script officiel
```bash
curl -sSL https://get.livekit.io | bash
```
Puis génère la configuration + les clés :
```bash
docker run --rm -it -v $PWD:/output livekit/generate
```
Le générateur te demande ton domaine (`calls.k21.app`) et produit :
- un fichier `livekit.yaml` (avec **API key** et **API secret** dedans)
- un `docker-compose.yaml` prêt à lancer (inclut le HTTPS automatique)

### 3. Démarre le serveur
```bash
docker compose up -d
```
Vérifie : `https://calls.k21.app` doit répondre `OK`.

### 4. Ajoute les 3 variables dans Vercel
Dans **Vercel → Settings → Environment Variables** :

| Variable | Valeur |
|---|---|
| `LIVEKIT_URL` | `wss://calls.k21.app` |
| `LIVEKIT_API_KEY` | la clé API du `livekit.yaml` |
| `LIVEKIT_API_SECRET` | le secret du `livekit.yaml` |

Redéploie, et les boutons 📞 / 🎥 de Mboolo deviennent actifs.

## À savoir

- **Web d'abord** : les appels marchent dans le navigateur (K21 web).
  Sur l'app mobile Expo, un écran explique d'utiliser la version web —
  l'intégration native (`@livekit/react-native`) viendra avec un build
  de développement dédié.
- **Sécurité** : le secret ne quitte jamais le serveur ; les jetons durent
  1 h et ne donnent accès qu'à la salle de SA conversation.
- **Capacité** : un VPS 2 Go tient largement des dizaines d'appels 1-à-1
  simultanés. On surveillera avec UptimeRobot comme le reste
  (voir `K21-QUALITY-CONTROL.md`).
- **Coût zéro par minute** — c'est le choix « self-hosted free » validé.
