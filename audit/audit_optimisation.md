# Audit performance — KTA sur plan gratuit (Vercel + Supabase)

> Analyse statique du code (rendu Next.js, routes API, requêtes Supabase, schéma SQL,
> bundle client) menée le 4 septembre 2026. Basée sur les 27 migrations SQL et
> l'ensemble du code source — pas de mesure runtime (EXPLAIN, métriques Vercel/Supabase
> réelles).
>
> **Révision du 4 septembre 2026** — chaque affirmation a été revérifiée contre le
> code. Les corrections apportées à cette occasion sont signalées par la mention
> *(corrigé)*. Les volumes de données réels, connus depuis l'import Glide, ont été
> ajoutés : ils changent la priorité de plusieurs points.

## Volumes réels en base (après import Glide)

| Table | Lignes |
|---|---|
| `frats` | 6 |
| `events` | 55 |
| `catechumenes` | 91 |
| `event_attendances` | 789 |
| `profiles` | quelques dizaines |

Ces ordres de grandeur sont déterminants pour lire les priorités ci-dessous : à
moins de quelques milliers de lignes, PostgreSQL préfère un parcours séquentiel à
un index, surtout sur des colonnes à faible cardinalité (`role`, `visibility`,
booléens). **Les index manquants sont donc réels mais sans effet mesurable
aujourd'hui**, alors que la duplication d'auth se paie, elle, à chaque navigation.

## Constat global

À l'échelle actuelle (~50 utilisateurs, ~90 catéchumènes, ~55 événements),
l'application tient largement dans les deux plans gratuits. Les points relevés
ci-dessous ne sont pas des pannes actuelles : ce sont des habitudes de requêtage
(pas de pagination, auth dupliquée, index manquants) qui feront grimper la
consommation plus vite que nécessaire à mesure que les données et l'usage grossissent.

---

## Contexte : limites des plans gratuits

### Vercel Hobby (gratuit)

| Ressource | Limite incluse |
|---|---|
| Fast Data Transfer | 100 GB / mois |
| Function Invocations | 1 M / mois |
| Active CPU | 4 h / mois |
| Provisioned Memory | 360 GB-h / mois |
| Image transformations | 5 000 / mois (1 000 images source) |
| Build execution | 6 000 min / mois |
| Logs runtime | conservés 1 h |
| Dépassement | projet suspendu jusqu'au cycle suivant (pas d'overage) |

### Supabase Free

| Ressource | Limite incluse |
|---|---|
| Taille base de données | 500 MB / projet |
| Egress (sortant) | 5 GB + 5 GB en cache / mois |
| Stockage fichiers | 1 GB (upload max 50 MB) |
| Utilisateurs actifs (MAU) | 50 000 / mois |
| Projets actifs | 2 par organisation |
| Mise en pause | après 7 jours d'inactivité |
| Rétention des logs | 1 jour |
| Requêtes API REST | illimitées |

---

## Synthèse des priorités

16 points classés par sévérité (P0 = à traiter en premier).

### P0 — Critique

| Problème | Zone | Impact plan gratuit | Statut |
|---|---|---|---|
| Authentification dupliquée à chaque page : Topbar (`getUser`) + page (`getSession`) + 2× `GET /api/profile/theme` | Rendu Next.js / API | Jusqu'à ~4 vérifications d'auth + lectures profile par navigation → double la consommation d'invocations Vercel et de requêtes Supabase | **Corrigé** — helper `getCurrentUserProfile()` mémoïsé par requête (`lib/auth/current-profile.ts`), thème rendu côté serveur |
| Page de présence charge TOUS les catéchumènes avec toutes leurs colonnes (observations, textes) pour une simple case à cocher | Requêtes Supabase | Le plus gros payload de l'appli, chargé à chaque ouverture d'un événement | **Corrigé** — `CATECHUMENE_TILE_SELECT` (6 champs) sur les 4 pages de tuiles |
| Aucune pagination : zéro `.limit()`/`.range()` sur tout le code, tables list en `select('*')` incluant colonnes texte volumineuses | Requêtes Supabase | Egress (5 GB/mois) et temps de réponse croissent linéairement avec le nombre de catéchumènes/événements | Ouvert |

### P0 déclassés en P2 au vu des volumes réels

Ces trois points restent exacts sur le principe, mais avec 91 catéchumènes et 789
présences le planificateur PostgreSQL n'utilisera pas ces index. À reprendre quand
les tables approcheront quelques milliers de lignes.

| Problème | Zone | Précision apportée |
|---|---|---|
| Clés étrangères sans index : `catechumenes.frat_id`, `profiles.catechumene_id`, `frat_responsables.profile_id`, `event_attendances.catechumene_id`, `responsable_responsabilites.responsabilite_id` | Schéma DB | Confirmé. Les 3 dernières appartiennent à une PK composite où elles occupent la **2ᵉ** position, donc non couvertes par l'index de PK |
| Colonnes filtrées par la RLS sans index : `profiles.role`, `events.visibility` | Schéma DB / RLS | Confirmé pour ces deux colonnes. *(corrigé)* `catechumenes.est_candidat` **n'apparaît dans aucune policy RLS** : elle n'est filtrée que par les requêtes applicatives |
| `private.is_catechumene()` référencée dans une ancienne policy mais jamais définie | Schéma DB / RLS | Confirmé. Référencée uniquement en `0017`, policy supprimée en `0018` — aucun impact actuel |

### P1 — Important

| Problème | Zone | Impact plan gratuit |
|---|---|---|
| Aucun `Promise.all` : requêtes indépendantes enchaînées séquentiellement sur ~6 pages (`admin/users`, `admin/catechumenes`, `admin/frats`, `responsable/frats`, `responsable/catechumenes`, `responsable/responsabilites`) | Rendu Next.js | +100-300 ms par page à chaque requête série évitable. *(précisé)* 5 pages sont pleinement parallélisables ; sur `responsable/responsabilites` la 3ᵉ requête dépend des `profile_id` de la 2ᵉ |
| `generateMetadata` et le corps de page re-fetchent le même événement sur `/responsable/events/[id]/presence` | Rendu Next.js | 2 aller-retours Supabase pour un seul champ (`libelle`) — **corrigé** via `cache()` |
| `attendance/bulk-upsert` : tableau non borné, aucun découpage en lots | Routes API | Risque de timeout (10 s) si un responsable coche beaucoup de présences/événements historiques |
| Fonctions RLS `is_admin()`/`is_responsable()` non déclarées `STABLE` | Schéma DB / RLS | Le planificateur ne peut pas mettre le résultat en cache dans une même requête |
| Upload photo : création de bucket + upload entièrement synchrones dans le handler | Routes API | Risque de timeout au tout premier upload (création du bucket à la volée) |
| Aucun rate limiting sur les routes de reset de mot de passe | Routes API | Un abus pourrait épuiser le quota d'emails Auth et les invocations Vercel |

### P2 — Mineur

| Problème | Zone | Impact plan gratuit |
|---|---|---|
| Clients Supabase admin/browser recréés à chaque appel plutôt que réutilisés | Requêtes Supabase | Overhead mineur, sans impact mesurable au volume actuel |
| Aucun en-tête `Cache-Control` sur les routes API (ex. `GET /api/profile/theme`) | Routes API | Devenu sans objet : `GET /api/profile/theme` n'est plus appelé au chargement (thème rendu côté serveur) |
| Route `attendance/upsert` non utilisée mais toujours déployée | Routes API | Surface de cold-start inutile, sans coût réel sur le plan gratuit |
| `globals.css` embarque les 4 palettes de thème en permanence | Bundle / Build | Léger surpoids CSS, non lié au JS envoyé au client |

---

## Bonnes pratiques déjà en place

| Aspect | Constat |
|---|---|
| Aucun usage de Supabase Realtime | 0 connexion réaliste consommée sur les 200 autorisées |
| Aucun polling / `setInterval` côté client | Pas de charge serveur en tâche de fond quand l'onglet reste ouvert |
| Dépendances légères | Aucune librairie lourde (charts, dates, icônes) — bundle client sobre |
| `react-markdown` importé en `dynamic()` | Déjà exclu du chunk initial via `next/dynamic` |
| Aucune police externe | Pas de requête Google Fonts bloquant le rendu |
| Compression image côté client + plafond 600 Ko serveur | Réduit le stockage et l'egress avant même l'upload |
| Bucket photos public | URLs mises en cache par le navigateur/CDN, moins d'egress répété |
| 16 fichiers `loading.tsx` | Bonne couverture des états de chargement lors des navigations |

---

## Détails par domaine

### Rendu & data-fetching Next.js

| Constat | Référence |
|---|---|
| *(corrigé)* 26 pages sur 29 sont dynamiques (cookies d'auth lus à chaque requête). `/login`, `/auth/update-password` et `/disabled` ne lisaient pas de cookie — elles sont devenues dynamiques depuis que le layout racine lit le profil | Zéro segment ISR — aucune page n'est servie depuis le CDN |
| Topbar (Server Component) revalidait l'auth indépendamment de chaque page via `noStore()` | `components/layout/topbar.tsx` — **corrigé**, `noStore()` retiré au profit du helper mémoïsé |
| *(corrigé)* `PaletteProvider` appelait toujours `GET /api/profile/theme` au montage ; `ThemeProvider` sautait l'appel si `localStorage` contenait déjà `kta:mode` — soit 1 à 2 invocations par chargement | `components/theme/theme-provider.tsx`, `palette-provider.tsx` — **corrigé**, valeurs passées en props depuis le layout |
| Aucun `Suspense` — seuls les `loading.tsx` (niveau segment) découpent le chargement | 0 usage de `<Suspense>` trouvé dans le code |
| 6 pages avec requêtes indépendantes enchaînées au lieu de `Promise.all` | `admin/users`, `admin/catechumenes`, `admin/frats`, `responsable/frats`, `responsable/catechumenes`, `responsable/responsabilites` |
| 6 usages de `next/image`, 0 balise `<img>` brute | Bonne pratique respectée pour les photos de catéchumènes |

### Routes API (`app/api`)

| Constat | Référence |
|---|---|
| *(corrigé)* **35** routes API, toutes en runtime Node.js par défaut (aucune en edge) | Pas de `export const runtime = "edge"`. `app/auth/confirm/route.ts` s'y ajoute hors `app/api` |
| *(nuancé)* Chaque route recrée un client Supabase et refait auth avant la logique métier ; le contrôle de rôle est en revanche absent des routes `profile/*` (update, theme, reset-password), qui n'en ont pas besoin | Minimum 2 aller-retours Supabase par invocation sur les routes admin/responsable |
| *(corrigé)* **13** routes utilisent le client admin (service role) : 8 via `createSupabaseAdminClient()`, 5 via `tryCreateSupabaseAdminClient()` | Toujours après vérification du rôle via le client RLS — cohérent |
| `GET /api/profile/theme` appelé 1 à 2× par chargement de page | **Corrigé** — plus aucun appel au chargement, le thème vient du layout serveur |
| `attendance/bulk-upsert` : pas de `.max()` sur le tableau, pas de découpage en lots | `app/api/attendance/bulk-upsert/route.ts` |
| Aucun en-tête de cache, CORS ou rate limiting sur aucune route | Constat global, 34/34 routes |

### Requêtes Supabase

| Constat | Référence |
|---|---|
| *(précisé)* **22** requêtes en `select('*')` ou `'*,'` sur des tables avec colonnes texte volumineuses : 12 sur `catechumenes`, 4 sur `events`, 6 sur des tables légères | `catechumenes` (observations, rencontre_individuelle_texte), `events` (descriptif). 4 des 12 requêtes `catechumenes` ont été restreintes aux colonnes des tuiles |
| 0 usage de `.limit()` ou `.range()` dans tout le projet | Toute liste grossit sans borne avec les données |
| Aucun usage de Supabase Realtime (`.channel`, `postgres_changes`) | Pas de risque sur le quota de connexions temps réel |
| Clients Supabase (server/browser/admin) recréés à chaque appel plutôt que mémoïsés | `lib/supabase/server.ts`, `client.ts`, `admin.ts` |
| Stockage photos : bucket public + compression client + plafond serveur 600 Ko | `lib/storage.ts`, `components/admin/catechumene-photo-field.tsx` |
| Fonctions RLS `is_admin()`/`is_responsable()` font un lookup indexé sur `profiles.id` (PK) — efficace en soi | `supabase/migrations/0001`, `0007` — mais non déclarées `STABLE` |

### Schéma DB, index & RLS

| Constat | Référence |
|---|---|
| *(corrigé)* 27 migrations lues (0001–0028, 0014 absent) : **9** tables, RLS activée partout | `profiles`, `frats`, `frat_responsables`, `catechumenes`, `events`, `event_attendances`, `page_contents`, `responsabilites`, `responsable_responsabilites` |
| 5 colonnes de clé étrangère sans index dédié | `catechumenes.frat_id`, `profiles.catechumene_id`, `frat_responsables.profile_id`, `event_attendances.catechumene_id`, `responsable_responsabilites.responsabilite_id` |
| *(ajouté)* Seuls 4 `CREATE INDEX` explicites existent | `profiles_email_unique` (0001), `catechumenes_responsable_profile_id_idx` (0023), `catechumenes_candidat_suivi_statut_idx` (0024), `profiles_disabled_at_idx` (0028) |
| `events_select_by_visibility` : policy avec `EXISTS` + jointure évaluée par ligne pour les catéchumènes | `supabase/migrations/0025_events_visibility.sql` |
| *(précisé)* `profiles` cumule **5** policies SELECT permissives, dont 4 s'appuient sur `role` (3 explicitement, 1 via `is_admin()`) — sans index sur `role` | `supabase/migrations/0001, 0009, 0016, 0018` |
| Aucune contrainte UNIQUE sur `profiles.catechumene_id` ni `catechumenes.email` | Risque de doublons, pas un souci de performance en soi |
| 2 triggers seulement, coût négligeable (création profil à l'inscription, `updated_at` sur les présences) | `supabase/migrations/0001, 0013` |

### Bundle client & build

| Constat | Référence |
|---|---|
| 14 dépendances directes, aucune librairie lourde (charts/dates/icônes) | `package.json` |
| 42 fichiers `"use client"`, concentrés sur les formulaires admin/responsable | Le rendu par défaut reste Server Component |
| `ThemeProvider` + `PaletteProvider` + `ServiceWorkerRegistration` chargés sur toutes les pages via le layout racine | `app/layout.tsx` |
| `browser-image-compression` importé statiquement (~50-100 Ko) sur une page admin uniquement | `components/admin/catechumene-photo-field.tsx` |
| Aucun analyseur de bundle, aucun `vercel.json`, aucune police personnalisée | Configuration minimale — ni risque ni optimisation avancée |

---

## Migration SQL recommandée (index + fonctions RLS)

> **Non appliquée, et volontairement.** Aux volumes actuels (91 catéchumènes,
> 789 présences), ces index ne seront pas utilisés par le planificateur. Deux
> réserves supplémentaires : `catechumenes_est_candidat_idx` porte sur un booléen
> à 2 valeurs (index quasi jamais retenu), et `est_candidat` n'est pas utilisé par
> la RLS contrairement à ce qui était indiqué plus haut dans la version initiale.
> Le seul élément vraiment gratuit et durable est le passage des fonctions RLS en
> `STABLE`.

```sql
-- supabase/migrations/00XX_perf_indexes.sql

-- Index sur les clés étrangères non couvertes
create index if not exists frat_responsables_profile_id_idx on public.frat_responsables (profile_id);
create index if not exists event_attendances_catechumene_id_idx on public.event_attendances (catechumene_id);
create index if not exists profiles_catechumene_id_idx on public.profiles (catechumene_id);
create index if not exists catechumenes_frat_id_idx on public.catechumenes (frat_id);
create index if not exists responsable_responsabilites_responsabilite_id_idx
  on public.responsable_responsabilites (responsabilite_id);

-- Index sur les colonnes filtrées par la RLS et les pages de liste
create index if not exists catechumenes_est_candidat_idx on public.catechumenes (est_candidat);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists events_visibility_idx on public.events (visibility);
create index if not exists events_date_created_at_idx on public.events (date desc, created_at desc);

-- Rendre les fonctions RLS STABLE pour permettre la mise en cache par requête
alter function private.is_admin() stable;
alter function private.is_responsable() stable;
```

---

## Feuille de route suggérée

| Étape | Action | Statut |
|---|---|---|
| 1 | Fusionner `ThemeProvider`/`PaletteProvider` en un seul appel, dédupliquer l'auth Topbar/page | **Fait** — `getCurrentUserProfile()` mémoïsé via `cache()`, thème passé en props depuis `app/layout.tsx` |
| 2 | Restreindre les `select('*')` aux colonnes réellement affichées sur les vues liste/tuiles | **Fait** — `CATECHUMENE_TILE_SELECT` sur les 4 pages de tuiles (présence, catéchumènes, ma frat, détail frat) |
| 3 | Ajouter les index manquants + déclarer `STABLE` les fonctions RLS | Reporté — sans effet aux volumes actuels ; ne garder que la partie `STABLE` si l'on veut avancer |
| 4 | Ajouter `.limit()`/pagination sur les listes catéchumènes/événements/présences | À faire avant de dépasser quelques centaines de lignes |
| 5 | Paralléliser les requêtes indépendantes avec `Promise.all` sur les 6 pages identifiées | À faire (5 pages pleinement parallélisables) |
| 6 | Borner/segmenter `attendance/bulk-upsert` et ajouter un rate limit sur les routes de reset mot de passe | À faire — c'est le point le plus proche d'un vrai risque (timeout, abus) |

## Ce qui a changé dans le code lors de cette révision

- `lib/auth/current-profile.ts` : `getCurrentUserProfile()` mémoïsé par `cache()`,
  une seule lecture `profiles` partagée par le layout, la Topbar et la page.
- `lib/theme.ts` : types et schémas de thème partagés entre serveur, providers et
  route API.
- Les 26 pages authentifiées passent de `getSession()` (JWT lu sans validation) à
  `getUser()` mutualisé — meilleure sécurité en plus du gain de requêtes.
- `app/layout.tsx` rend `data-theme` côté serveur : plus aucun `GET
  /api/profile/theme` au chargement, et plus de flash de thème par défaut.
- `lib/catechumenes.ts` : `CatechumeneTileData` + `CATECHUMENE_TILE_SELECT`
  (6 champs au lieu de ~18).
- `app/responsable/events/[id]/presence/page.tsx` : lecture de l'événement
  mémoïsée entre `generateMetadata` et le corps de page.