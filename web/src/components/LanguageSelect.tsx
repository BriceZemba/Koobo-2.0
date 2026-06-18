import { Globe } from "lucide-react";
import { LANGUAGES } from "../lib/api";
import { useLang } from "../context/LanguageContext";

export default function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <label className={`inline-flex items-center gap-2 ${compact ? "" : "rounded-full bg-leaf-50 px-3 py-1.5"}`}>
      <Globe className="h-4 w-4 text-leaf-700" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="bg-transparent text-sm font-semibold text-leaf-800 focus:outline-none cursor-pointer"
        aria-label="Choisir la langue"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
