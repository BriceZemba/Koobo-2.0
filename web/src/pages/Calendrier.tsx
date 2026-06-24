import { CalendarDays, Leaf, Sprout } from "lucide-react";
import { useUi } from "../context/UiLangContext";

// Repères indicatifs pour le Sahel (saison des pluies ~ juin–octobre).
// À adapter selon la zone agro-climatique précise.
const CROPS = [
  { fr: "Maïs", en: "Maize", semis: "Mai – Juin", recolte: "Sept. – Oct." },
  { fr: "Sorgho", en: "Sorghum", semis: "Juin – Juil.", recolte: "Oct. – Nov." },
  { fr: "Mil", en: "Millet", semis: "Juin – Juil.", recolte: "Oct. – Nov." },
  { fr: "Riz (pluvial)", en: "Rice (rainfed)", semis: "Juin – Juil.", recolte: "Oct. – Nov." },
  { fr: "Niébé (haricot)", en: "Cowpea", semis: "Juin – Juil.", recolte: "Sept. – Oct." },
  { fr: "Arachide", en: "Groundnut", semis: "Juin", recolte: "Oct." },
  { fr: "Coton", en: "Cotton", semis: "Mai – Juin", recolte: "Oct. – Déc." },
  { fr: "Sésame", en: "Sesame", semis: "Juin – Juil.", recolte: "Oct. – Nov." },
  { fr: "Tomate", en: "Tomato", semis: "Sept. – Nov. (contre-saison)", recolte: "Déc. – Mars" },
  { fr: "Oignon", en: "Onion", semis: "Oct. – Nov.", recolte: "Févr. – Avril" },
];

export default function Calendrier() {
  const { ui } = useUi();
  const tr = (fr: string, en: string) => (ui === "en" ? en : fr);

  return (
    <div className="min-h-screen bg-white pt-[4.5rem]">
      <div className="container-koobo max-w-4xl py-8 sm:py-10">
        <div className="mb-7">
          <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-lime-600">
            <Leaf className="h-4 w-4" /> {tr("Repères agricoles", "Farming guide")}
          </span>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold sm:text-4xl">
            <CalendarDays className="h-8 w-8 text-leaf-700" /> {tr("Calendrier cultural", "Crop calendar")}
          </h1>
          <p className="mt-2 text-soil-400">
            {tr("Périodes indicatives de semis et de récolte au Sahel (saison des pluies ≈ juin–octobre). À adapter à votre zone.",
                "Indicative sowing and harvest periods for the Sahel (rainy season ≈ June–October). Adapt to your area.")}
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-leaf-100 shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-leaf-700 text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">{tr("Culture", "Crop")}</th>
                <th className="px-4 py-3 font-semibold">{tr("Semis", "Sowing")}</th>
                <th className="px-4 py-3 font-semibold">{tr("Récolte", "Harvest")}</th>
              </tr>
            </thead>
            <tbody>
              {CROPS.map((c, i) => (
                <tr key={c.fr} className={i % 2 ? "bg-leaf-50/40" : "bg-white"}>
                  <td className="px-4 py-3 font-semibold text-leaf-800">
                    <Sprout className="mr-1.5 inline h-4 w-4 text-leaf-600" />{tr(c.fr, c.en)}
                  </td>
                  <td className="px-4 py-3 text-soil-600">{c.semis}</td>
                  <td className="px-4 py-3 text-soil-600">{c.recolte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-soil-400">
          {tr("Ces repères sont génériques. Pour un conseil précis selon votre sol et la météo locale, utilisez l'Assistant et la Recommandation de cultures.",
              "These are generic guidelines. For precise advice based on your soil and local weather, use the Assistant and Crop recommendation.")}
        </p>
      </div>
    </div>
  );
}
