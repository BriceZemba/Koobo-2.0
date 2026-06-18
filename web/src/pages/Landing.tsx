import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Mic, Leaf, Sprout, ScanLine, MessageSquareText, Languages,
  ArrowRight, CheckCircle2, Volume2, Smartphone, HeartHandshake, Camera,
  Award, Quote, Star, Sun, Droplets,
} from "lucide-react";
import CountUp from "../components/CountUp";
import { useUi } from "../context/UiLangContext";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} transition={{ delay }}>
      {children}
    </motion.div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-lime-600">
      <Leaf className="h-4 w-4" /> {children}
    </span>
  );
}

export default function Landing() {
  const { t, ui } = useUi();

  const features = [
    { icon: MessageSquareText, title: t.features.f1t, desc: t.features.f1d, to: "/chat", tag: "Chatbot RAG" },
    { icon: ScanLine, title: t.features.f2t, desc: t.features.f2d, to: "/detection", tag: "Vision IA" },
    { icon: Sprout, title: t.features.f3t, desc: t.features.f3d, to: "/crop", tag: "Machine Learning" },
  ];
  const steps = [
    { icon: Languages, title: t.how.s1t, desc: t.how.s1d },
    { icon: Mic, title: t.how.s2t, desc: t.how.s2d },
    { icon: CheckCircle2, title: t.how.s3t, desc: t.how.s3d },
  ];
  const heroStats = [
    { value: "3", label: t.hero.s1 }, { value: "5", label: t.hero.s2 },
    { value: "22", label: t.hero.s3 }, { value: "24/7", label: t.hero.s4 },
  ];
  const benefits = [t.about.b1, t.about.b2, t.about.b3, t.about.b4];
  const testimonials = ui === "en" ? [
    { quote: "I photographed my sick maize leaves and Koobo told me what to do, in my language. Very simple.", name: "Salif O.", role: "Maize farmer, Kaya" },
    { quote: "Before, I had to wait for the extension agent. Now I ask by voice and get the answer right away.", name: "Aminata S.", role: "Market gardener, Bobo-Dioulasso" },
    { quote: "The crop recommendation helped me choose what to sow for my soil. My yields improved.", name: "Ibrahim T.", role: "Farming cooperative, Ouahigouya" },
  ] : [
    { quote: "J'ai photographié mes feuilles de maïs malades et Koobo m'a expliqué quoi faire, dans ma langue. Très simple.", name: "Salif O.", role: "Producteur de maïs, Kaya" },
    { quote: "Avant je devais attendre l'agent agricole. Maintenant je pose ma question à la voix et j'ai la réponse tout de suite.", name: "Aminata S.", role: "Maraîchère, Bobo-Dioulasso" },
    { quote: "La recommandation de culture m'a aidé à choisir quoi semer selon mon sol. Mes rendements se sont améliorés.", name: "Ibrahim T.", role: "Coopérative agricole, Ouahigouya" },
  ];

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <div className="absolute inset-0">
          <img src="/farm-hero.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-leaf-900/90 via-leaf-900/70 to-leaf-700/40" />
        </div>
        <div className="container-koobo relative flex min-h-[92vh] flex-col justify-center pt-28 pb-16">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-3xl">
            <span className="chip bg-white/15 text-lime-400 backdrop-blur"><Leaf className="h-4 w-4" /> {t.hero.badge}</span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
              {t.hero.title} <span className="text-lime-400">KOOBO</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-leaf-100 sm:text-lg">{t.hero.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/chat" className="btn-primary text-base"><Mic className="h-5 w-5" /> {t.hero.cta1}</Link>
              <Link to="/detection" className="btn bg-white/15 text-white backdrop-blur hover:bg-white/25"><Camera className="h-5 w-5" /> {t.hero.cta2}</Link>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
              {heroStats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <div className="font-display text-2xl font-bold text-lime-400">{s.value}</div>
                  <div className="text-xs text-leaf-100">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none"><path fill="#F7F9F3" d="M0,48 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" /></svg>
        </div>
      </section>

      {/* ABOUT */}
      <section className="relative py-16 sm:py-20">
        <Leaf className="pointer-events-none absolute right-6 top-10 hidden h-40 w-40 rotate-12 text-leaf-100 sm:block" />
        <div className="container-koobo grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] rounded-tr-[5rem] shadow-soft">
                <img src="/field.jpg" alt="" className="h-72 w-full object-cover sm:h-[420px]" />
              </div>
              <div className="absolute -left-2 top-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card sm:-left-4 sm:top-8 sm:px-5 sm:py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-700 text-white sm:h-12 sm:w-12"><Award className="h-6 w-6" /></span>
                <div>
                  <div className="font-display text-xl font-bold text-leaf-800 sm:text-2xl">100%</div>
                  <div className="text-xs text-soil-400">{t.about.badge}</div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <Tag>{t.about.tag}</Tag>
              <h2 className="mt-3 text-2xl font-bold sm:text-4xl">{t.about.title}</h2>
              <p className="mt-5 leading-relaxed text-soil-500">{t.about.text}</p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-soil-600"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-leaf-600" /> {b}</li>
                ))}
              </ul>
              <Link to="/chat" className="btn-primary mt-8">{t.about.cta} <ArrowRight className="h-5 w-5" /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-leaf-800 py-12 text-white sm:py-14">
        <div className="container-koobo grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[{ n: 3, s: "", l: t.stats.s1 }, { n: 5, s: "", l: t.stats.s2 }, { n: 22, s: "", l: t.stats.s3 }, { n: 100, s: "%", l: t.stats.s4 }].map((x, i) => (
            <Reveal key={x.l} delay={i * 0.08}>
              <div>
                <div className="font-display text-4xl font-extrabold text-lime-400 sm:text-5xl"><CountUp to={x.n} suffix={x.s} /></div>
                <div className="mt-1 text-sm text-leaf-100">{x.l}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 sm:py-20">
        <div className="container-koobo">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Tag>{t.features.tag}</Tag>
              <h2 className="mt-3 text-2xl font-bold sm:text-4xl">{t.features.title}</h2>
              <p className="mt-4 text-soil-500">{t.features.subtitle}</p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1}>
                <Link to={f.to} className="card group relative block h-full overflow-hidden p-7 transition-transform hover:-translate-y-1.5">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-leaf-50 transition-colors group-hover:bg-lime-500/15" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700 transition-colors group-hover:bg-leaf-700 group-hover:text-white"><f.icon className="h-7 w-7" /></div>
                  <div className="relative mt-5 text-xs font-semibold uppercase tracking-wide text-lime-600">{f.tag}</div>
                  <h3 className="relative mt-1 text-xl font-bold">{f.title}</h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-soil-500">{f.desc}</p>
                  <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold text-leaf-700">{t.features.try} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="relative py-16 sm:py-20">
        <div className="container-koobo grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <Tag>{t.why.tag}</Tag>
              <h2 className="mt-3 text-2xl font-bold sm:text-4xl">{t.why.title}</h2>
              <p className="mt-5 leading-relaxed text-soil-500">{t.why.text}</p>
              <div className="mt-8 space-y-5">
                {[{ icon: Sun, x: t.why.i1t, d: t.why.i1d }, { icon: Droplets, x: t.why.i2t, d: t.why.i2d }, { icon: Smartphone, x: t.why.i3t, d: t.why.i3d }].map((it) => (
                  <div key={it.x} className="flex items-start gap-4">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700"><it.icon className="h-6 w-6" /></span>
                    <div><div className="font-bold text-leaf-800">{it.x}</div><div className="text-sm text-soil-500">{it.d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] rounded-bl-[5rem] shadow-soft"><img src="/leaf.jpg" alt="" className="h-72 w-full object-cover sm:h-[420px]" /></div>
              <div className="absolute -bottom-5 left-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-card"><CheckCircle2 className="h-6 w-6 text-leaf-600" /><span className="text-sm font-semibold text-leaf-800">{t.why.badge}</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VOICE */}
      <section className="bg-leaf-900 py-16 text-white sm:py-20">
        <div className="container-koobo grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="chip bg-white/10 text-lime-400">{t.voice.tag}</span>
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-4xl">{t.voice.title}</h2>
              <p className="mt-5 leading-relaxed text-leaf-100">{t.voice.text}</p>
              <ul className="mt-7 space-y-4">
                {[{ icon: Mic, x: t.voice.i1t, d: t.voice.i1d }, { icon: Languages, x: t.voice.i2t, d: t.voice.i2d }, { icon: Smartphone, x: t.voice.i3t, d: t.voice.i3d }].map((it) => (
                  <li key={it.x} className="flex items-start gap-4">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-lime-500/20 text-lime-400"><it.icon className="h-5 w-5" /></span>
                    <div><div className="font-semibold text-white">{it.x}</div><div className="text-sm text-leaf-200">{it.d}</div></div>
                  </li>
                ))}
              </ul>
              <Link to="/chat" className="btn-primary mt-9 bg-lime-500 text-leaf-900 hover:bg-lime-400"><Volume2 className="h-5 w-5" /> {t.voice.cta}</Link>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="relative">
              <div className="card overflow-hidden bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <img src="/logo.png" className="h-9 w-9" alt="" />
                  <div><div className="font-semibold text-white">Koobo</div><div className="text-xs text-lime-400">● online</div></div>
                </div>
                <div className="space-y-4 py-5">
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-lime-500 px-4 py-2.5 text-sm text-leaf-900">🎤 « ... »</div>
                  <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm text-leaf-50">🌽 ...<div className="mt-2 inline-flex items-center gap-1 text-xs text-lime-400"><Volume2 className="h-3.5 w-3.5" /> {t.chat.listen}</div></div>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 animate-floaty rounded-2xl bg-sun px-4 py-2 text-sm font-bold text-leaf-900 shadow-soft">5 🌍</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW */}
      <section className="py-16 sm:py-20">
        <div className="container-koobo">
          <Reveal><div className="mx-auto max-w-2xl text-center"><Tag>{t.how.tag}</Tag><h2 className="mt-3 text-2xl font-bold sm:text-4xl">{t.how.title}</h2></div></Reveal>
          <div className="relative mt-14 grid gap-7 md:grid-cols-3">
            <div className="absolute left-1/4 right-1/4 top-12 hidden border-t-2 border-dashed border-leaf-200 md:block" />
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="card relative h-full p-7 text-center">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-leaf-700 px-3 py-1 text-sm font-bold text-white">{i + 1}</div>
                  <div className="mx-auto mt-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-500/15 text-leaf-700"><s.icon className="h-7 w-7" /></div>
                  <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-soil-500">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="container-koobo">
          <Reveal><div className="mx-auto max-w-2xl text-center"><Tag>{t.testi.tag}</Tag><h2 className="mt-3 text-2xl font-bold sm:text-4xl">{t.testi.title}</h2></div></Reveal>
          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {testimonials.map((tt, i) => (
              <Reveal key={tt.name} delay={i * 0.1}>
                <div className="card relative h-full p-7">
                  <Quote className="h-9 w-9 text-leaf-100" />
                  <p className="mt-3 text-sm leading-relaxed text-soil-600">“{tt.quote}”</p>
                  <div className="mt-5 flex items-center gap-1 text-sun">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}</div>
                  <div className="mt-4 border-t border-leaf-50 pt-4"><div className="font-bold text-leaf-800">{tt.name}</div><div className="text-xs text-soil-400">{tt.role}</div></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section className="py-16 sm:py-20">
        <div className="container-koobo">
          <div className="card grid items-center gap-10 overflow-hidden bg-gradient-to-br from-leaf-700 to-leaf-800 p-8 text-white md:grid-cols-2 md:p-14">
            <Reveal>
              <div>
                <span className="chip bg-white/10 text-lime-400"><HeartHandshake className="h-4 w-4" /> {t.impact.tag}</span>
                <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{t.impact.title}</h2>
                <p className="mt-4 leading-relaxed text-leaf-100">{t.impact.text}</p>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="grid grid-cols-2 gap-4">
                {[{ v: "−40%", l: t.impact.m1 }, { v: "100×", l: t.impact.m2 }, { v: "♀", l: t.impact.m3 }, { v: "🌱", l: t.impact.m4 }].map((x) => (
                  <div key={x.l} className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur"><div className="font-display text-2xl font-bold text-lime-400">{x.v}</div><div className="mt-1 text-xs text-leaf-100">{x.l}</div></div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="container-koobo">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-leaf-900 px-8 py-16 text-center text-white">
              <div className="absolute inset-0 opacity-20"><img src="/leaf.jpg" alt="" className="h-full w-full object-cover" /></div>
              <div className="relative">
                <h2 className="text-2xl font-bold text-white sm:text-4xl">{t.finalCta.title}</h2>
                <p className="mx-auto mt-4 max-w-xl text-leaf-100">{t.finalCta.text}</p>
                <Link to="/chat" className="btn-primary mt-8 bg-lime-500 text-leaf-900 hover:bg-lime-400">{t.finalCta.btn} <ArrowRight className="h-5 w-5" /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
