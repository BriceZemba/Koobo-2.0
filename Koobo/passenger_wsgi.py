"""
Point d'entrée Passenger pour cPanel / o2switch (« Setup Python App »).

cPanel lance ce fichier via Passenger et utilise l'objet WSGI nommé
`application`. Le venv est géré automatiquement par cPanel.

Placez le code KOOBO ainsi sur le serveur :
    ~/koobo/                ← racine de l'application Python (App root)
    ├── Koobo/              ← ce dossier (app.py, passenger_wsgi.py, …)
    └── web/dist/           ← build React (Flask le sert tout seul)
"""
import os
import sys

# Rendre les modules locaux (app.py, utils.py) importables.
sys.path.insert(0, os.path.dirname(__file__))

from app import app as application  # noqa: E402

# Pour un test rapide en SSH : python passenger_wsgi.py
if __name__ == "__main__":
    application.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
