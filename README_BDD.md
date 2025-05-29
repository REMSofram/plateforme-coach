# 📊 Base de Données – Plateforme Coach

Voici le schéma de la base de données actuelle utilisée dans Supabase pour la plateforme :

---

## 🔐 Table `auth.users` (gérée par Supabase)

Contient les informations d'authentification. Les tables suivantes y font référence via l'`id`.

---

## 👤 Table `users`

| Colonne      | Type     | Description                        |
|--------------|----------|------------------------------------|
| id           | uuid     | Identifiant interne                |
| auth_id      | uuid     | Référence à `auth.users.id`        |
| role         | text     | 'coach' ou 'client'                |
| full_name    | text     | Nom complet                        |
| email        | text     | Email                              |
| created_at   | timestamptz | Date de création du profil     |
| weight       | numeric  | Poids actuel                       |
| birth_date   | date     | Date de naissance                  |
| injuries     | text     | Antécédents de blessures (optionnel) |

---

## 🏋️ Table `coach_clients`

| Colonne     | Type     | Description                          |
|-------------|----------|--------------------------------------|
| id          | uuid     | Clé primaire                         |
| coach_id    | uuid     | Référence à `auth.users.id` (coach)  |
| client_id   | uuid     | Référence à `auth.users.id` (client) |
| created_at  | timestamptz | Date d’association coach/client |

---

## 📝 Table `poids_logs`

| Colonne     | Type     | Description                         |
|-------------|----------|-------------------------------------|
| id          | uuid     | Clé primaire                        |
| user_id     | uuid     | Référence à `users.id`              |
| date        | date     | Date du relevé                      |
| poids       | numeric  | Poids enregistré (en kg)            |
| note        | text     | Note optionnelle (ressenti, etc.)   |
| created_at  | timestamptz | Date de création du log         |

---

## 📆 Table `sessions`

| Colonne     | Type     | Description                         |
|-------------|----------|-------------------------------------|
| id          | uuid     | Clé primaire                        |
| client_id   | uuid     | Référence à `auth.users.id` (client)|
| title       | text     | Titre de la séance                  |
| description | text     | Détails de la séance                |
| date        | date     | Date prévue                         |
| created_at  | timestamptz | Date de création                |
| updated_at  | timestamptz | Dernière mise à jour            |

---

## 🔗 Relations clés

- `users.auth_id` → `auth.users.id`
- `coach_clients.coach_id` et `client_id` → `auth.users.id`
- `poids_logs.user_id` → `users.id`
- `sessions.client_id` → `auth.users.id`
