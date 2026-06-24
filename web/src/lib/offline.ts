// Détection HORS-LIGNE dans le navigateur (TensorFlow.js).
// Modèle attendu dans web/public/model/ : model.json + *.bin + classes.json
// (généré par koobo_offline.ipynb). TF.js est chargé à la demande (code-split).
const MODEL_URL = "/model/model.json";
const CLASSES_URL = "/model/classes.json";
const IMG = 224;

let _model: any = null;
let _classes: string[] | null = null;
let _tf: any = null;

export async function isModelAvailable(): Promise<boolean> {
  try {
    const r = await fetch(MODEL_URL, { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
}

async function ensureLoaded() {
  if (_model && _classes && _tf) return;
  _tf = await import("@tensorflow/tfjs"); // chargé seulement au 1er usage
  _model = await _tf.loadLayersModel(MODEL_URL);
  _classes = await fetch(CLASSES_URL).then((r) => r.json());
}

// "Tomato___Late_blight" -> "Tomato — Late blight"
export function prettyLabel(raw: string): string {
  return raw
    .replace(/_+/g, " ")
    .replace(/\s{2,}/g, " — ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export interface OfflineResult {
  label: string;
  raw: string;
  confidence: number; // 0..1
}

export async function predictOffline(img: HTMLImageElement): Promise<OfflineResult> {
  await ensureLoaded();
  const tf = _tf;
  const logits = tf.tidy(() => {
    const t = tf.browser
      .fromPixels(img)
      .resizeBilinear([IMG, IMG])
      .toFloat() // 0-255 : le modèle (include_preprocessing) normalise lui-même
      .expandDims(0);
    return _model.predict(t);
  });
  const data: Float32Array = await logits.data();
  logits.dispose();
  let best = 0;
  for (let i = 1; i < data.length; i++) if (data[i] > data[best]) best = i;
  const raw = (_classes && _classes[best]) || `classe ${best}`;
  return { label: prettyLabel(raw), raw, confidence: data[best] };
}
