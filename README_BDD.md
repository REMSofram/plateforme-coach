# 📦 Documentation de la base de données – Plateforme Coach

## Table `users`
> Contient les données générales de tous les utilisateurs (coach ou client).

| Champ        | Type       | Obligatoire | Par défaut      | Description                                      |
|--------------|------------|-------------|------------------|--------------------------------------------------|
| id           | `uuid`     | ✅           | -                | Identifiant unique utilisateur, lié à auth.id    |
| auth_id      | `uuid`     | ❌           | -                | ID auth Supabase (doublon avec `id`)             |
| role         | `text`     | ✅           | -                | Rôle de l’utilisateur : `coach` ou `client`      |
| full_name    | `text`     | ❌           | -                | Nom complet                                      |
| email        | `text`     | ✅           | -                | Email de l’utilisateur                           |
| created_at   | `timestamptz` | ✅       | `now()`          | Date de création                                 |
| weight       | `numeric`  | ❌           | -                | Poids de référence de l’utilisateur              |
| birth_date   | `date`     | ❌           | -                | Date de naissance                                |
| injuries     | `text`     | ❌           | -                | Notes libres sur les blessures potentielles      |

### Relations
- `id` est lié à `auth.users.id`
- Utilisé comme clé étrangère dans : `poids_logs`, `coach_clients`

### Remarques
- La fonction `handle_new_user()` insert automatiquement un nouvel utilisateur dans cette table à la création Auth.
---

## Table `coach_clients`
> Associe un coach à ses clients (relation N:N managée par la plateforme).

| Champ       | Type       | Obligatoire | Par défaut | Description                                  |
|-------------|------------|-------------|------------|----------------------------------------------|
| id          | `uuid`     | ✅           | -          | Identifiant unique de la relation            |
| coach_id    | `uuid`     | ✅           | -          | Référence à `users.id` du coach              |
| client_id   | `uuid`     | ✅           | -          | Référence à `users.id` du client             |
| created_at  | `timestamptz` | ✅       | `now()`    | Date de création de la relation              |

### Relations
- `coach_id` et `client_id` → `users.id`

### Remarques
- Permet une visualisation claire des clients pour chaque coach dans le dashboard.
---

## Table `poids_logs`
> Journal de suivi du poids d’un utilisateur.

| Champ       | Type       | Obligatoire | Par défaut | Description                                  |
|-------------|------------|-------------|------------|----------------------------------------------|
| id          | `uuid`     | ✅           | -          | ID unique du log                             |
| user_id     | `uuid`     | ✅           | -          | Référence à l’utilisateur (`users.id`)       |
| date        | `date`     | ✅           | -          | Date du log                                   |
| poids       | `numeric`  | ✅           | -          | Poids mesuré (en kg)                          |
| note        | `text`     | ❌           | -          | Note libre (ressenti, alimentation, etc.)     |
| created_at  | `timestamptz` | ✅       | `now()`    | Timestamp de la création du log              |

### Relations
- `user_id` → `users.id`

---

## Fonction `handle_new_user()`
> Trigger automatique à la création d'un nouvel utilisateur dans `auth.users`.

```sql
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
