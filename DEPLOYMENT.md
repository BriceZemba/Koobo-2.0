# Déploiement de KOOBO — guide clé en main

Architecture : **backend Flask API → Render** · **frontend React → Vercel**.

## 0. Clés API nécessaires
- **OpenRouter** (chat + vision) — https://openrouter.ai/keys → `OPENROUTER_API_KEY`
- **Groq** (reconnaissance vocale) — https://console.groq.com → `GROQ_API_KEY`
- **OpenWeather** (météo + villes) — https://openweathermap.org/api → `WEATHER_API_KEY`
> Les embeddings sont locales (fastembed) — aucune clé. Supabase est optionnel.

## 1. Pousser le code sur GitHub
Depuis le dossier `KOOBO_FINAL-main/` (déjà initialisé en dépôt git ; `.env` est ignoré) :
```bash
git remote add origin https://github.com/<vous>/koobo.git
git branch -M main
git push -u origin main
```

## 2. Backend → Render
1. Render → **New +** → **Blueprint** → sélectionnez le dépôt (le `render.yaml` à la racine est détecté ; service `koobo-api`, `rootDir: Koobo`).
2. Renseignez les variables : `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `WEATHER_API_KEY`.
   `FLASK_SECRET_KEY` est généré automatiquement.
3. Laissez `CORS_ORIGINS` vide pour l'instant (on y mettra l'URL Vercel à l'étape 4).
4. Déployez → notez l'URL, ex. `https://koobo-api.onrender.com`.
   > 1er démarrage lent (~1 min) : le modèle d'embeddings se télécharge. Voir « Notes ».

## 3. Frontend → Vercel
1. Vercel → **Add New → Project** → importez le dépôt.
2. **Root Directory** : `web` (le `web/vercel.json` gère le build Vite + le routage SPA).
3. Variable d'environnement : `VITE_API_URL` = l'URL Render de l'étape 2.
   (Optionnel : `VITE_WHATSAPP_NUMBER`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.)
4. Déployez → vous obtenez le **lien public** (ex. `https://koobo.vercel.app`) à mettre dans le formulaire STIC'26.

## 4. Relier les deux (CORS)
Dans Render → service `koobo-api` → Environment → `CORS_ORIGINS` = votre URL Vercel
(ex. `https://koobo.vercel.app`) → **Save** (redéploiement auto).

## 5. (Optionnel) WhatsApp — Twilio Sandbox
Twilio → Messaging → WhatsApp Sandbox → « When a message comes in » :
`https://<votre-backend-render>/whatsapp` (POST).

## Vérification
- [ ] `https://...vercel.app/` charge ; navigation `/chat /detection /crop /meteo /usage`.
- [ ] Le chat répond (OpenRouter) — sinon vérifier `VITE_API_URL` + `CORS_ORIGINS` + clés.
- [ ] Détection (photo), Cultures (recommandation), Météo (prévisions + alertes).
- [ ] Bascule de langue FR/EN dans la navbar.

## Notes
- **RAM Render (free, 512 Mo)** : le modèle d'embeddings (fastembed MiniLM multilingue) consomme de la mémoire. Si le service redémarre / OOM, passez au plan **Starter** de Render, ou définissez `EMBED_MODEL` sur un modèle plus léger.
- La base vectorielle `Koobo/stores/koobo_store` est versionnée → le RAG fonctionne dès le déploiement (pas besoin de réingérer).
- Modèles OpenRouter gratuits parfois saturés (429) : le code bascule automatiquement sur des modèles de secours ; sinon changez `OPENROUTER_MODEL`.
