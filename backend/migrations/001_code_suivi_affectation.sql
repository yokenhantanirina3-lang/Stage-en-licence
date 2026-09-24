-- Migration idempotente : portail contribuable (code de suivi) + action AFFECTATION
-- Executer : psql -U fiscal_user -d fiscal_db -f 001_code_suivi_affectation.sql

ALTER TYPE typeactionenum ADD VALUE IF NOT EXISTS 'AFFECTATION';

ALTER TABLE reclamations ADD COLUMN IF NOT EXISTS code_suivi VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS ix_reclamations_code_suivi ON reclamations(code_suivi);

-- Retour arriere des codes pour les dossiers existants (format AAAA-MM-XXXXXX)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM reclamations WHERE code_suivi IS NULL LOOP
    UPDATE reclamations
       SET code_suivi = to_char(CURRENT_DATE, 'YYYYMM') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6))
     WHERE id = r.id;
  END LOOP;
END $$;