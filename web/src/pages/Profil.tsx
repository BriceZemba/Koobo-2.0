import { useState } from "react";
import { User, Leaf, Save, CheckCircle2, Sprout } from "lucide-react";
import { getProfile, saveProfile } from "../lib/profile";
import type { Profile } from "../lib/profile";
import { useUi } from "../context/UiLangContext";
import CitySearch from "../components/CitySearch";

export default function Profil() {
  const { ui } = useUi();
  const [p, setP] = useState<Profile>(getProfile());
  const [saved, setSaved] = useState(false);

  const tr = (fr: string, en: string) => (ui === "en" ? en : fr);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) {
    setP((s) => ({ ...s, [k]: v }));
    setSaved(false);
  }
  function submit() {
    saveProfile(p);
    setSaved(true);
  }

  const sliders: { k: keyof Profile; label: string; min: number; max: number; step?: number; unit?: string }[] = [
    { k: "nitrogen", label: tr("Azote (N)", "Nitrogen (N)"), min: 0, max: 140, unit: "kg/ha" },
    { k: "phosphorous", label: tr("Phosphore (P)", "Phosphorus (P)"), min: 0, max: 145, unit: "kg/ha" },
    { k: "potassium", label: tr("Potassium (K)", "Potassium (K)"), min: 0, max: 205, unit: "kg/ha" },
    { k: "ph", label: tr("pH du sol", "Soil pH"), min: 0, max: 14, step: 0.1 },
    { k: "rainfall", label: tr("Pluviométrie", "Rainfall"), min: 0, max: 300, unit: "mm" },
  ];

  return (
    <div className="min-h-screen bg-white pt-[4.5rem]">
      {/* En-tête dégradé */}
      <section className="bg-gradient-to-br from-leaf-700 to-leaf-800 py-12 text-white">
        <div className="container-koobo max-w-3xl">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <User className="h-8 w-8 text-lime-300" />
            </span>
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime-300">
                <Leaf className="h-4 w-4" /> {tr("Personnalisation", "Personalization")}
              </span>
              <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">{tr("Mon profil agriculteur", "My farmer profile")}</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-leaf-100">
            {tr("Enregistrez vos informations : Koobo pré-remplit vos formulaires et adapte ses conseils à votre exploitation.",
                "Save your details: Koobo pre-fills your forms and tailors its advice to your farm.")}
          </p>
        </div>
      </section>

      <div className="container-koobo max-w-3xl py-8 sm:py-10">
        <div className="-mt-16 rounded-3xl border border-leaf-100 bg-white p-6 shadow-soft sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-leaf-800"><User className="mr-1 inline h-4 w-4" /> {tr("Nom", "Name")}</label>
              <input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder={tr("Votre nom", "Your name")}
                className="w-full rounded-xl border border-leaf-200 bg-white px-4 py-2.5 text-soil-600 focus:border-leaf-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-leaf-800">{tr("Ville", "City")}</label>
              <CitySearch value={p.city} onChange={(v) => set("city", v)} placeholder={tr("Rechercher une ville…", "Search a city…")} />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-semibold text-leaf-800"><Sprout className="mr-1 inline h-4 w-4" /> {tr("Mes cultures", "My crops")}</label>
            <input value={p.crops} onChange={(e) => set("crops", e.target.value)} placeholder={tr("Ex. maïs, tomate, sorgho", "E.g. maize, tomato, sorghum")}
              className="w-full rounded-xl border border-leaf-200 bg-white px-4 py-2.5 text-soil-600 focus:border-leaf-400 focus:outline-none" />
          </div>

          <p className="mt-6 mb-2 text-sm font-semibold text-leaf-800">{tr("Caractéristiques de mon sol (par défaut)", "My soil characteristics (defaults)")}</p>
          <div className="space-y-4">
            {sliders.map((f) => (
              <div key={f.k}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-soil-600">{f.label}</span>
                  <span className="rounded-md bg-leaf-50 px-2 py-0.5 font-mono text-leaf-700">{p[f.k] as number} {f.unit}</span>
                </div>
                <input type="range" min={f.min} max={f.max} step={f.step || 1} value={p[f.k] as number}
                  onChange={(e) => set(f.k, Number(e.target.value) as never)} className="w-full accent-leaf-700" />
              </div>
            ))}
          </div>

          <button onClick={submit} className="btn-primary mt-7 w-full">
            {saved ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
            {saved ? tr("Profil enregistré ✓", "Profile saved ✓") : tr("Enregistrer mon profil", "Save my profile")}
          </button>
          {saved && (
            <p className="mt-3 text-center text-sm text-leaf-700">
              {tr("Vos cultures et votre météo sont maintenant pré-remplies.", "Your crops and weather are now pre-filled.")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
