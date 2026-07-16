ALTER TABLE events ADD COLUMN IF NOT EXISTS operator_password_hash varchar(255);

UPDATE events
SET operator_password_hash = '$argon2id$v=19$m=65536,t=3,p=4$RrN0dbpLr8q5GlqUtrqocA$oVn0GiSM4nMlqffI3nEryrUroXocVkD8kE+nmfVsw1c'
WHERE operator_password_hash IS NULL;

ALTER TABLE events ALTER COLUMN operator_password_hash SET NOT NULL;
