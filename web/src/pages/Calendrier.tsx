import { CalendarDays, Leaf, Sprout, CloudRain, Sun } from "lucide-react";
import { useUi } from "../context/UiLangContext";

// Repères indicatifs pour le Sahel. season: "p" = pluviale, "c" = contre-saison.
const CROPS = [
  { fr: "Maïs", en: "Maize", semis: "Mai – Juin", recolte: "Sept. – Oct.", season: "p" },
  { fr: "Sorgho", en: "Sorghum", semis: "Juin – Juil.", recolte: "Oct. – Nov.", season: "p" },
  { fr: "Mil", en: "Millet", semis: "Juin – Juil.", recolte: "Oct. – Nov.", season: "p" },
  { fr: "Riz (pluvial)", en: "Rice (rainfed)", semis: "Juin – Juil.", recolte: "Oct. – Nov.", season: "p" },
  { fr: "Niébé (haricot)", en: "Cowpea", semis: "Juin – Juil.", recolte: "Sept. – Oct.", season: "p" },
  { fr: "Arachide", en: "Groundnut", semis: "Juin", recolte: "Oct.", season: "p" },
  { fr: "Coton", en: "Cotton", semis: "Mai – Juin", recolte: "Oct. – Déc.", season: "p" },
  { fr: "Sésame", en: "Sesame", semis: "Juin – Juil.", recolte: "Oct. – Nov.", season: "p" },
  { fr: "Tomate", en: "Tomato", semis: "Sept. – Nov.", recolte: "Déc. – Mars", season: "c" },
  { fr: "Oignon", en: "Onion", semis: "Oct. – Nov.", recolte: "Févr. – Avril", season: "c" },
];

export default function Calendrier() {
  const { ui } = useUi();
  const tr = (fr: string, en: string) => (ui === "en" ? en : fr);
  const seasonTag = (s: string) =>
    s === "p"
      ? { label: tr("Pluviale", "Rainy"), cls: "bg-blue-100 text-blue-700", Icon: CloudRain }
      : { label: tr("Contre-saison", "Dry-season"), cls: "bg-amber-100 text-amber-700", Icon: Sun };

  return (
    <div className="min-h-screen bg-white pt-[4.5rem]">
      {/* En-tête dégradé */}
      <section className="bg-gradient-to-br from-leaf-700 to-leaf-800 py-12 text-white">
        <div className="container-koobo max-w-4xl">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime-300">
            <Leaf className="h-4 w-4" /> {tr("Repères agricoles", "Farming guide")}
          </span>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-white sm:text-4xl">
            <CalendarDays className="h-9 w-9 text-lime-300" /> {tr("Calendrier cultural", "Crop calendar")}
          </h1>
          <p className="mt-3 max-w-2xl text-leaf-100">
            {tr("Périodes indicatives de semis et de récolte au Sahel (saison des pluies ≈ juin–octobre).",
                "Indicative sowing and harvest periods for the Sahel (rainy season ≈ June–October).")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur"><CloudRain className="h-4 w-4 text-blue-200" /> {tr("Culture pluviale", "Rainy-season crop")}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur"><Sun className="h-4 w-4 text-amber-200" /> {tr("Contre-saison (irriguée)", "Dry-season (irrigated)")}</span>
          </div>
        </div>
      </section>

      <div className="container-koobo max-w-4xl py-8 sm:py-10">
        <div className="-mt-16 overflow-hidden rounded-3xl border border-leaf-100 bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-leaf-50 text-leaf-800">
              <tr>
                <th className="px-4 py-3 font-semibold">{tr("Culture", "Crop")}</th>
                <th className="px-4 py-3 font-semibold">{tr("Saison", "Season")}</th>
                <th className="px-4 py-3 font-semibold">{tr("Semis", "Sowing")}</th>
                <th className="px-4 py-3 font-semibold">{tr("Récolte", "Harvest")}</th>
              </tr>
            </thead>
            <tbody>
              {CROPS.map((c, i) => {
                const s = seasonTag(c.season);
                return (
                  <tr key={c.fr} className={i % 2 ? "bg-leaf-50/30" : "bg-white"}>
                    <td className="px-4 py-3 font-semibold text-leaf-800">
                      <Sprout className="mr-1.5 inline h-4 w-4 text-leaf-600" />{tr(c.fr, c.en)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
                        <s.Icon className="h-3.5 w-3.5" /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-soil-600">{c.semis}</td>
                    <td className="px-4 py-3 text-soil-600">{c.recolte}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-soil-400">
          {tr("Repères génériques. Pour un conseil précis selon votre sol et la météo, utilisez l'Assistant et la Recommandation de cultures.",
              "Generic guidelines. For precise advice based on your soil and weather, use the Assistant and Crop recommendation.")}
        </p>
      </div>
    </div>
  );
}
