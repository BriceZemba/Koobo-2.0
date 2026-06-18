# KOOBO Frontend (React + TypeScript + Vite)

Interface web moderne de KOOBO, thème agricole. Remplace l'ancien site PHP.

## Stack
- React + TypeScript + Vite
- Tailwind CSS (thème feuille/lime/terre/crème)
- react-router-dom, framer-motion, lucide-react, marked

## Pages
- `/` Landing (hero, fonctionnalités, voix & multilingue, impact)
- `/chat` Assistant agronomique vocal & multilingue
- `/detection` Détection de maladies (upload photo + suivi)
- `/crop` Recommandation de cultures (formulaire + météo)

## Développement
Le frontend appelle l'API Flask (dossier `../Koobo`). En dev, le proxy Vite
redirige automatiquement les appels API vers `http://127.0.0.1:5000`.

```bash
# 1) Démarrer le backend (dans ../Koobo, venv activé)
python app.py            # http://127.0.0.1:5000

# 2) Démarrer le frontend (ici)
npm install
npm run dev              # http://localhost:5173
```

## Production
```bash
npm run build            # génère dist/
```
Déployer `dist/` sur Vercel / Netlify. Définir la variable `VITE_API_URL`
avec l'URL publique du backend Flask (ex. `https://koobo.onrender.com`),
et configurer `CORS_ORIGINS` côté Flask avec l'URL du frontend.
