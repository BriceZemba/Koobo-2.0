// Profil agriculteur — stocké localement (localStorage). Sert à pré-remplir les
// formulaires (cultures, météo) et à personnaliser les conseils.
export interface Profile {
  name: string;
  city: string;
  crops: string;
  nitrogen: number;
  phosphorous: number;
  potassium: number;
  ph: number;
  rainfall: number;
}

const KEY = "koobo_profile";

const DEFAULT: Profile = {
  name: "",
  city: "",
  crops: "",
  nitrogen: 90,
  phosphorous: 42,
  potassium: 43,
  ph: 6.5,
  rainfall: 200,
};

export function getProfile(): Profile {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProfile(p: Partial<Profile>) {
  const merged = { ...getProfile(), ...p };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}

export function hasProfile(): boolean {
  const p = getProfile();
  return !!(p.name || p.city || p.crops);
}
