// Client API KOOBO parle au backend Flask.
// En dev : Vite proxy redirige vers http://127.0.0.1:5000.
// En prod : définir VITE_API_URL (ex. https://koobo.onrender.com).
const BASE = import.meta.env.VITE_API_URL || "";

export interface Language {
  code: string;
  label: string;
  voice: string;
}

export const LANGUAGES: Language[] = [
  { code: "fr", label: "Français", voice: "fr-FR" },
  { code: "mos", label: "Mooré", voice: "fr-FR" },
  { code: "dyu", label: "Dioula", voice: "fr-FR" },
  { code: "ff", label: "Fulfuldé", voice: "fr-FR" },
  { code: "en", label: "English", voice: "en-US" },
];

export function voiceFor(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.voice ?? "fr-FR";
}

async function postForm(path: string, form: FormData): Promise<any> {
  const res = await fetch(`${BASE}${path}`, { method: "POST", body: form });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Erreur ${res.status}`);
  }
  return res.json();
}

export function sendChat(query: string, lang: string): Promise<{ answer: string }> {
  const fd = new FormData();
  fd.append("query", query);
  fd.append("lang", lang);
  return postForm("/get_chat_response", fd);
}

export function transcribe(audio: Blob, lang: string): Promise<{ text: string }> {
  const fd = new FormData();
  fd.append("audio", audio, "voice.webm");
  fd.append("lang", lang);
  return postForm("/transcribe", fd);
}

export interface DiseaseResult {
  nom_maladie: string;
  cause_maladie: string;
  symptome_maladie: string;
  traitement_maladie: string;
}

export function detectDisease(image: File, lang: string): Promise<DiseaseResult> {
  const fd = new FormData();
  fd.append("image", image);
  fd.append("lang", lang);
  return postForm("/get_detect_response", fd);
}

export function askAboutImage(image: File, query: string, lang: string): Promise<{ result: string }> {
  const fd = new FormData();
  fd.append("image", image);
  fd.append("query", query);
  fd.append("lang", lang);
  return postForm("/get_detect_chat", fd);
}

export interface CropInput {
  nitrogen: number;
  phosphorous: number;
  potassium: number;
  ph: number;
  rainfall: number;
  city: string;
}

export interface CropResult {
  prediction: string;
  temperature: number;
  humidity: number;
}

export function recommendCrop(input: CropInput): Promise<CropResult> {
  const fd = new FormData();
  Object.entries(input).forEach(([k, v]) => fd.append(k, String(v)));
  return postForm("/api/crop_prediction", fd);
}

export interface WeatherDay {
  date: string;
  temp_min: number;
  temp_max: number;
  humidity: number;
  rain: number;
  description: string;
  icon: string;
}

export interface WeatherData {
  current: {
    city: string;
    temp: number;
    humidity: number;
    description: string;
    icon: string;
    wind: number;
  };
  daily: WeatherDay[];
  alerts: { level: string; icon: string; text: string }[];
}

export interface CitySuggestion {
  name: string;
  label: string;
  country: string;
}

export async function searchCities(q: string): Promise<CitySuggestion[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(`${BASE}/api/cities?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getWeather(city: string): Promise<WeatherData> {
  const res = await fetch(`${BASE}/api/weather?city=${encodeURIComponent(city)}`);
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Erreur ${res.status}`);
  }
  return res.json();
}

// ---------------------- Ingestion de documents (RAG) ----------------------
export interface IngestedDoc {
  name: string;
  chunks: number;
}

export async function ingestDocuments(files: File[]): Promise<{ ingested: IngestedDoc[]; total_chunks: number }> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return postForm("/api/ingest", fd);
}

export async function listDocuments(): Promise<IngestedDoc[]> {
  const res = await fetch(`${BASE}/api/documents`);
  if (!res.ok) return [];
  return res.json();
}

export async function deleteDocument(source?: string): Promise<void> {
  const url = source ? `${BASE}/api/documents?source=${encodeURIComponent(source)}` : `${BASE}/api/documents`;
  await fetch(url, { method: "DELETE" });
}

// --- Synthèse vocale (Text-to-Speech) via le navigateur ---
export function speak(text: string, langCode: string) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voiceFor(langCode);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
