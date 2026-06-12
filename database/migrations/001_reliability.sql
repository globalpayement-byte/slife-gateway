-- Migration 001 : fanatsarana fahatokisana (idempotency + auth)
-- Ampiharo amin'ny base efa misy data:
--   mysql -u root -p slife_gateway < database/migrations/001_reliability.sql

USE slife_gateway;

-- 1. Idempotency: message_id tokana isaky ny SMS.
--    Ho an'ny lignes efa misy, fenoina avy amin'ny id mba tsy hifanipaka.
ALTER TABLE sms_recus
  ADD COLUMN message_id VARCHAR(190) NULL AFTER id;

UPDATE sms_recus
  SET message_id = CONCAT('legacy-', id)
  WHERE message_id IS NULL;

ALTER TABLE sms_recus
  MODIFY COLUMN message_id VARCHAR(190) NOT NULL,
  ADD UNIQUE KEY uq_sms_message_id (message_id);

-- 2. Avela ho NULL ny operator amin'ny SMS tsy fantatra (tsy voatery 'mvola' intsony)
ALTER TABLE sms_recus
  MODIFY COLUMN operator ENUM('mvola','orange','airtel') NULL;

-- 3. Index ho an'ny match (hafainganana sady hisorohana race amin'ny FOR UPDATE)
CREATE INDEX idx_transactions_match ON transactions(statut, operator, type, montant);
