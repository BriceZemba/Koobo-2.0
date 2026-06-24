import { useState } from "react";
import { Sprout, Loader2, Thermometer, Droplets, MapPin, Wheat, Leaf } from "lucide-react";
import { recommendCrop } from "../lib/api";
import type { CropResult } from "../lib/api";
import CitySearch from "../components/CitySearch";
import { useUi } from "../context/UiLangContext";
import { getProfile } from "../lib/profile";

interface FormState {
  nitrogen: number;
  phosphorous: number;
  potassium: number;
  ph: number;
  rainfall: number;
}

export default function Crop() {
  const { t } = useUi();
  const _p = getProfile();
  const [form, setForm] = useState<FormState>({ nitrogen: _p.nitrogen, phosphorous: _p.phosphorous, potassium: _p.potassium, ph: _p.ph, rainfall: _p.rainfall });
  const [city, setCity] = useState(_p.city || "Ouagadougou");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CropResult | null>(null);
  const [error, setError] = useState("");

  const fields: { key: keyof FormState; label: string; min: number; max: number; step?: number; unit?: string }[] = [
    { key: "nitrogen", label: t.crop.nitrogen, min: 0, max: 140, unit: "kg/ha" },
    { key: "phosphorous", label: t.crop.phosphorus, min: 0, max: 145, unit: "kg/ha" },
    { key: "potassium", label: t.crop.potassium, min: 0, max: 205, unit: "kg/ha" },
    { key: "ph", label: t.crop.ph, min: 0, max: 14, step: 0.1 },
    { key: "rainfall", label: t.crop.rainfall, min: 0, max: 300, unit: "mm" },
  ];

  async function submit() {
    if (!city.trim()) { setError(t.crop.cityNotFound); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await recommendCrop({ ...form, city }));
    } catch (e: any) {
      setError(e.message === "city_not_found" ? t.crop.cityNotFound : e.message || "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white pt-[4.5rem]">
      <div className="container-koobo max-w-5xl py-8 sm:py-10">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-lime-600"><Leaf className="h-4 w-4" /> {t.crop.tag}</span>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t.crop.title}</h1>
          <p className="mt-2 text-soil-400">{t.crop.subtitle}</p>
        </div>

        <div className="grid gap-7 lg:grid-cols-5">
          <div className="rounded-3xl border border-leaf-100 bg-white p-6 shadow-card sm:p-7 lg:col-span-3">
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold text-leaf-800"><MapPin className="mr-1 inline h-4 w-4" /> {t.crop.city}</label>
              <CitySearch value={city} onChange={setCity} placeholder={t.crop.cityPh} />
            </div>
            <div className="space-y-5">
              {fields.map((f) => (
                <div key={f.key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-leaf-800">{f.label}</span>
                    <span className="rounded-md bg-leaf-50 px-2 py-0.5 font-mono text-leaf-700">{form[f.key]} {f.unit}</span>
                  </div>
                  <input type="range" min={f.min} max={f.max} step={f.step || 1} value={form[f.key]} onChange={(e) => setForm((s) => ({ ...s, [f.key]: Number(e.target.value) }))} className="w-full accent-leaf-700" />
                </div>
              ))}
            </div>
            <button onClick={submit} disabled={loading} className="btn-primary mt-7 w-full disabled:opacity-40">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wheat className="h-5 w-5" />}
              {loading ? t.crop.computing : t.crop.recommend}
            </button>
            {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
          </div>

          <div className="lg:col-span-2">
            {result ? (
              <div className="overflow-hidden rounded-3xl border border-leaf-100 shadow-card">
                <div className="bg-gradient-to-br from-leaf-700 to-leaf-800 p-7 text-center text-white">
                  <p className="text-sm text-leaf-100">{t.crop.recommended}</p>
                  <div className="mt-2 flex items-center justify-center gap-2"><Sprout className="h-8 w-8 text-lime-400" /><span className="font-display text-3xl font-extrabold capitalize text-white">{result.prediction}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-white p-6">
                  <div className="rounded-2xl bg-leaf-50 p-4 text-center"><Thermometer className="mx-auto h-6 w-6 text-orange-500" /><div className="mt-2 text-xl font-bold text-leaf-800">{result.temperature}°C</div><div className="text-xs text-soil-400">{t.crop.temp}</div></div>
                  <div className="rounded-2xl bg-leaf-50 p-4 text-center"><Droplets className="mx-auto h-6 w-6 text-blue-500" /><div className="mt-2 text-xl font-bold text-leaf-800">{result.humidity}%</div><div className="text-xs text-soil-400">{t.crop.humidity}</div></div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border border-leaf-100 bg-leaf-50/30 p-8 text-center text-soil-400"><Wheat className="h-12 w-12 text-leaf-200" /><p className="mt-3">{t.crop.here}</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
