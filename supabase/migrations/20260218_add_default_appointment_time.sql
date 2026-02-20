-- Adds a tenant-level default appointment time (HH:MM).
alter table public.tenants
  add column if not exists default_appointment_time time not null default '09:00';
