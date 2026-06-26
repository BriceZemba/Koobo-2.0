import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Mail, Lock, Loader2, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiLangContext";

export default function Auth() {
  const { signIn, signUp, enabled } = useAuth();
  const { ui } = useUi();
  const nav = useNavigate();
  const tr = (fr: string, en: string) => (ui === "en" ? en : fr);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");

  async function submit() {
    setMsg("");
    setOk("");
    if (!email || pwd.length < 6) {
      setMsg(tr("Email valide + mot de passe (≥ 6 caractères).", "Valid email + password (≥ 6 chars)."));
      return;
    }
    setLoading(true);
    try {
      if (mode === "in") {
        await signIn(email, pwd);
        nav("/profil");
      } else {
        await signUp(email, pwd);
        setOk(tr("Compte créé ! Vérifiez votre email puis connectez-vous.", "Account created! Check your email then sign in."));
        setMode("in");
      }
    } catch (e: any) {
      setMsg(e.message || tr("Échec.", "Failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-leaf-700 to-leaf-900 px-5 pt-[4.5rem]">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-100"><Sprout className="h-7 w-7 text-leaf-700" /></span>
          <h1 className="mt-4 font-display text-2xl font-bold text-leaf-900">
            {mode === "in" ? tr("Se connecter", "Sign in") : tr("Créer un compte", "Create account")}
          </h1>
          <p className="mt-1 text-sm text-soil-400">{tr("Pour retrouver vos conversations partout.", "To find your conversations everywhere.")}</p>
        </div>

        {!enabled && (
          <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            {tr("Authentification non configurée. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.",
                "Auth not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-leaf-200 bg-white px-3">
            <Mail className="h-4 w-4 text-leaf-600" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@exemple.com"
              className="flex-1 bg-transparent py-2.5 text-soil-600 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-leaf-200 bg-white px-3">
            <Lock className="h-4 w-4 text-leaf-600" />
            <input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" placeholder={tr("Mot de passe", "Password")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="flex-1 bg-transparent py-2.5 text-soil-600 focus:outline-none" />
          </div>
        </div>

        {msg && <p className="mt-3 text-center text-sm text-red-600">{msg}</p>}
        {ok && <p className="mt-3 text-center text-sm text-leaf-700">{ok}</p>}

        <button onClick={submit} disabled={loading || !enabled} className="btn-primary mt-5 w-full disabled:opacity-40">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "in" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          {mode === "in" ? tr("Se connecter", "Sign in") : tr("Créer mon compte", "Create my account")}
        </button>

        <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }} className="mt-4 w-full text-center text-sm font-semibold text-leaf-700 hover:text-leaf-800">
          {mode === "in"
            ? tr("Pas de compte ? Créer un compte", "No account? Create one")
            : tr("Déjà un compte ? Se connecter", "Already have an account? Sign in")}
        </button>
      </div>
    </div>
  );
}
