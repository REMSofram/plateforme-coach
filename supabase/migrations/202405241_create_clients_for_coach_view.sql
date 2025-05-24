-- Vue pour lister les clients liés à chaque coach
CREATE OR REPLACE VIEW clients_for_coach AS
SELECT
  u.*,
  cc.coach_id,
  cc.created_at AS relation_created_at
FROM users u
JOIN coach_clients cc ON cc.client_id = u.id
WHERE u.role = 'client'; 