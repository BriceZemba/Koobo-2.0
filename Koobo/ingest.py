"""
Ingestion en lot (re)construit la base vectorielle à partir des PDF de data/.
Utilise les mêmes embeddings (fastembed, locales) que l'application.

    python ingest.py
"""
import os, shutil
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_chroma import Chroma
from dotenv import load_dotenv
import utils

load_dotenv()

STORE_DIR = os.path.join(os.path.dirname(__file__), "stores", "koobo_store")

print("📂 Chargement des PDF de data/ ...")
loader = DirectoryLoader("data/", glob="**/*.pdf", show_progress=True, loader_cls=PyPDFLoader)
documents = loader.load()
for d in documents:
    d.metadata["source"] = os.path.basename(d.metadata.get("source", "data"))

print(f"✂️  Découpage de {len(documents)} pages ...")
splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
chunks = splitter.split_documents(documents)

# Repart d'une base propre pour éviter les doublons / conflits de dimensions.
if os.path.exists(STORE_DIR):
    shutil.rmtree(STORE_DIR)
    print("🗑️  Ancien store supprimé.")

print(f"🧠 Indexation de {len(chunks)} extraits (embeddings fastembed) ...")
Chroma.from_documents(chunks, embedding=utils.get_embeddings(), persist_directory=STORE_DIR)
print(f"✅ Base vectorielle créée dans {STORE_DIR}")
