# Historique des conversations + comptes configuration Supabase

L'historique du chat fonctionne **sans configuration** (stockage local du navigateur).
Pour le sauvegarder dans le cloud, le partager entre appareils et l'isoler **par
utilisateur**, branchez Supabase (URL + clé anon) puis activez l'authentification
email/mot de passe.

## 1. Créer le projet
1. Compte gratuit sur https://supabase.com → **New project**.
2. Notez l'**URL du projet** et la clé **anon public** (Settings → API).

## 2. Activer l'authentification email
1. **Authentication → Providers → Email** : activez **Enable Email provider**.
2. Pour tester rapidement, désactivez **Confirm email** (sinon chaque inscription
   exige un clic dans l'email avant de pouvoir se connecter).
3. La page `/auth` du site gère inscription (`signUp`) et connexion (`signIn`).

## 3. Créer les tables + RLS par utilisateur (SQL Editor → coller → Run)
```sql
-- Chaque conversation appartient à l'utilisateur connecté (auth.uid()).
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
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

create index if not exists idx_conversations_user on conversations(user_id, created_at desc);
create index if not exists idx_messages_conv on messages(conversation_id, created_at);

-- Row Level Security : chacun ne voit / écrit que ses propres données.
alter table conversations enable row level security;
alter table messages enable row level security;

-- Conversations : l'utilisateur n'accède qu'aux siennes.
create policy "own conversations" on conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Messages : accès via la conversation parente que l'utilisateur possède.
create policy "own messages" on messages
  for all
  using (exists (
    select 1 from conversations c
    where c.id = messages.conversation_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from conversations c
    where c.id = messages.conversation_id and c.user_id = auth.uid()
  ));
```
> Le `default auth.uid()` remplit `user_id` automatiquement à l'insertion ; le
> frontend l'envoie aussi explicitement (`insert({ title, user_id })`). Les
> politiques RLS garantissent qu'un utilisateur ne peut jamais lire ni modifier
> les conversations d'un autre.

### Migration depuis l'ancien schéma (politiques « anon » ouvertes)
Si vous aviez déjà créé les tables avec les politiques de démo ouvertes :
```sql
drop policy if exists "anon all conversations" on conversations;
drop policy if exists "anon all messages"      on messages;
alter table conversations add column if not exists
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade;
-- puis (re)créez les politiques "own conversations" / "own messages" ci-dessus.
```

## 4. Configurer le frontend
Dans `web/.env` :
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
Puis `npm run build` (ou redémarrer `npm run dev`).

## Comportement selon la configuration
| Supabase configuré | Utilisateur connecté | Stockage des conversations |
|--------------------|----------------------|----------------------------|
| Non                | —                    | localStorage (cet appareil) |
| Oui                | Non                  | localStorage (cet appareil) |
| Oui                | Oui (`/auth`)        | Supabase, **par utilisateur** ☁️ |

Le cloud n'est utilisé que si Supabase est configuré **et** qu'un utilisateur est
connecté (`cloud()` dans `web/src/lib/conversations.ts`). La barre latérale du chat
affiche alors « Sauvegardé sur Supabase ☁️ ».
