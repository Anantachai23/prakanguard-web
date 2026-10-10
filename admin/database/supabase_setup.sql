-- =====================================================================
--  PrakanGuard Admin  |  Supabase one-time setup  (รันซ้ำได้ ปลอดภัย)
--  วิธีใช้: Supabase Dashboard > SQL Editor > New query > วางทั้งไฟล์ > Run
--
--  สคริปต์นี้ "เพิ่ม" เท่านั้น ไม่ลบ/ไม่แก้ข้อมูลเดิมของเว็บหลัก
--  (reports / feedback / visitors เดิมใช้งานได้ต่อเนื่อง)
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 0) ฐานข้อมูลหลัก (สร้างตารางถ้ายังไม่มี สำหรับโปรเจกต์ใหม่)
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id                 text primary key,
  hazard_type        text default 'flood',
  name               text,
  subdistrict        text,
  district           text,
  lat                double precision,
  lng                double precision,
  body_level         text,
  body_level_label   text,
  depth_cm           integer,
  depth_range        text,
  level              integer default 2,
  traffic_status     text,
  cause              text,
  official_guidance  text,
  source             text default 'รายงานจากประชาชน',
  phone              text,
  photo_url          text,
  is_approved        boolean default false,
  is_resolved        boolean default false,
  reported_at        timestamptz default now(),
  timestamp          bigint,
  created_at         timestamptz default now()
);
alter table public.reports enable row level security;
drop policy if exists reports_all on public.reports;
create policy reports_all on public.reports for all to anon, authenticated using (true) with check (true);

create table if not exists public.feedback (
  id             text primary key,
  category       text default 'suggestion',
  category_label text default 'ทั่วไป',
  rating         integer default 5,
  message        text not null,
  sender_name    text,
  contact        text,
  admin_note     text,
  is_read        boolean default false,
  submitted_at   timestamptz default now(),
  timestamp      bigint,
  created_at     timestamptz default now()
);
alter table public.feedback enable row level security;
drop policy if exists feedback_all on public.feedback;
create policy feedback_all on public.feedback for all to anon, authenticated using (true) with check (true);

create table if not exists public.visitors (
  session_id     text primary key,
  device         text,
  district       text,
  page           text,
  last_ping      timestamptz default now(),
  created_at     timestamptz default now()
);
alter table public.visitors enable row level security;
drop policy if exists visitors_all on public.visitors;
create policy visitors_all on public.visitors for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- 1) visitors : เก็บข้อมูลผู้ใช้จริงละเอียดขึ้น + เวลาจากเซิร์ฟเวอร์ (เที่ยงตรง)
-- ---------------------------------------------------------------------
alter table public.visitors add column if not exists device_id  text;   -- รหัสอุปกรณ์ (กันนับซ้ำ)
alter table public.visitors add column if not exists ip         text;   -- IP สาธารณะของอุปกรณ์
alter table public.visitors add column if not exists gps_status text;   -- granted | denied | outside | pending

create index if not exists visitors_created_at_idx on public.visitors (created_at desc);
create index if not exists visitors_last_ping_idx  on public.visitors (last_ping  desc);

-- ใช้เวลาของเซิร์ฟเวอร์เป็น last_ping เสมอ  => ระยะเวลาบนเว็บ = last_ping - created_at ตรงจริง
create or replace function public.visitors_touch() returns trigger
language plpgsql as $$
begin
  new.last_ping := now();
  return new;
end $$;

drop trigger if exists visitors_touch_trg on public.visitors;
create trigger visitors_touch_trg before insert or update on public.visitors
  for each row execute function public.visitors_touch();

-- ---------------------------------------------------------------------
-- 2) reports : ข้อมูลผู้แจ้ง (อำเภอจาก GPS ของผู้แจ้ง / รุ่นโทรศัพท์ / IP)
-- ---------------------------------------------------------------------
alter table public.reports add column if not exists reporter_device    text;
alter table public.reports add column if not exists reporter_district  text;
alter table public.reports add column if not exists reporter_gps       text;   -- granted | denied | outside | pending
alter table public.reports add column if not exists reporter_ip        text;
alter table public.reports add column if not exists reporter_device_id text;

-- ---------------------------------------------------------------------
-- 3) announcements : การประกาศหน้าเว็บ (แอดมินสร้าง / เว็บหลักอ่าน)
-- ---------------------------------------------------------------------
create table if not exists public.announcements (
  id          text primary key,
  message     text not null,
  target_type text not null default 'all',          -- all | district
  districts   text[] not null default '{}',
  is_active   boolean not null default true,
  created_by  text,
  created_at  timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists announcements_all on public.announcements;
create policy announcements_all on public.announcements for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- 4) admin_trash : ลบล่าสุด (กู้คืน / ลบถาวร) ใช้ร่วมกันทุกแอดมิน
-- ---------------------------------------------------------------------
create table if not exists public.admin_trash (
  id         text primary key,                      -- kind:item_id
  kind       text not null,                         -- report | feedback
  item_id    text not null,
  payload    jsonb not null,
  deleted_at timestamptz not null default now(),
  deleted_by text
);
alter table public.admin_trash enable row level security;
drop policy if exists admin_trash_all on public.admin_trash;
create policy admin_trash_all on public.admin_trash for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- 5) admin_sessions : ประวัติเข้าระบบแอดมิน (กำลังใช้งาน)
-- ---------------------------------------------------------------------
create table if not exists public.admin_sessions (
  id            text primary key,
  admin_key     text not null,
  username      text not null,
  admin_label   text not null,
  device        text,
  ip            text,
  logged_in_at  timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  logged_out_at timestamptz
);
alter table public.admin_sessions enable row level security;
drop policy if exists admin_sessions_all on public.admin_sessions;
create policy admin_sessions_all on public.admin_sessions for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- 6) admin_accounts : บัญชีแอดมิน 2 บัญชี (เก็บเฉพาะ bcrypt hash, ผู้ใช้ภายนอกอ่านตารางนี้ไม่ได้)
--    ตรวจรหัสผ่านผ่านฟังก์ชัน admin_verify / admin_change_password เท่านั้น
-- ---------------------------------------------------------------------
create table if not exists public.admin_accounts (
  admin_key  text primary key,
  username   text unique not null,
  label      text not null,
  pass_hash  text not null,
  updated_at timestamptz not null default now()
);
alter table public.admin_accounts enable row level security;
revoke all on public.admin_accounts from anon, authenticated;

insert into public.admin_accounts (admin_key, username, label, pass_hash) values
  ('admin01', 'admin_prakanguard01', 'Admin 01', crypt('Prakan#Guard2026!Secured001', gen_salt('bf', 10))),
  ('admin02', 'admin_prakanguard02', 'Admin 02', crypt('Prakan#Guard2026!Secured002', gen_salt('bf', 10)))
on conflict (admin_key) do update set
  username = excluded.username,
  label = excluded.label,
  pass_hash = excluded.pass_hash,
  updated_at = now();

create or replace function public.admin_verify(p_username text, p_password text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r public.admin_accounts;
begin
  select * into r from public.admin_accounts where username = lower(trim(p_username));
  if found and r.pass_hash = crypt(p_password, r.pass_hash) then
    return jsonb_build_object('ok', true, 'admin_key', r.admin_key, 'label', r.label, 'username', r.username);
  end if;
  perform pg_sleep(0.6);                              -- หน่วงเล็กน้อยกันเดารหัสผ่านรัวๆ
  return jsonb_build_object('ok', false);
end $$;

create or replace function public.admin_change_password(p_username text, p_old text, p_new text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare r public.admin_accounts;
begin
  select * into r from public.admin_accounts where username = lower(trim(p_username));
  if not found or r.pass_hash <> crypt(p_old, r.pass_hash) then
    perform pg_sleep(0.6);
    return false;
  end if;
  if length(coalesce(p_new, '')) < 12 then
    return false;
  end if;
  update public.admin_accounts
     set pass_hash = crypt(p_new, gen_salt('bf', 10)), updated_at = now()
   where admin_key = r.admin_key;
  return true;
end $$;

revoke all on function public.admin_verify(text, text) from public;
revoke all on function public.admin_change_password(text, text, text) from public;
grant execute on function public.admin_verify(text, text) to anon, authenticated;
grant execute on function public.admin_change_password(text, text, text) to anon, authenticated;

-- ให้ PostgREST รู้จักคอลัมน์/ตาราง/ฟังก์ชันใหม่ทันที
notify pgrst, 'reload schema';
