"""
KOOBO 2.0 Application unifiée
--------------------------------
Une seule application Flask regroupant :
  • Chatbot RAG agronomique (Groq LLaMA 3 70B + ChromaDB) multilingue
  • Détection de maladies par vision (OpenRouter llama-3.2-11b-vision) 1 appel JSON
  • Recommandation de cultures (Random Forest + OpenWeather)
  • Interface vocale (Speech-to-Text via Groq Whisper)

Lancement : python app.py  →  http://localhost:5000
"""
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from PIL import Image
import os, pickle, json, tempfile
from dotenv import load_dotenv
import numpy as np
import utils
# NB : langchain_chroma / chromadb (lourds) sont importés paresseusement dans
# _ensure_rag() pour que le site démarre même s'ils sont lents/absents.

load_dotenv()
# Traçage LangSmith désactivé par défaut (évite les erreurs 403 et la latence).
# Pour l'activer : LANGCHAIN_TRACING_V2=true + une clé LANGCHAIN_API_KEY valide.
if os.getenv("LANGCHAIN_TRACING_V2", "").lower() != "true":
    os.environ["LANGCHAIN_TRACING_V2"] = "false"

FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "koobo-dev-secret")

# Le frontend React est buildé dans ../web/dist et servi directement par Flask
# → un seul site, un seul port (http://localhost:5000).
SPA_DIR = os.path.join(os.path.dirname(__file__), "..", "web", "dist")
# Base vectorielle (embeddings fastembed) reconstruite via l'ingestion.
STORE_DIR = os.path.join(os.path.dirname(__file__), "stores", "koobo_store")

# static_folder=None : on désactive la route statique automatique de Flask (qui
# capterait toutes les URL) et on sert le SPA nous-mêmes via serve_spa().
app = Flask(__name__, static_folder=None)
app.secret_key = FLASK_SECRET_KEY
# CORS (utile en dev si le frontend tourne séparément ; sans effet quand tout est servi par Flask).
_cors_origins = os.getenv("CORS_ORIGINS", "*")
CORS(app, resources={r"/*": {"origins": _cors_origins.split(",") if _cors_origins != "*" else "*"}}, supports_credentials=True)

# ---------------------------------------------------------------------------
# Initialisation PARESSEUSE des composants lourds (au 1er besoin).
# → Passenger/cPanel démarre vite ; le site, la météo et les cultures
#   fonctionnent même si embeddings/chromadb sont lents ou absents.
# ---------------------------------------------------------------------------
_RAG = {"store": None, "retriever": None, "chat_llm": None, "har": None}
_RAG_CHAINS = {}
_RAG_LOADED = False
from langchain.chains import create_retrieval_chain, create_history_aware_retriever
from langchain.chains.combine_documents import create_stuff_documents_chain


def _ensure_rag():
    """Charge (une seule fois) embeddings + base vectorielle + LLM. Peut lever."""
    global _RAG_LOADED
    if not _RAG_LOADED:
        from langchain_chroma import Chroma  # import lourd différé (chromadb)
        embeddings = utils.get_embeddings()
        _RAG["store"] = Chroma(persist_directory=STORE_DIR, embedding_function=embeddings)
        _RAG["retriever"] = _RAG["store"].as_retriever(search_kwargs={"k": 4})
        _RAG["chat_llm"] = utils.get_chat_llm(temperature=0)
        prompt = ChatPromptTemplate.from_messages([
            ("system", utils.contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        _RAG["har"] = create_history_aware_retriever(_RAG["chat_llm"], _RAG["retriever"], prompt)
        _RAG_LOADED = True
    return _RAG


def get_store():
    return _ensure_rag()["store"]


def get_rag_chain(lang_code):
    rag = _ensure_rag()
    if lang_code not in _RAG_CHAINS:
        language_name = utils.get_language_name(lang_code)
        qa_prompt = utils.get_qa_prompt(language_name)
        question_answer_chain = create_stuff_documents_chain(rag["chat_llm"], qa_prompt)
        _RAG_CHAINS[lang_code] = create_retrieval_chain(rag["har"], question_answer_chain)
    return _RAG_CHAINS[lang_code]


# Modèle de recommandation de cultures (léger) — chemin absolu.
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "rf_model.pkl")
try:
    CROP_MODEL = pickle.load(open(_MODEL_PATH, "rb"))
except Exception as e:
    print(f"rf_model.pkl: {e}")
    CROP_MODEL = None

print("✅ KOOBO prêt (init paresseuse de l'IA).")


# ===========================================================================
# CHATBOT RAG (multilingue)
# ===========================================================================
def _ai_error(e):
    """Transforme une exception LLM en message clair + code HTTP."""
    msg = str(e).lower()
    # Quota / crédits épuisés : limite gratuite quotidienne (429, free-models-per-day)
    # OU crédits payants à zéro (402, insufficient, payment required, balance…).
    credit_markers = ("429", "rate", "quota", "free-models-per-day", "402",
                      "insufficient", "payment required", "out of credit",
                      "credit", "balance", "exceeded")
    if any(k in msg for k in credit_markers):
        return ("Crédit IA terminé : le quota du service IA gratuit est épuisé. "
                "Réessayez plus tard, ajoutez des crédits sur openrouter.ai, "
                "ou utilisez la détection hors-ligne."), 503
    if "401" in msg or "auth" in msg or "api key" in msg:
        return ("Clé OpenRouter manquante ou invalide. Vérifiez OPENROUTER_API_KEY.", 503)
    return ("Service IA temporairement indisponible. Réessayez plus tard.", 503)


@app.route('/get_chat_response', methods=['POST'])
def get_chat_response():
    query = request.form.get('query')
    lang_code = request.form.get('lang', 'fr')
    profile = (request.form.get('profile') or '').strip()
    if not query:
        return jsonify({"error": "Empty query"}), 400

    # Personnalisation : contexte du profil agriculteur (ville, cultures, sol).
    note = f"[Contexte agriculteur — {profile}. Adapte tes conseils à ce contexte.]" if profile else ""
    rag_input = f"{note}\n\n{query}" if note else query

    if 'chat_history' not in session:
        session['chat_history'] = []
    chat_history = [utils.deserialize_message(m) for m in session['chat_history']]

    answer = None
    # 1) On tente le RAG (réponses enrichies par les documents).
    try:
        rag_chain = get_rag_chain(lang_code)
        answer = rag_chain.invoke({"input": rag_input, "chat_history": chat_history})["answer"]
    except Exception as e:
        print(f"RAG indisponible, repli LLM direct : {e}")
        # 2) Repli SANS base documentaire : le chatbot répond quand même (Groq).
        try:
            llm = utils.get_chat_llm(temperature=0.3)
            system = utils.get_plain_system(utils.get_language_name(lang_code))
            if note:
                system += " " + note
            sys_msg = SystemMessage(content=system)
            answer = llm.invoke([sys_msg, *chat_history, HumanMessage(content=query)]).content
        except Exception as e2:
            print(f"Chat error: {e2}")
            emsg, code = _ai_error(e2)
            return jsonify({"error": emsg}), code

    chat_history.extend([HumanMessage(content=query), AIMessage(content=answer)])
    session['chat_history'] = [utils.serialize_message(m) for m in chat_history]
    return jsonify({"answer": answer})


@app.route('/reset_chat', methods=['POST'])
def reset_chat():
    session.pop('chat_history', None)
    return jsonify({"status": "ok"})


# ===========================================================================
# INTERFACE VOCALE Speech-to-Text (Groq Whisper)
# ===========================================================================
@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio uploaded"}), 400
    lang_code = request.form.get('lang', 'fr')
    audio_file = request.files['audio']
    suffix = os.path.splitext(audio_file.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name
    try:
        text = utils.transcribe_audio(tmp_path, lang_code)
        return jsonify({"text": text})
    except Exception as e:
        print(f"Transcription error: {e}")
        return jsonify({"error": "Transcription failed"}), 500
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


# ===========================================================================
# DÉTECTION DE MALADIES (Gemini 2.0 Flash un seul appel JSON)
# ===========================================================================
def _vision_llm():
    """Retourne un LLM vision via OpenRouter (modèle gratuit)."""
    return utils.get_vision_llm(temperature=0.2)


def _parse_json_block(text):
    """Extrait un objet JSON même s'il est entouré de ``` ou de texte."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.lstrip().startswith("json"):
            text = text.lstrip()[4:]
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return json.loads(text)


@app.route('/get_detect_response', methods=['POST'])
def get_detect_response():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    lang_code = request.form.get('lang', 'fr')
    language_name = utils.get_language_name(lang_code)

    try:
        pil_image = Image.open(request.files['image'].stream).convert('RGB')
        image_b64 = utils.convert_to_base64(pil_image)

        llm = _vision_llm()
        message = HumanMessage(content=[
            {"type": "text", "text": utils.disease_detection_prompt(language_name)},
            {"type": "image_url", "image_url": {"url": image_b64}},
        ])
        raw = llm.invoke([message]).content
    except Exception as e:
        print(f"Vision error: {e}")
        emsg, code = _ai_error(e)
        return jsonify({"error": emsg}), code

    try:
        data = _parse_json_block(raw)
        response_data = {
            "nom_maladie": data.get("nom_maladie", "Inconnu"),
            "cause_maladie": data.get("cause_maladie", ""),
            "symptome_maladie": data.get("symptome_maladie", ""),
            "traitement_maladie": data.get("traitement_maladie", ""),
        }
    except Exception as e:
        print(f"JSON parse error: {e} raw: {raw[:200]}")
        # Repli : on renvoie au moins le texte brut comme nom de maladie.
        response_data = {
            "nom_maladie": raw,
            "cause_maladie": "",
            "symptome_maladie": "",
            "traitement_maladie": "",
        }
    return jsonify(response_data)


@app.route('/get_detect_chat', methods=['POST', 'GET'])
def get_detect_chat():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    lang_code = request.form.get('lang', 'fr')
    language_name = utils.get_language_name(lang_code)
    query = request.form.get('query', '')

    try:
        pil_image = Image.open(request.files['image'].stream).convert('RGB')
        image_b64 = utils.convert_to_base64(pil_image)

        llm = _vision_llm()
        message = HumanMessage(content=[
            {"type": "text", "text": f"{query}\n\n(Réponds en {language_name}, de façon claire et pratique pour un agriculteur.)"},
            {"type": "image_url", "image_url": {"url": image_b64}},
        ])
        result = llm.invoke([message])
    except Exception as e:
        print(f"Vision chat error: {e}")
        emsg, code = _ai_error(e)
        return jsonify({"error": emsg}), code
    return jsonify({"result": result.content})


# ===========================================================================
# RECOMMANDATION DE CULTURES (Random Forest + météo)
# ===========================================================================
CROP_TRANSLATIONS = {
    'rice': 'riz', 'wheat': 'blé', 'maize': 'maïs', 'chickpea': 'pois chiche',
    'kidneybeans': 'haricots rouges', 'pigeonpeas': "pois d'angole",
    'mothbeans': 'haricots papillon', 'mungbean': 'haricot mungo',
    'blackgram': 'urad dal', 'lentil': 'lentille', 'pomegranate': 'grenade',
    'banana': 'banane', 'mango': 'mangue', 'grapes': 'raisins',
    'watermelon': 'pastèque', 'muskmelon': 'melon cantaloup', 'apple': 'pomme',
    'orange': 'orange', 'papaya': 'papaye', 'coconut': 'noix de coco',
    'cotton': 'coton', 'jute': 'jute', 'coffee': 'café',
}


@app.route('/api/health', methods=['GET'])
def api_health():
    """Health check léger (sans appel externe) pour Render."""
    return jsonify({"status": "ok"})


@app.route('/api/cities', methods=['GET'])
def api_cities():
    """Autocomplétion de villes via le géocodage OpenWeather."""
    q = (request.args.get('q') or '').strip()
    if len(q) < 2:
        return jsonify([])
    results = utils.geocode_cities(q)
    return jsonify(results)


@app.route('/api/weather', methods=['GET'])
def api_weather():
    """Météo actuelle + prévisions 5 jours + alertes agronomiques."""
    city = request.args.get('city', 'Ouagadougou')
    data = utils.weather_forecast(city)
    if data is None:
        return jsonify({"error": "city_not_found"}), 404
    return jsonify(data)


# ===========================================================================
# CANAL WHATSAPP (webhook Twilio) réutilise la chaîne RAG
# ===========================================================================
@app.route('/whatsapp', methods=['POST'])
def whatsapp():
    """Webhook Twilio WhatsApp : reçoit un message, répond via le chatbot RAG.

    Configuration : dans la console Twilio (WhatsApp Sandbox), pointer le champ
    « WHEN A MESSAGE COMES IN » vers https://<votre-domaine>/whatsapp (POST).
    """
    incoming = (request.form.get('Body') or '').strip()
    if not incoming:
        reply = "Bonjour 👋 Je suis Koobo. Posez-moi votre question agricole."
    else:
        try:
            rag_chain = get_rag_chain('fr')
            result = rag_chain.invoke({"input": incoming, "chat_history": []})
            reply = result.get("answer", "Désolé, je n'ai pas pu répondre.")
        except Exception as e:
            print(f"WhatsApp error: {e}")
            reply = "Désolé, une erreur est survenue. Réessayez plus tard."

    # Réponse au format TwiML (pas besoin du SDK Twilio).
    from xml.sax.saxutils import escape
    twiml = f"<?xml version='1.0' encoding='UTF-8'?><Response><Message>{escape(reply)}</Message></Response>"
    return app.response_class(twiml, mimetype='application/xml')


@app.route('/api/crop_prediction', methods=['POST'])
def api_crop_prediction():
    """Version JSON pour le frontend React."""
    if CROP_MODEL is None:
        return jsonify({"error": "Model unavailable"}), 503
    try:
        N = int(request.form['nitrogen'])
        P = int(request.form['phosphorous'])
        K = int(request.form['potassium'])
        ph = float(request.form['ph'])
        rainfall = float(request.form['rainfall'])
        city = request.form.get("city")
    except (KeyError, ValueError):
        return jsonify({"error": "Invalid input"}), 400

    weather = utils.weather_fetch(city)
    if weather is None:
        return jsonify({"error": "city_not_found"}), 404

    temperature, humidity = weather
    data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])

    # Top 3 cultures recommandées (via les probabilités du modèle).
    try:
        proba = CROP_MODEL.predict_proba(data)[0]
        classes = CROP_MODEL.classes_
        top_idx = np.argsort(proba)[::-1][:3]
        top = [{
            "crop": CROP_TRANSLATIONS.get(classes[i].lower(), classes[i].capitalize()),
            "crop_raw": classes[i],
            "score": round(float(proba[i]) * 100, 1),
        } for i in top_idx]
    except Exception:
        # Repli si le modèle n'expose pas predict_proba.
        pred = CROP_MODEL.predict(data)[0]
        top = [{"crop": CROP_TRANSLATIONS.get(pred.lower(), pred.capitalize()), "crop_raw": pred, "score": 100.0}]

    return jsonify({
        "top": top,
        "prediction": top[0]["crop"],          # rétro-compatibilité
        "temperature": temperature,
        "humidity": humidity,
    })


# ===========================================================================
# INGESTION DE DOCUMENTS (RAG) l'utilisateur enrichit la base de connaissances
# ===========================================================================
ALLOWED_EXT = {".pdf", ".txt", ".md", ".docx"}


def _load_document(path, filename):
    from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        docs = PyPDFLoader(path).load()
    elif ext == ".docx":
        docs = Docx2txtLoader(path).load()
    else:
        docs = TextLoader(path, encoding="utf-8").load()
    for d in docs:
        d.metadata["source"] = filename
    return docs


@app.route("/api/ingest", methods=["POST"])
def api_ingest():
    """Reçoit des fichiers, les découpe et les ajoute à la base vectorielle."""
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "no_files"}), 400
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
    ingested, total = [], 0
    for f in files:
        ext = os.path.splitext(f.filename or "")[1].lower()
        if ext not in ALLOWED_EXT:
            continue
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            f.save(tmp.name)
            tmp_path = tmp.name
        try:
            chunks = splitter.split_documents(_load_document(tmp_path, f.filename))
            if chunks:
                get_store().add_documents(chunks)
                total += len(chunks)
                ingested.append({"name": f.filename, "chunks": len(chunks)})
        except Exception as e:
            print(f"Ingest error ({f.filename}): {e}")
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
    return jsonify({"ingested": ingested, "total_chunks": total})


@app.route("/api/documents", methods=["GET"])
def api_documents():
    """Liste les documents présents dans la base (regroupés par source)."""
    try:
        data = get_store().get(include=["metadatas"])
        counts = {}
        for m in data.get("metadatas", []) or []:
            s = (m or {}).get("source")
            if s:
                counts[s] = counts.get(s, 0) + 1
        return jsonify([{"name": k, "chunks": v} for k, v in sorted(counts.items())])
    except Exception:
        return jsonify([])


@app.route("/api/documents", methods=["DELETE"])
def api_documents_delete():
    """Supprime un document (?source=nom) ou tout (sans paramètre)."""
    source = request.args.get("source")
    try:
        if source:
            ids = get_store().get(where={"source": source}).get("ids", [])
        else:
            ids = get_store().get().get("ids", [])
        if ids:
            get_store().delete(ids=ids)
        return jsonify({"status": "ok", "deleted": len(ids)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===========================================================================
# FRONTEND REACT (SPA) servi par Flask : un seul site, un seul port
# ===========================================================================
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    """Sert le build React. Les routes client (/chat, /detection, …) renvoient
    index.html ; les vrais fichiers (assets, logo, manifest) sont servis tels quels."""
    if not os.path.isdir(SPA_DIR):
        return jsonify({"error": "Frontend non buildé. Lancez 'npm run build' dans web/."}), 404
    if path and os.path.exists(os.path.join(SPA_DIR, path)):
        return send_from_directory(SPA_DIR, path)
    # Fichier statique demandé mais introuvable (ex. ancien chunk hashé réclamé par
    # un onglet resté ouvert après un redéploiement) → vrai 404, PAS index.html.
    # Sinon un import dynamique reçoit du HTML au lieu de JS, d'où l'erreur
    # « Failed to fetch dynamically imported module ». Les routes client du SPA
    # (/chat, /detection, …) n'ont pas d'extension et reçoivent bien index.html.
    if path.startswith("assets/") or os.path.splitext(path)[1]:
        return jsonify({"error": "Not found", "path": path}), 404
    return send_from_directory(SPA_DIR, "index.html")


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
