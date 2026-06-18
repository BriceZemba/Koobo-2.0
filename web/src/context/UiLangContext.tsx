import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { dicts } from "../lib/i18n";
import type { UiLang, Dict } from "../lib/i18n";

interface Ctx {
  ui: UiLang;
  setUi: (l: UiLang) => void;
  t: Dict;
}

const UiCtx = createContext<Ctx>({ ui: "fr", setUi: () => {}, t: dicts.fr });

export function UiLangProvider({ children }: { children: ReactNode }) {
  const [ui, setUiState] = useState<UiLang>(() => (localStorage.getItem("koobo_ui") as UiLang) || "fr");
  const setUi = (l: UiLang) => {
    setUiState(l);
    localStorage.setItem("koobo_ui", l);
    document.documentElement.lang = l;
  };
  return <UiCtx.Provider value={{ ui, setUi, t: dicts[ui] }}>{children}</UiCtx.Provider>;
}

export const useUi = () => useContext(UiCtx);
