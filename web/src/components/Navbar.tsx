import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import UiLangSelect from "./UiLangSelect";
import { useUi } from "../context/UiLangContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { t } = useUi();

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/chat", label: t.nav.assistant },
    { to: "/detection", label: t.nav.detection },
    { to: "/crop", label: t.nav.crops },
    { to: "/meteo", label: t.nav.weather },
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
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? onHero
                      ? "bg-white/20 text-white"
                      : "bg-leaf-100 text-leaf-800"
                    : onHero
                    ? "text-white/90 hover:bg-white/15"
                    : "text-soil-600 hover:text-leaf-700"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <UiLangSelect light={onHero} />
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
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 font-semibold ${isActive ? "bg-leaf-100 text-leaf-800" : "text-soil-600"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
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
