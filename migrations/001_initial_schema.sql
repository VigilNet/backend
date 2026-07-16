CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('ADMIN', 'PARTICIPANT');
CREATE TYPE device_type AS ENUM ('APP', 'WATCH');
CREATE TYPE alert_type AS ENUM ('BIOMETRIC_ANOMALY', 'DENSITY_ANOMALY', 'MANUAL_SOS');
CREATE TYPE alert_status AS ENUM ('NEW', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL,
  full_name varchar(160) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'PARTICIPANT',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_idx ON users (email);

CREATE TABLE threshold_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL,
  hr_min integer NOT NULL,
  hr_max integer NOT NULL,
  density_threshold integer NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX threshold_configs_version_idx ON threshold_configs (version);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id varchar(80) NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_type device_type NOT NULL,
  threshold_config_version integer NOT NULL,
  threshold_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX devices_device_id_idx ON devices (device_id);

CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_code varchar(32) NOT NULL,
  type alert_type NOT NULL,
  device_id varchar(80) NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status alert_status NOT NULL DEFAULT 'NEW',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  triggered_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX alerts_alert_code_idx ON alerts (alert_code);
CREATE INDEX alerts_status_idx ON alerts (status);
CREATE INDEX alerts_type_idx ON alerts (type);
CREATE INDEX alerts_triggered_at_idx ON alerts (triggered_at);
