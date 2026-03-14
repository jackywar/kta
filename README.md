# KTA (Next.js + Supabase)

Stack: **Next.js App Router**, **TypeScript (strict)**, **Tailwind CSS v4**, **Supabase Auth + RLS**, déployable sur **Vercel**.

## Fonctionnel

- `/login`: formulaire (email, mot de passe, “Se souvenir de moi”) dans une card centrée.
- `/`: page protégée (bandeau + bouton “Se déconnecter”).
- `/admin/users`: réservé aux **admins** (liste + création d’utilisateurs).
- **Pas de signup public**: la création d’utilisateurs passe par une route serveur protégée.

## Variables d’environnement

Créer un fichier `.env.local`:

```bash
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="public-anon-key"

# Supabase (server-only)
SUPABASE_SECRET_KEY="service-role-key"
APP_URL="http://localhost:3000"
```

Important:

- Ne jamais exposer `SUPABASE_SECRET_KEY` au client.
- `APP_URL` sert à construire les URLs de redirection des emails Supabase (invitation + réinitialisation de mot de passe).

## Setup Supabase

### 1) Désactiver le signup public

Dans Supabase Dashboard:

- **Authentication → Providers**: désactiver les signups email/password publics (selon UI: “Enable email signups”).

### 2) Appliquer les migrations (profiles + RLS)

Dans Supabase (SQL Editor), exécuter:

- `supabase/migrations/0001_profiles_and_rls.sql`

Cela crée:

- `public.profiles` (liée à `auth.users`)
- un trigger `on_auth_user_created` qui crée/maintient une ligne `profiles` (sans mot de passe)
- RLS + policies (lecture “self” + lecture/insert/update “admin”)

## Bootstrap du premier admin

Comme il n’y a **pas de signup public**, il faut créer le tout premier utilisateur “admin” via le Dashboard:

1. Supabase Dashboard → **Authentication → Users** → créer/inviter un utilisateur (email).
2. Le trigger crée automatiquement une ligne `public.profiles` (role = `catechumene`).
3. Dans SQL Editor, promouvoir cet utilisateur en admin:

```sql
update public.profiles
set role = 'admin'
where email = 'votre-email@exemple.fr';
```

Ensuite, connectez-vous sur `/login` et utilisez `/admin/users` pour créer les autres utilisateurs. Chaque création :

- envoie un email d’invitation Supabase à l’utilisateur
- redirige l’utilisateur, après clic sur le lien, vers `/auth/update-password` pour qu’il choisisse son mot de passe.

## Lancement local

```bash
npm install
npm run dev
```

## Déploiement Vercel

- Importer le repo dans Vercel
- Renseigner les variables d’environnement (mêmes clés que `.env.local`)
- Déployer

## Notes sécurité

- `profiles` contient uniquement des données applicatives: `id`, `email`, `role`, `created_at`.
- **Aucun mot de passe** n’est stocké dans la base applicative.
- Aucune écriture SQL directe dans `auth.users` (on utilise uniquement Supabase Auth Admin API côté serveur).
- Clients Supabase séparés:
  - `lib/supabase/client.ts` (navigateur)
  - `lib/supabase/server.ts` (SSR, via cookies)
  - `lib/supabase/admin.ts` (service role, server-only)

