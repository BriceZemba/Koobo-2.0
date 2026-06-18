import { Link } from "react-router-dom";
import { MessageSquareText, ScanLine, Sprout, CloudSun, Leaf, Lightbulb, ArrowRight, Mic, Paperclip } from "lucide-react";
import { useUi } from "../context/UiLangContext";

export default function Usage() {
  const { t } = useUi();
  const steps = [
    { icon: MessageSquareText, title: t.usage.chatT, desc: t.usage.chatD, to: "/chat", color: "bg-leaf-100 text-leaf-700" },
    { icon: ScanLine, title: t.usage.detT, desc: t.usage.detD, to: "/detection", color: "bg-amber-100 text-amber-700" },
    { icon: Sprout, title: t.usage.cropT, desc: t.usage.cropD, to: "/crop", color: "bg-lime-500/15 text-leaf-700" },
    { icon: CloudSun, title: t.usage.meteoT, desc: t.usage.meteoD, to: "/meteo", color: "bg-blue-100 text-blue-700" },
  ];
  const tips = [t.usage.tip1, t.usage.tip2, t.usage.tip3];

  return (
    <div className="min-h-screen bg-white pt-[4.5rem]">
      {/* En-tête */}
      <section className="bg-gradient-to-br from-leaf-700 to-leaf-800 py-14 text-white">
        <div className="container-koobo max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-lime-400">
            <Leaf className="h-4 w-4" /> {t.usage.tag}
          </span>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">{t.usage.title}</h1>
          <p className="mt-3 max-w-2xl text-leaf-100">{t.usage.subtitle}</p>
        </div>
      </section>

      {/* Étapes */}
      <section className="py-12">
        <div className="container-koobo max-w-4xl space-y-5">
          {steps.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group flex flex-col gap-4 rounded-3xl border border-leaf-100 bg-white p-6 shadow-card transition-transform hover:-translate-y-1 sm:flex-row sm:items-start"
            >
              <span className={`flex h-14 w-14 flex-none items-center justify-center rounded-2xl ${s.color}`}>
                <s.icon className="h-7 w-7" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-leaf-800">{s.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-soil-500">{s.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-leaf-700">
                  {s.title.replace(/^\d+\.\s*/, "")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Astuces utiles + icônes */}
      <section className="pb-16">
        <div className="container-koobo max-w-4xl">
          <div className="rounded-3xl bg-leaf-50/60 p-7">
            <div className="flex items-center gap-2 text-leaf-800">
              <Lightbulb className="h-5 w-5 text-sun" />
              <h2 className="text-xl font-bold">{t.usage.tipsT}</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-soil-600">
                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-leaf-200 text-xs font-bold text-leaf-800">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-soil-400">
              <span className="inline-flex items-center gap-1.5"><Mic className="h-4 w-4 text-leaf-600" /> {t.voice.i1t}</span>
              <span className="inline-flex items-center gap-1.5"><Paperclip className="h-4 w-4 text-leaf-600" /> {t.chat.attachDoc}</span>
            </div>
            <Link to="/chat" className="btn-primary mt-7">
              {t.usage.cta} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
