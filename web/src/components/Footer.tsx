import { Link } from "react-router-dom";
import { Sprout, Mail, MapPin } from "lucide-react";
import { useUi } from "../context/UiLangContext";

export default function Footer() {
  const { t } = useUi();
  return (
    <footer className="bg-leaf-900 text-leaf-100">
      <div className="container-koobo grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="KOOBO" className="h-9 w-9 object-contain" />
            <span className="font-display text-2xl font-extrabold text-white">KOOBO</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-leaf-200">{t.footer.tagline}</p>
          <div className="mt-5 flex items-center gap-2 text-sm text-leaf-200">
            <Sprout className="h-4 w-4 text-lime-400" /> {t.footer.motto}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">{t.footer.platform}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/chat" className="hover:text-white">{t.nav.assistant}</Link></li>
            <li><Link to="/detection" className="hover:text-white">{t.nav.detection}</Link></li>
            <li><Link to="/crop" className="hover:text-white">{t.nav.crops}</Link></li>
            <li><Link to="/meteo" className="hover:text-white">{t.nav.weather}</Link></li>
            <li><Link to="/usage" className="hover:text-white">{t.nav.usage}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">{t.footer.contact}</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-lime-400" /> bricezemba336@gmail.com</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-lime-400" /> Ouagadougou, Burkina Faso</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-leaf-800">
        <div className="container-koobo flex flex-col items-center justify-between gap-2 py-5 text-xs text-leaf-300 sm:flex-row">
          <span>© {new Date().getFullYear()} KOOBO. {t.footer.rights}</span>
          <span>{t.footer.candidate}</span>
        </div>
      </div>
    </footer>
  );
}
