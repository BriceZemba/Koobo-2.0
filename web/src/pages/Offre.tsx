import { Link } from "react-router-dom";
import { Check, Leaf, Sparkles, Smartphone, ArrowRight } from "lucide-react";
import { useUi } from "../context/UiLangContext";

export default function Offre() {
  const { ui } = useUi();
  const tr = (fr: string, en: string) => (ui === "en" ? en : fr);

  const free = [
    tr("Assistant agronomique (chat texte et voix)", "Agronomic assistant (text & voice chat)"),
    tr("1 diagnostic de maladie par photo / jour", "1 disease photo diagnosis / day"),
    tr("Recommandation de cultures (limitée)", "Crop recommendation (limited)"),
    tr("Météo & alertes agronomiques", "Weather & agronomic alerts"),
  ];
  const premium = [
    tr("Tout le plan Gratuit, sans limite", "Everything in Free, with no limits"),
    tr("Diagnostics photo illimités", "Unlimited photo diagnoses"),
    tr("Détection vidéo en temps réel", "Real-time video detection"),
    tr("Recommandation de cultures avancée", "Advanced crop recommendation"),
    tr("Documents personnels & priorité de réponse", "Personal documents & priority answers"),
  ];

  function subscribe() {
    const msg = encodeURIComponent(tr(
      "Bonjour, je souhaite m'abonner à KOOBO Premium (Mobile Money).",
      "Hello, I'd like to subscribe to KOOBO Premium (Mobile Money)."));
    const n = import.meta.env.VITE_WHATSAPP_NUMBER || "";
    window.open(n ? `https://wa.me/${n}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-white pt-[4.5rem]">
      <div className="container-koobo max-w-5xl py-10">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-lime-600">
            <Leaf className="h-4 w-4" /> {tr("Nos offres", "Our plans")}
          </span>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{tr("Un plan pour chaque agriculteur", "A plan for every farmer")}</h1>
          <p className="mt-3 text-soil-400">{tr("Commencez gratuitement. Passez en Premium quand vous voulez.", "Start free. Upgrade to Premium anytime.")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Gratuit */}
          <div className="rounded-3xl border border-leaf-100 bg-white p-8 shadow-card">
            <h2 className="text-xl font-bold text-leaf-800">{tr("Gratuit", "Free")}</h2>
            <div className="mt-2 font-display text-4xl font-extrabold text-leaf-900">0 <span className="text-base font-semibold text-soil-400">FCFA</span></div>
            <p className="mt-1 text-sm text-soil-400">{tr("Pour découvrir et utiliser l'essentiel.", "To discover and use the essentials.")}</p>
            <ul className="mt-6 space-y-3">
              {free.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-soil-600"><Check className="mt-0.5 h-5 w-5 flex-none text-leaf-600" /> {f}</li>
              ))}
            </ul>
            <Link to="/chat" className="btn-outline mt-7 w-full">{tr("Commencer gratuitement", "Start for free")}</Link>
          </div>

          {/* Premium */}
          <div className="relative rounded-3xl border-2 border-leaf-600 bg-gradient-to-br from-leaf-700 to-leaf-800 p-8 text-white shadow-soft">
            <span className="absolute -top-3 right-6 rounded-full bg-sun px-3 py-1 text-xs font-bold text-leaf-900">{tr("RECOMMANDÉ", "RECOMMENDED")}</span>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white"><Sparkles className="h-5 w-5 text-lime-400" /> Premium</h2>
            <div className="mt-2 font-display text-4xl font-extrabold text-white">500 <span className="text-base font-semibold text-leaf-100">FCFA / {tr("mois", "month")}</span></div>
            <p className="mt-1 text-sm text-leaf-100">{tr("Pour aller plus loin, sans limites.", "To go further, with no limits.")}</p>
            <ul className="mt-6 space-y-3">
              {premium.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-leaf-50"><Check className="mt-0.5 h-5 w-5 flex-none text-lime-400" /> {f}</li>
              ))}
            </ul>
            <button onClick={subscribe} className="btn-primary mt-7 w-full bg-lime-500 text-leaf-900 hover:bg-lime-400">
              <Smartphone className="h-5 w-5" /> {tr("S'abonner via Mobile Money", "Subscribe via Mobile Money")}
            </button>
            <p className="mt-3 text-center text-xs text-leaf-200">{tr("Orange Money · Moov Money", "Orange Money · Moov Money")}</p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-leaf-50/60 p-6 text-center">
          <h3 className="font-bold text-leaf-800">{tr("Coopératives, ONG, agro-industrie ?", "Cooperatives, NGOs, agribusiness?")}</h3>
          <p className="mt-2 text-sm text-soil-500">{tr("Des licences B2B sur mesure pour équiper vos membres ou vos équipes.", "Tailored B2B licenses to equip your members or teams.")}</p>
          <button onClick={subscribe} className="btn-ghost mt-4">{tr("Nous contacter", "Contact us")} <ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
