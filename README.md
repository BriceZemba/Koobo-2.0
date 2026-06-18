# Koobo Plateforme Intelligente d'Aide à l'Agriculture

> Une application web full-stack combinant IA générative, vision par ordinateur et machine learning pour accompagner les agriculteurs dans leurs décisions quotidiennes.

---

## Table des Matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack Technologique](#stack-technologique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du Projet](#structure-du-projet)
- [API Endpoints](#api-endpoints)
- [Modèles IA](#modèles-ia)

---

## Aperçu

**Koobo** est une plateforme agricole intelligente qui met l'IA au service des agriculteurs. Elle offre trois modules principaux :

1. **Chatbot RAG** Réponses contextuelles aux questions agricoles grâce à un système de retrieval augmenté (RAG)
2. **Détection de Maladies** Analyse d'images de plantes pour identifier maladies, causes, symptômes et traitements
3. **Recommandation de Cultures** Suggestion de la culture la plus adaptée selon les paramètres du sol et la météo

---

## Fonctionnalités

### Chatbot Agricole Intelligent (RAG)
- Réponses précises basées sur une base de connaissances agricole vectorisée
- Mémoire conversationnelle par session
- Powered by **LLaMA 3 70B** via Groq et **ChromaDB** pour la recherche sémantique

### Détection de Maladies (Vision IA)
- Upload d'image de plante → analyse instantanée
- Retourne : nom de la maladie, causes, symptômes, traitements
- Powered by **Gemini Pro Vision**
- Interface de chat libre avec l'image pour des questions de suivi

### Recommandation de Cultures
- Saisie des paramètres : Azote (N), Phosphore (P), Potassium (K), pH, pluviométrie
- Récupération automatique de la température et de l'humidité via la météo de la ville
- Prédiction avec un modèle **Random Forest** entraîné
- Traduction automatique des résultats en français

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (HTML/CSS/JS)             │
│   chat.html | detection.html | crop.html            │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / JSON
┌────────────────────────▼────────────────────────────┐
│               Flask Backend (app.py / app2.py)      │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  RAG Chain  │  │ Gemini Vision│  │  RF Model  │ │
│  │  (LangChain)│  │  (Disease)   │  │  (Crop)    │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                │                 │         │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌─────▼──────┐ │
│  │  ChromaDB   │  │ Google Gemini│  │Weather API │ │
│  │  (Vectors)  │  │    API       │  │  (OpenWthr)│ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Stack Technologique

| Composant | Technologie |
|-----------|-------------|
| Backend | Python · Flask |
| LLM (Chatbot) | LLaMA 3 70B via Groq |
| LLM (Vision) | Gemini Pro Vision |
| Embeddings | Google Generative AI Embeddings |
| Vector Store | ChromaDB |
| Orchestration LLM | LangChain |
| ML (Cultures) | Scikit-learn · Random Forest |
| Météo | OpenWeatherMap API |
| Frontend | HTML5 · CSS3 · JavaScript |
| Session | Flask Sessions |

---

## Prérequis

- Python **3.10+**
- pip
- Clés API : **Groq**, **Google Gemini**, **OpenWeatherMap**, **LangChain**
- Le fichier modèle `rf_model.pkl` (Random Forest pré-entraîné)
- Le dossier vector store `stores/koobo_cosine/` (ChromaDB pré-indexé)

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/BriceZemba/KOOBO_FINAL.git
cd KOOBO_FINAL

# 2. Créer et activer un environnement virtuel
python -m venv venv
source venv/bin/activate        # Linux / macOS
venv\Scripts\activate           # Windows

# 3. Installer les dépendances
pip install -r requirements.txt
```

---

## Configuration

Créer un fichier `.env` à la racine du projet :

```env
FLASK_SECRET_KEY=votre_cle_secrete_flask
GROQ_API_KEY=votre_cle_groq
GOOGLE_API_KEY=votre_cle_google_gemini
LANGCHAIN_API_KEY=votre_cle_langchain
OPENWEATHER_API_KEY=votre_cle_openweather
```

> Ne jamais committer le fichier `.env`. Il est inclus dans `.gitignore`.

---

## Utilisation

### Lancer l'application principale (Chatbot + Détection)

```bash
python app.py
# → http://localhost:5000
```

### Lancer le module de recommandation de cultures

```bash
python app2.py
# → http://localhost:5001
```

---

## Structure du Projet

```
koobo/
├── app.py                  # Application principale (chatbot + détection)
├── app2.py                 # Module recommandation de cultures
├── utils.py                # Fonctions utilitaires (prompts, météo, sérialisation)
├── rf_model.pkl            # Modèle Random Forest (cultures)
├── stores/
│   └── koobo_cosine/       # Vector store ChromaDB
├── templates/
│   ├── chat.html           # Interface chatbot
│   ├── detection.html      # Interface détection maladies
│   ├── video.html          # Interface vidéo
│   ├── crop.html           # Formulaire recommandation
│   └── crop_prediction.html
├── static/                 # CSS, JS, images
├── .env                    # Variables d'environnement (non versionné)
├── requirements.txt
└── README.md
```

---

## API Endpoints

### `app.py` Port 5000

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Interface chatbot |
| POST | `/get_chat_response` | Réponse RAG du chatbot |
| GET | `/detection` | Interface détection |
| POST | `/get_detect_response` | Analyse maladie d'une image |
| POST | `/get_detect_chat` | Chat libre avec image |
| GET | `/video` | Interface vidéo |

### `app2.py` Port 5001

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/crop` | Formulaire recommandation |
| POST | `/crop_prediction` | Prédiction de culture adaptée |

---

## Modèles IA

### Random Forest Recommandation de Cultures
- **Entrées** : N, P, K, température, humidité, pH, pluviométrie
- **Sortie** : Culture recommandée (parmi 22 cultures)
- **Fichier** : `rf_model.pkl`

### LLaMA 3 70B (Groq) Chatbot RAG
- Retrieval sur ChromaDB (top-2 chunks)
- Historique conversationnel maintenu en session Flask
- Reformulation de questions pour une meilleure recherche contextuelle

### Gemini Pro Vision Détection de Maladies
- Analyse multi-passes : identification → causes → symptômes → traitements
- Accepte des images JPEG/PNG converties en base64

---

## Contribution

Les contributions sont les bienvenues ! Merci de :
1. Forker le projet
2. Créer une branche feature (`git checkout -b feature/ma-fonctionnalite`)
3. Committer vos changements (`git commit -m 'feat: ajout de ...'`)
4. Pousser la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

---

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
