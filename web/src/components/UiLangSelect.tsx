import { Globe } from "lucide-react";
import { useUi } from "../context/UiLangContext";
import type { UiLang } from "../lib/i18n";

export default function UiLangSelect({ light = false }: { light?: boolean }) {
  const { ui, setUi } = useUi();
  return (
    <label className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${light ? "bg-white/15 backdrop-blur" : "bg-leaf-50"}`}>
      <Globe className={`h-4 w-4 ${light ? "text-white" : "text-leaf-700"}`} />
      <select
        value={ui}
        onChange={(e) => setUi(e.target.value as UiLang)}
        className={`cursor-pointer bg-transparent text-sm font-semibold focus:outline-none ${light ? "text-white" : "text-leaf-800"}`}
        aria-label="Site language"
      >
        <option className="text-leaf-800" value="fr">FR</option>
        <option className="text-leaf-800" value="en">EN</option>
      </select>
    </label>
  );
}
