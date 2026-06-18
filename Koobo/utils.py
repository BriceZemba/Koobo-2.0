from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from io import BytesIO
import base64
import os, requests
from dotenv import load_dotenv

load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# ---------------------------------------------------------------------------
# Modèles (OpenRouter) et embeddings (fastembed, locales, sans clé).
# Modifiables via variables d'environnement.
# ---------------------------------------------------------------------------
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
# Modèle principal (gratuit, multilingue ET multimodal) + secours automatiques.
# Les modèles gratuits sont parfois saturés (429) : on bascule sur le suivant.
CHAT_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
CHAT_FALLBACKS = ["qwen/qwen3-next-80b-a3b-instruct:free",
                  "meta-llama/llama-3.3-70b-instruct:free",
                  "google/gemma-4-26b-a4b-it:free"]
VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "google/gemma-4-31b-it:free")
VISION_FALLBACKS = ["nvidia/nemotron-nano-12b-v2-vl:free", "google/gemma-4-26b-a4b-it:free"]
EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

_OR_HEADERS = {"HTTP-Referer": "https://koobo.ai", "X-Title": "KOOBO"}


def _make_llm(model, temperature, timeout):
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(model=model, temperature=temperature,
                      api_key=OPENROUTER_API_KEY, base_url=OPENROUTER_BASE,
                      default_headers=_OR_HEADERS, timeout=timeout, max_retries=1)


def get_chat_llm(temperature=0.2):
    primary = _make_llm(CHAT_MODEL, temperature, 60)
    return primary.with_fallbacks([_make_llm(m, temperature, 60) for m in CHAT_FALLBACKS])


def get_vision_llm(temperature=0.2):
    primary = _make_llm(VISION_MODEL, temperature, 90)
    return primary.with_fallbacks([_make_llm(m, temperature, 90) for m in VISION_FALLBACKS])


_EMBEDDINGS = None


def get_embeddings():
    """Embeddings locales fastembed (ONNX, multilingue, sans clé API)."""
    global _EMBEDDINGS
    if _EMBEDDINGS is None:
        from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
        _EMBEDDINGS = FastEmbedEmbeddings(model_name=EMBED_MODEL)
    return _EMBEDDINGS


# ---------------------------------------------------------------------------
# Langues supportées par KOOBO.
# code -> (nom affiché, nom utilisé dans le prompt, code BCP-47 pour la voix)
# ---------------------------------------------------------------------------
LANGUAGES = {
    "fr":  {"label": "Français",  "name": "français",                         "voice": "fr-FR"},
    "mos": {"label": "Mooré",     "name": "mooré (langue mossi du Burkina Faso)", "voice": "fr-FR"},
    "dyu": {"label": "Dioula",    "name": "dioula (jula)",                    "voice": "fr-FR"},
    "ff":  {"label": "Fulfuldé",  "name": "fulfuldé (peul)",                  "voice": "fr-FR"},
    "en":  {"label": "English",   "name": "English",                          "voice": "en-US"},
}


def get_language_name(lang_code):
    return LANGUAGES.get(lang_code, LANGUAGES["fr"])["name"]


def serialize_message(message):
    return {"type": type(message).__name__,
            "content": message.content}


def deserialize_message(message_dict):
    if message_dict["type"] == "HumanMessage":
        return HumanMessage(content=message_dict["content"])
    elif message_dict["type"] == "AIMessage":
        return AIMessage(content=message_dict["content"])


def convert_to_base64(pil_image):
    buffered = BytesIO()
    pil_image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{img_str}"


def weather_fetch(city_name):
    complete_url = "http://api.openweathermap.org/data/2.5/weather?" + "appid=" + WEATHER_API_KEY + "&q=" + city_name
    response = requests.get(complete_url)
    x = response.json()

    if x["cod"] != "404":
        y = x["main"]
        temperature = round((y["temp"] - 273.15), 2)
        humidity = y["humidity"]
        return temperature, humidity
    else:
        return None


def geocode_cities(query, limit=6):
    """Renvoie une liste de villes correspondant à la requête (géocodage OpenWeather)."""
    url = f"http://api.openweathermap.org/geo/1.0/direct?q={query}&limit={limit}&appid={WEATHER_API_KEY}"
    try:
        data = requests.get(url, timeout=10).json()
    except Exception:
        return []
    out, seen = [], set()
    for c in data:
        label = c.get("name", "")
        if c.get("state"):
            label += f", {c['state']}"
        if c.get("country"):
            label += f", {c['country']}"
        key = (c.get("name"), c.get("country"), c.get("state"))
        if key in seen:
            continue
        seen.add(key)
        out.append({"name": c.get("name"), "label": label, "country": c.get("country", "")})
    return out


def _agro_alerts(daily):
    """Génère des conseils agronomiques simples à partir des prévisions journalières."""
    alerts = []
    rain_soon = any(d["rain"] >= 1 for d in daily[:2])
    heavy_rain = any(d["rain"] >= 10 for d in daily[:3])
    hot_dry = any(d["temp_max"] >= 38 and d["rain"] < 1 for d in daily[:3])
    high_humidity = any(d["humidity"] >= 80 for d in daily[:3])

    if rain_soon:
        alerts.append({"level": "info", "icon": "rain",
                       "text": "Pluie attendue sous 48 h : évitez les traitements et l'épandage d'engrais (risque de lessivage)."})
    if heavy_rain:
        alerts.append({"level": "warning", "icon": "flood",
                       "text": "Fortes pluies prévues : assurez le drainage des parcelles et surveillez l'apparition de maladies fongiques."})
    if hot_dry:
        alerts.append({"level": "warning", "icon": "sun",
                       "text": "Chaleur forte sans pluie : risque de stress hydrique. Arrosez tôt le matin ou en soirée et paillez le sol."})
    if high_humidity:
        alerts.append({"level": "info", "icon": "droplet",
                       "text": "Humidité élevée : conditions favorables aux maladies. Surveillez vos cultures et aérez si possible."})
    if not alerts:
        alerts.append({"level": "ok", "icon": "check",
                       "text": "Conditions stables : aucune alerte particulière. Bonne période pour les travaux agricoles courants."})
    return alerts


def weather_forecast(city_name):
    """Renvoie la météo actuelle + prévisions 5 jours + alertes agro pour une ville."""
    base = "http://api.openweathermap.org/data/2.5/"
    params = f"appid={WEATHER_API_KEY}&q={city_name}&units=metric&lang=fr"

    cur = requests.get(f"{base}weather?{params}").json()
    if str(cur.get("cod")) == "404":
        return None

    current = {
        "city": cur.get("name", city_name),
        "temp": round(cur["main"]["temp"]),
        "humidity": cur["main"]["humidity"],
        "description": cur["weather"][0]["description"].capitalize(),
        "icon": cur["weather"][0]["icon"],
        "wind": round(cur.get("wind", {}).get("speed", 0) * 3.6),  # m/s -> km/h
    }

    fc = requests.get(f"{base}forecast?{params}").json()
    by_day = {}
    for item in fc.get("list", []):
        day = item["dt_txt"].split(" ")[0]
        d = by_day.setdefault(day, {"temps": [], "hums": [], "rain": 0.0, "descs": [], "icons": []})
        d["temps"].append(item["main"]["temp"])
        d["hums"].append(item["main"]["humidity"])
        d["rain"] += item.get("rain", {}).get("3h", 0.0)
        d["descs"].append(item["weather"][0]["description"])
        d["icons"].append(item["weather"][0]["icon"])

    daily = []
    for day, d in list(by_day.items())[:5]:
        daily.append({
            "date": day,
            "temp_min": round(min(d["temps"])),
            "temp_max": round(max(d["temps"])),
            "humidity": round(sum(d["hums"]) / len(d["hums"])),
            "rain": round(d["rain"], 1),
            "description": max(set(d["descs"]), key=d["descs"].count).capitalize(),
            "icon": d["icons"][len(d["icons"]) // 2],
        })

    return {"current": current, "daily": daily, "alerts": _agro_alerts(daily)}


# ---------------------------------------------------------------------------
# Prompt du chatbot RAG paramétré par la langue de réponse.
# ---------------------------------------------------------------------------
def get_qa_prompt(language_name="français"):
    system = (
        "Ton nom est Koobo, qui signifie « agriculture » en langue mooré. "
        "Tu es un assistant agricole au Burkina Faso et en Afrique de l'Ouest, "
        "expert en agriculture et en agronomie, qui doit communiquer, guider et "
        "aider un agriculteur ou un paysan dans le besoin.\n\n"
        "Réponds de façon détaillée et structurée à partir du contexte fourni. "
        "Si la réponse ne se trouve pas dans le contexte, réponds par toi-même si "
        "tu connais la bonne réponse. Sinon, explique simplement et gentiment que "
        "tu ne connais pas la réponse et invite l'agriculteur à reformuler sa "
        "question ou à en poser une nouvelle.\n\n"
        "Utilise des emojis pour rendre la discussion plus chaleureuse et "
        "accessible.\n"
        f"TRÈS IMPORTANT : réponds UNIQUEMENT en {language_name}. "
        "Emploie un langage simple, concret et adapté à un agriculteur.\n\n"
        "Contexte :\n{context}\n"
    )
    return ChatPromptTemplate.from_messages([
        ("system", system),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])


# Prompt par défaut (français) conservé pour compatibilité.
qa_prompt = get_qa_prompt("français")

contextualize_q_system_prompt = (
    "Given a chat history and the latest user question "
    "which might reference context in the chat history, "
    "formulate a standalone question which can be understood "
    "without the chat history. Do NOT answer the question, "
    "just reformulate it if needed and otherwise return it as is."
)


# ---------------------------------------------------------------------------
# Détection de maladies un seul prompt qui renvoie un JSON structuré.
# ---------------------------------------------------------------------------
def disease_detection_prompt(language_name="français"):
    return (
        "Tu es un expert en agronomie spécialisé dans les maladies des plantes, "
        "au service des agriculteurs d'Afrique de l'Ouest. Analyse l'image de la "
        "plante fournie et renvoie UNIQUEMENT un objet JSON valide, sans texte "
        "autour, avec EXACTEMENT ces clés :\n"
        '{\n'
        '  "nom_maladie": "nom exact et scientifique si possible ; si l\'image est floue ou non reconnaissable, dis-le brièvement",\n'
        '  "cause_maladie": "principales causes",\n'
        '  "symptome_maladie": "principaux symptômes",\n'
        '  "traitement_maladie": "solutions concrètes, durables et accessibles pour lutter contre la maladie"\n'
        '}\n'
        f"Rédige le contenu des valeurs en {language_name}, de façon claire et "
        "pratique. N'ajoute aucun commentaire en dehors du JSON."
    )


# ---------------------------------------------------------------------------
# Speech-to-Text via Groq Whisper (whisper-large-v3).
# Reçoit un chemin de fichier audio, renvoie la transcription texte.
# ---------------------------------------------------------------------------
def transcribe_audio(file_path, language_code="fr"):
    from groq import Groq
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    # Le mooré/dioula/fulfuldé ne sont pas couverts par Whisper : on retombe sur
    # le français pour la transcription, la réponse étant ensuite générée dans la
    # langue choisie par l'utilisateur.
    whisper_lang = language_code if language_code in ("fr", "en") else "fr"
    with open(file_path, "rb") as audio:
        result = client.audio.transcriptions.create(
            file=(os.path.basename(file_path), audio.read()),
            model="whisper-large-v3",
            language=whisper_lang,
            response_format="json",
        )
    return result.text
