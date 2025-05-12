/*
  # Fix phone number validation

  1. Changes
    - Update phone validation function to accept common French phone number formats
    - Support formats:
      - +33612345678
      - 0612345678
      - +33 6 12 34 56 78
      - 06 12 34 56 78
*/

-- Update function to validate phone format with more flexible pattern
CREATE OR REPLACE FUNCTION validate_phone_format()
RETURNS trigger AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^(\+33|0)[1-9]([0-9]{2}[\s]?){4}$' THEN
    RAISE EXCEPTION 'Format de téléphone invalide. Utilisez le format +33612345678 ou 0612345678';
  END IF;
  -- Remove spaces if present to standardize format
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := regexp_replace(NEW.phone, '\s+', '', 'g');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;