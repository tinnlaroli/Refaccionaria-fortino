CREATE TABLE IF NOT EXISTS health_checks (
  id serial PRIMARY KEY,
  label text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO health_checks (label)
SELECT 'refaccionaria-fortino-init'
WHERE NOT EXISTS (
  SELECT 1 FROM health_checks WHERE label = 'refaccionaria-fortino-init'
);
