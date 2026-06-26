import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, LogIn, ChevronDown } from "lucide-react";
import UiLangSelect from "./UiLangSelect";
import { useUi } from "../context/UiLangContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { t } = useUi();
  const { user, enabled, signOut } = useAuth();

  // Les outils sont regroupés dans un menu déroulant « Outils ».
  const tools = [
    { to: "/chat", label: t.nav.assistant },
    { to: "/detection", label: t.nav.detection },
    { to: "/crop", label: t.nav.crops },
    { to: "/meteo", label: t.nav.weather },
    { to: "/calendrier", label: t.nav.calendrier },
  ];
  // 4 entrées principales : Accueil · Outils (dropdown) · Offre · Utilisation.
  const mainLinks = [
    { to: "/offre", label: t.nav.offre },
    { to: "/usage", label: t.nav.usage },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  // Sur le hero de l'accueil (fond vert foncé) et non défilé → texte clair.
  const onHero = loc.pathname === "/" && !scrolled;
  const toolsActive = tools.some((tool) => loc.pathname === tool.to);

  // Styles partagés pour une entrée de premier niveau (Accueil, Offre…).
  const topItem = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
      active
        ? onHero
          ? "bg-white/20 text-white"
          : "bg-leaf-100 text-leaf-800"
        : onHero
        ? "text-white/90 hover:bg-white/15"
        : "text-soil-600 hover:text-leaf-700"
    }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        onHero ? "bg-transparent" : "bg-cream/95 backdrop-blur-md shadow-card"
      }`}
    >
      <nav className="container-koobo flex h-[4.5rem] items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="KOOBO" className="h-9 w-9 object-contain" />
          <span className={`font-display text-2xl font-extrabold ${onHero ? "text-white" : "text-leaf-800"}`}>KOOBO</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <NavLink to="/" end className={({ isActive }) => topItem(isActive)}>
            {t.nav.home}
          </NavLink>

          {/* Outils — menu déroulant au survol (desktop). */}
          <div className="group relative">
            <button type="button" className={`${topItem(toolsActive)} flex items-center gap-1`}>
              {t.nav.tools}
              <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
              <div className="min-w-[12rem] rounded-2xl border border-leaf-100 bg-white p-2 shadow-card">
                {tools.map((tool) => (
                  <NavLink
                    key={tool.to}
                    to={tool.to}
                    className={({ isActive }) =>
                      `block rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        isActive ? "bg-leaf-100 text-leaf-800" : "text-soil-600 hover:bg-leaf-50 hover:text-leaf-700"
                      }`
                    }
                  >
                    {tool.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {mainLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => topItem(isActive)}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <UiLangSelect light={onHero} />
          <NavLink to="/profil" title={t.nav.profil}
            className={({ isActive }) => `flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              isActive ? "bg-leaf-100 text-leaf-800" : onHero ? "bg-white/15 text-white hover:bg-white/25" : "bg-leaf-50 text-leaf-700 hover:bg-leaf-100"}`}>
            <User className="h-5 w-5" />
          </NavLink>
          {enabled && (user
            ? <button onClick={signOut} title={t.nav.logout}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${onHero ? "bg-white/15 text-white hover:bg-white/25" : "bg-leaf-50 text-leaf-700 hover:bg-leaf-100"}`}>
                <LogOut className="h-5 w-5" />
              </button>
            : <Link to="/auth" className={`text-sm font-semibold transition-colors ${onHero ? "text-white/90 hover:text-white" : "text-soil-600 hover:text-leaf-700"}`}>
                {t.nav.login}
              </Link>)}
          <Link to="/chat" className="btn-primary px-5 py-2.5 text-sm">
            {t.nav.talk}
          </Link>
        </div>

        <button className={`lg:hidden ${onHero ? "text-white" : "text-leaf-800"}`} onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-leaf-100 bg-cream/98 backdrop-blur-md">
          <div className="container-koobo flex flex-col gap-1 py-4">
            <NavLink to="/" end className={({ isActive }) => `rounded-xl px-4 py-3 font-semibold ${isActive ? "bg-leaf-100 text-leaf-800" : "text-soil-600"}`}>
              {t.nav.home}
            </NavLink>

            {/* Outils — liste à plat sur mobile. */}
            <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-soil-400">{t.nav.tools}</p>
            {tools.map((tool) => (
              <NavLink
                key={tool.to}
                to={tool.to}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 font-semibold ${isActive ? "bg-leaf-100 text-leaf-800" : "text-soil-600"}`
                }
              >
                {tool.label}
              </NavLink>
            ))}

            {mainLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `rounded-xl px-4 py-3 font-semibold ${isActive ? "bg-leaf-100 text-leaf-800" : "text-soil-600"}`}>
                {l.label}
              </NavLink>
            ))}

            <NavLink to="/profil" className={({ isActive }) => `flex items-center gap-2 rounded-xl px-4 py-3 font-semibold ${isActive ? "bg-leaf-100 text-leaf-800" : "text-soil-600"}`}>
              <User className="h-5 w-5" /> {t.nav.profil}
            </NavLink>
            {enabled && (user
              ? <button onClick={signOut} className="flex items-center gap-2 rounded-xl px-4 py-3 text-left font-semibold text-soil-600">
                  <LogOut className="h-5 w-5" /> {t.nav.logout}
                </button>
              : <Link to="/auth" className="flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-soil-600">
                  <LogIn className="h-5 w-5" /> {t.nav.login}
                </Link>)}

            <div className="mt-2 flex items-center justify-between px-2">
              <UiLangSelect />
              <Link to="/chat" className="btn-primary px-5 py-2.5 text-sm">
                {t.nav.talk}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
