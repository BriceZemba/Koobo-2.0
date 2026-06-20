# Déploiement de KOOBO sur cPanel / o2switch — guide détaillé

But : une **seule application Python** (Flask sert l'API **et** le React buildé),
servie sur un **sous-domaine** dédié → `https://koobo.votredomaine.com`.

> ⚠️ KOOBO embarque des dépendances « lourdes » (chromadb, fastembed/onnxruntime).
> o2switch les accepte généralement, mais si l'installation échoue, voir la
> section **Dépannage** (plan B sans compilation).

---

## A. Faut-il un sous-domaine ? — OUI (recommandé)
- **Pourquoi** : isole KOOBO de votre site principal, URL propre, gestion séparée.
- **Lequel** : `koobo` → donne `koobo.votredomaine.com`.
- **Alternative** : domaine principal ou « addon domain » (possible mais moins propre).

---

## B. Préparer les fichiers (sur votre PC)
```bash
cd KOOBO_FINAL-main/web
npm install
npm run build            # génère web/dist/  (ne PAS définir VITE_API_URL : même origine)
```
Vous obtenez `web/dist/`. Vous enverrez sur le serveur **uniquement** :
- le dossier `Koobo/` (sans `.venv312`, sans `__pycache__`)
- le dossier `web/dist/`

---

## C. Créer le sous-domaine (cPanel)
1. cPanel → section **Domaines** → **Créer un domaine** (ou **Sous-domaines**).
2. Domaine : `koobo.votredomaine.com`.
3. **Document Root** proposé : laissez par défaut (ex. `/home/UTILISATEUR/koobo.votredomaine.com`).
   Notez ce chemin, il servira plus bas. → **Créer**.

---

## D. Envoyer les fichiers
Via **Gestionnaire de fichiers** cPanel (ou FTP), créez un dossier d'application,
par ex. `~/koobo_app/`, avec cette structure EXACTE :
```
/home/UTILISATEUR/koobo_app/
├── Koobo/          ← app.py, passenger_wsgi.py, requirements.txt, utils.py, ingest.py,
│                     stores/koobo_store/, rf_model.pkl, data/, crop_recommendation/
└── web/
    └── dist/       ← contenu de web/dist (index.html, assets/, logo.png, .htaccess…)
```
⚠️ `web/dist` doit être **frère** de `Koobo` (Flask le lit via `../web/dist`).
N'envoyez PAS `node_modules`, `.venv312`, ni `.env`.

> Astuce : zippez `Koobo` et `web/dist` sur votre PC, uploadez les zips, puis
> « Extract » dans le Gestionnaire de fichiers (plus rapide que fichier par fichier).

---

## E. Créer l'application Python (cPanel → Setup Python App)
cPanel → **Setup Python App** → **Create Application** :
| Champ | Valeur |
|------|--------|
| Python version | **3.11** (ou 3.10) |
| Application root | `koobo_app/Koobo` |
| Application URL | choisir **koobo.votredomaine.com** (le sous-domaine de l'étape C) |
| Application startup file | `passenger_wsgi.py` |
| Application Entry point | `application` |
→ **Create**. cPanel crée un environnement virtuel et affiche, en haut, une
commande du type :
```
source /home/UTILISATEUR/virtualenv/koobo_app/Koobo/3.11/bin/activate && cd /home/UTILISATEUR/koobo_app/Koobo
```
**Copiez cette commande**, elle sert à l'étape G.

---

## F. Variables d'environnement
Toujours dans « Setup Python App », section **Environment variables**, ajoutez :
| Clé | Valeur |
|-----|--------|
| `GROQ_API_KEY` | votre clé Groq (chat + vision + voix) |
| `WEATHER_API_KEY` | votre clé OpenWeather |
| `FLASK_SECRET_KEY` | une longue chaîne aléatoire |
| `OPENROUTER_API_KEY` | (optionnel) clé OpenRouter de secours |

→ **Save**.

---

## G. Installer les dépendances (Terminal SSH cPanel)
Ouvrez cPanel → **Terminal** (ou SSH), puis collez la commande d'activation (étape E), et :
```bash
pip install --upgrade pip
pip install -r requirements.txt
# Pré-télécharger le modèle d'embeddings (évite un 1er chargement lent / timeout) :
python -c "import utils; utils.get_embeddings().embed_query('test'); print('OK embeddings')"
```
*(Sans terminal : « Setup Python App » → champ **Configuration files** = `requirements.txt`
→ bouton **Run Pip Install**.)*

---

## H. Démarrer et tester
1. « Setup Python App » → **Restart**.
2. Ouvrez `https://koobo.votredomaine.com/api/health` → doit afficher `{"status":"ok"}`.
3. Ouvrez `https://koobo.votredomaine.com/` → le site KOOBO.

---

## I. Dépannage des erreurs fréquentes
**Où voir l'erreur exacte** : fichier `stderr.log` ou `passenger.log` dans
`koobo_app/Koobo/`, ou la sortie du `pip install` dans le Terminal.

| Erreur | Cause | Solution |
|--------|-------|----------|
| `pip` échoue sur **chroma-hnswlib** (`gcc`, `failed building wheel`) | compilation impossible | Activez un compilateur si dispo, sinon **plan B** (ci-dessous) |
| `MemoryError` / app qui redémarre en boucle | RAM insuffisante au chargement du modèle | Augmenter la limite mémoire (support o2switch) ou **plan B** |
| `503 / Application failed to start` | erreur d'import ou mauvais entry point | Vérifier `stderr.log` ; entry point = `application` ; startup = `passenger_wsgi.py` |
| `ModuleNotFoundError` | deps pas installées dans le bon venv | Refaire l'étape G avec la commande d'activation EXACTE affichée par cPanel |
| 1ère requête très lente puis `504` | téléchargement du modèle | Refaire la commande de pré-téléchargement (étape G) puis **Restart** |
| Le site charge mais l'IA renvoie une erreur | clé API manquante | Vérifier `GROQ_API_KEY` dans les variables d'env, puis **Restart** |
| Page blanche / 404 sur `/chat` | `web/dist` mal placé | `web/dist` doit être frère de `Koobo` (étape D) |

### Plan B — si les dépendances lourdes ne s'installent pas
Dites-le-moi : je remplace **chromadb + fastembed** par une version **sans
compilation et légère** (recherche vectorielle en NumPy + embeddings via API),
adaptée à l'hébergement mutualisé. Réinstallation propre, mêmes fonctionnalités.

---

## Variante (si l'app Python pose trop de soucis sur o2switch)
**Front statique sur o2switch + backend ailleurs** (recommandé si blocage) :
1. Copiez le **contenu de `web/dist/`** dans le docroot du sous-domaine (`koobo.votredomaine.com`) — le `.htaccess` gère le routage SPA. C'est instantané et parfait pour cPanel.
2. Hébergez l'API Flask sur un service Python (Render, ou autre), et rebuildez le
   front avec `VITE_API_URL=https://votre-api`, puis mettez `CORS_ORIGINS=https://koobo.votredomaine.com`.
