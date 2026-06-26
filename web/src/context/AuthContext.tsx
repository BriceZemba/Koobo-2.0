import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase, hasSupabase, setUserId } from "../lib/supabase";

interface AuthUser {
  id: string;
  email?: string;
}
interface Ctx {
  user: AuthUser | null;
  loading: boolean;
  enabled: boolean; // true si Supabase est configuré
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<Ctx>({
  user: null, loading: true, enabled: false,
  signIn: async () => {}, signUp: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase || !supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
      setUserId(u?.id ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
      setUserId(u?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error("Authentification non configurée.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }
  async function signUp(email: string, password: string) {
    if (!supabase) throw new Error("Authentification non configurée.");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }
  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setUserId(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, enabled: hasSupabase, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
