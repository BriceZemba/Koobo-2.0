import { createClient } from "@supabase/supabase-js";

// Configuré via web/.env :
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
// Si absent, l'historique des conversations bascule automatiquement sur le
// stockage local du navigateur (localStorage).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && key ? createClient(url, key) : null;
export const hasSupabase = !!supabase;

// Identité de l'utilisateur connecté (mise à jour par AuthContext).
let _userId: string | null = null;
export function setUserId(id: string | null) {
  _userId = id;
}
export function getUserId(): string | null {
  return _userId;
}

