import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface LangCtx {
  lang: string;
  setLang: (l: string) => void;
}

const Ctx = createContext<LangCtx>({ lang: "fr", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<string>(() => localStorage.getItem("koobo_lang") || "fr");
  const update = (l: string) => {
    setLang(l);
    localStorage.setItem("koobo_lang", l);
  };
  return <Ctx.Provider value={{ lang, setLang: update }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
