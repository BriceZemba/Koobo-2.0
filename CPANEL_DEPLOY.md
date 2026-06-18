# Déploiement de KOOBO sur cPanel / o2switch

Approche recommandée : **une seule application Python** (Flask sert l'API **et**
le React buildé) → une seule URL, pas de CORS. o2switch fournit « Setup Python
App » (Passenger) pour exécuter Flask.

---

## Étape 1 — Construire le frontend (sur votre PC)
```bash
cd KOOBO_FINAL-main/web
npm install
npm run build        # génère web/dist/  (avec .htaccess)
```
Comme tout est servi par Flask (même origine), **ne définissez PAS** `VITE_API_URL`
(laissez vide) avant de builder.

## Étape 2 — Envoyer les fichiers sur le serveur
Via le **Gestionnaire de fichiers** cPanel (ou SSH/git), créez un dossier, p.ex.
`~/koobo/`, et reproduisez cette structure :
```
~/koobo/
├── Koobo/            ← tout le dossier Koobo (app.py, passenger_wsgi.py, requirements.txt, stores/, rf_model.pkl, …)
└── web/
    └── dist/         ← le contenu de web/dist généré à l'étape 1
```
⚠️ Important : `web/dist` doit être **frère** de `Koobo` (Flask le lit via `../web/dist`).
N'envoyez PAS `node_modules`, ni `.venv312`, ni `.env`.

## Étape 3 — Créer l'application Python (cPanel)
cPanel → **Setup Python App** → **Create Application** :
- **Python version** : 3.11 (ou 3.10 si 3.11 indisponible)
- **Application root** : `koobo/Koobo`
- **Application URL** : votre domaine ou sous-domaine (ex. `koobo.mondomaine.com`)
- **Application startup file** : `passenger_wsgi.py`
- **Application Entry point** : `application`
→ **Create**.

## Étape 4 — Variables d'environnement (dans la même page)
Ajoutez :
| Clé | Valeur |
|-----|--------|
| `OPENROUTER_API_KEY` | votre clé OpenRouter |
| `GROQ_API_KEY` | votre clé Groq (voix) |
| `WEATHER_API_KEY` | votre clé OpenWeather |
| `FLASK_SECRET_KEY` | une longue chaîne aléatoire |

(Optionnel : `OPENROUTER_MODEL`, `EMBED_MODEL`, `CORS_ORIGINS`.)

## Étape 5 — Installer les dépendances
Dans « Setup Python App », champ **Configuration files** → indiquez
`requirements.txt` puis cliquez **Run Pip Install**.
*(Ou en SSH :)*
```bash
source ~/virtualenv/koobo/Koobo/3.11/bin/activate   # chemin affiché par cPanel
cd ~/koobo/Koobo
pip install -r requirements.txt
```

## Étape 6 — Redémarrer et tester
Cliquez **Restart**. Ouvrez votre URL :
- `/` → site KOOBO
- `/api/health` → `{"status":"ok"}`
Le **1er chargement** peut prendre ~1 min (téléchargement du modèle d'embeddings).

---

## En cas d'erreur d'installation
- **`chroma-hnswlib` ne compile pas** : demandez-moi de basculer la base
  vectorielle sur une version **sans compilation** (FAISS ou recherche numpy).
- **Mémoire insuffisante / app qui redémarre** : les embeddings locales sont
  gourmandes. Solutions : augmenter la limite mémoire de l'app (support o2switch),
  ou passer à des **embeddings par API** (je peux adapter le code).
- **Modèle OpenRouter saturé (429)** : le code bascule automatiquement ; sinon
  changez `OPENROUTER_MODEL`.

## Variante (frontend statique séparé)
Si vous préférez servir le React directement par Apache (plus rapide) :
1. Copiez le **contenu de `web/dist/`** dans `public_html/` (le `.htaccess` gère le routage SPA).
2. Déployez l'app Python sur un **sous-domaine** `api.mondomaine.com` (Application URL).
3. Rebuildez le frontend avec `VITE_API_URL=https://api.mondomaine.com`, et mettez
   `CORS_ORIGINS=https://mondomaine.com` dans les variables de l'app Python.
