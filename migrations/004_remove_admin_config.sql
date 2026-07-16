ALTER TABLE devices DROP COLUMN IF EXISTS threshold_config_version;
ALTER TABLE devices DROP COLUMN IF EXISTS threshold_snapshot;

DROP TABLE IF EXISTS threshold_configs;
