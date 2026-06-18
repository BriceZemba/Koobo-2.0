# Historique des conversations configuration Supabase

L'historique du chat fonctionne **sans configuration** (stockage local du navigateur).
Pour le sauvegarder dans le cloud et le partager entre appareils, branchez Supabase.

## 1. Créer le projet
1. Compte gratuit sur https://supabase.com → **New project**.
2. Notez l'**URL du projet** et la clé **anon public** (Settings → API).

## 2. Créer les tables (SQL Editor → coller → Run)
```sql
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user','bot')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conv on messages(conversation_id, created_at);

-- Démo sans authentification : accès via la clé anon.
alter table conversations enable row level security;
alter table messages enable row level security;
create policy "anon all conversations" on conversations for all using (true) with check (true);
create policy "anon all messages"      on messages      for all using (true) with check (true);
```
> ⚠️ Ces politiques sont ouvertes (pour la démo). Pour la production, ajoutez
> l'authentification Supabase et restreignez l'accès par utilisateur.

## 3. Configurer le frontend
Dans `web/.env` :
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
Puis `npm run build` (ou redémarrer `npm run dev`). Le chat affichera
« Sauvegardé sur Supabase ☁️ » dans la barre latérale.
