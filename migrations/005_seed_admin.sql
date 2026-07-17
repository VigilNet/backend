
INSERT INTO users (email, full_name, password_hash, role)
VALUES (
  'admin@example.com',
  'Admin',
  '$argon2id$v=19$m=65536,t=3,p=4$8Ts9Me/wUntQYGnjMwkTIg$m5fjdE7OrAygaycrC17XoLfr23gL/30qP8X4iGfOzvk',
  'ADMIN'
)
ON CONFLICT (email) DO NOTHING;
