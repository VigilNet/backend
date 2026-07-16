CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(32) NOT NULL,
  name varchar(160) NOT NULL,
  venue_name varchar(160) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS events_code_idx ON events (code);

INSERT INTO events (code, name, venue_name, is_active)
VALUES ('GARUDA-1', 'Garuda Hack Event 1', 'Demo Venue', true)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE threshold_configs ADD COLUMN IF NOT EXISTS event_id uuid;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS event_id uuid;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS event_id uuid;

UPDATE threshold_configs
SET event_id = (SELECT id FROM events WHERE code = 'GARUDA-1')
WHERE event_id IS NULL;

UPDATE devices
SET event_id = (SELECT id FROM events WHERE code = 'GARUDA-1')
WHERE event_id IS NULL;

UPDATE alerts
SET event_id = (SELECT id FROM events WHERE code = 'GARUDA-1')
WHERE event_id IS NULL;

ALTER TABLE threshold_configs ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE devices ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE alerts ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE threshold_configs
  DROP CONSTRAINT IF EXISTS threshold_configs_event_id_events_id_fk,
  ADD CONSTRAINT threshold_configs_event_id_events_id_fk
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE devices
  DROP CONSTRAINT IF EXISTS devices_event_id_events_id_fk,
  ADD CONSTRAINT devices_event_id_events_id_fk
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE alerts
  DROP CONSTRAINT IF EXISTS alerts_device_id_fkey,
  DROP CONSTRAINT IF EXISTS alerts_event_id_events_id_fk,
  ADD CONSTRAINT alerts_event_id_events_id_fk
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS threshold_configs_version_idx;
DROP INDEX IF EXISTS devices_device_id_idx;

CREATE UNIQUE INDEX IF NOT EXISTS threshold_configs_event_version_idx
ON threshold_configs (event_id, version);

CREATE UNIQUE INDEX IF NOT EXISTS devices_event_device_idx
ON devices (event_id, device_id);

CREATE INDEX IF NOT EXISTS alerts_event_idx ON alerts (event_id);
