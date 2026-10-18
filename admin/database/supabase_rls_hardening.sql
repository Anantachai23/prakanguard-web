-- =====================================================================
--  PrakanGuard Security Hardening | Row Level Security (RLS) & Access Control
-- =====================================================================
--  วัตถุประสงค์: 
--  1. จำกัดสิทธิ์ Key สาธารณะ (anon publishable key) ให้ทำได้เฉพาะสิ่งที่จำเป็น
--  2. ป้องกันไม่ให้บุคคลภายนอก ลบ/ปลอมแปลง/แก้ไข ข้อมูลรายงาน ประกาศ และข้อเสนอแนะ
--  3. ปกป้องข้อมูลส่วนบุคคลของประชาชน (เบอร์โทรศัพท์, พิกัด GPS, รุ่นอุปกรณ์, IP)
--  4. รองรับการยืนยันตัวตนแอดมินผ่าน Supabase Auth (authenticated role)
--
--  วิธีใช้งาน:
--  เปิด Supabase Dashboard > เลือกโปรเจกต์ > ไปที่เมนู "SQL Editor" > 
--  กด "New query" > วางโค้ดทั้งหมดนี้ลงไป > กด "Run"
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ตาราง reports (รายงานน้ำท่วมและสถานการณ์ฉุกเฉิน)
-- ---------------------------------------------------------------------
alter table public.reports enable row level security;

-- ลบนโยบายเดิมที่เปิดสิทธิ์กว้างเกินไป
drop policy if exists reports_all on public.reports;
drop policy if exists reports_insert_public on public.reports;
drop policy if exists reports_select_public on public.reports;
drop policy if exists reports_admin_all on public.reports;

-- 1.1 ประชาชนทั่วไป (anon) และแอดมิน สามารถส่งรายงานน้ำท่วมเข้ามาได้
create policy reports_insert_public on public.reports
  for insert to anon, authenticated
  with check (true);

-- 1.2 ประชาชนทั่วไป (anon) สามารถอ่านได้เฉพาะรายงานที่อนุมัติแล้ว หรือจุดที่สถานะยังไม่คลี่คลาย
--     (ป้องกันการดึงประวัติที่ไม่ได้รับอนุญาต)
create policy reports_select_public on public.reports
  for select to anon
  using (is_approved = true or is_resolved = false);

-- 1.3 แอดมินที่ยืนยันตัวตนผ่าน Supabase Auth (authenticated) มีสิทธิ์เต็ม: อนุมัติ / ปรับปรุง / ลบ / ดูทุกรายการ
create policy reports_admin_all on public.reports
  for all to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------------------
-- 2. ตาราง feedback (ข้อเสนอแนะและข้อติชมจากประชาชน)
-- ---------------------------------------------------------------------
alter table public.feedback enable row level security;

drop policy if exists feedback_all on public.feedback;
drop policy if exists feedback_insert_public on public.feedback;
drop policy if exists feedback_admin_all on public.feedback;

-- 2.1 ประชาชนทั่วไป (anon) สามารถส่งข้อเสนอแนะเข้ามาได้
create policy feedback_insert_public on public.feedback
  for insert to anon, authenticated
  with check (true);

-- 2.2 เฉพาะแอดมิน (authenticated) เท่านั้นที่อ่าน แก้ไข หรือลบข้อเสนอแนะได้
--     บุคคลภายนอก (anon) จะถูกบล็อก ไม่สามารถอ่านเบอร์โทรหรือข้อความของคนอื่นได้เด็ดขาด
create policy feedback_admin_all on public.feedback
  for all to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------------------
-- 3. ตาราง announcements (การประกาศแจ้งเตือนและข่าวสารหน้าเว็บ)
-- ---------------------------------------------------------------------
alter table public.announcements enable row level security;

drop policy if exists announcements_all on public.announcements;
drop policy if exists announcements_select_public on public.announcements;
drop policy if exists announcements_admin_all on public.announcements;

-- 3.1 ประชาชนทั่วไป (anon) อ่านได้เฉพาะประกาศที่กำลังเปิดใช้งานอยู่ (is_active = true)
create policy announcements_select_public on public.announcements
  for select to anon
  using (is_active = true);

-- 3.2 เฉพาะแอดมิน (authenticated) เท่านั้นที่สร้าง แก้ไข หรือลบประกาศได้
--     (ป้องกันบุคคลภายนอกปลอมแปลงประกาศเตือนภัยบนหน้าเว็บ)
create policy announcements_admin_all on public.announcements
  for all to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------------------
-- 4. ตาราง visitors (สถิติและจำนวนผู้เข้าชมสด)
-- ---------------------------------------------------------------------
alter table public.visitors enable row level security;

drop policy if exists visitors_all on public.visitors;
drop policy if exists visitors_insert_public on public.visitors;
drop policy if exists visitors_update_public on public.visitors;
drop policy if exists visitors_select_public on public.visitors;
drop policy if exists visitors_admin_all on public.visitors;

-- 4.1 บันทึกสถิติผู้เข้าชมและการส่ง Ping ออนไลน์ (anon & authenticated)
create policy visitors_insert_public on public.visitors
  for insert to anon, authenticated
  with check (true);

create policy visitors_update_public on public.visitors
  for update to anon, authenticated
  using (true)
  with check (true);

-- 4.2 อนุญาตให้อ่านสถิติยอดผู้เข้าชมได้
create policy visitors_select_public on public.visitors
  for select to anon
  using (true);

-- 4.3 การลบสถิติหรือประวัติผู้เข้าชม สงวนสิทธิ์ให้เฉพาะแอดมินเท่านั้น (anon ห้ามลบ)
create policy visitors_admin_all on public.visitors
  for all to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------------------
-- 5. ตาราง admin_trash (ถังขยะกู้คืนข้อมูลที่ถูกลบ)
-- ---------------------------------------------------------------------
alter table public.admin_trash enable row level security;

drop policy if exists admin_trash_all on public.admin_trash;
drop policy if exists admin_trash_admin_only on public.admin_trash;

-- ตัดสิทธิ์บุคคลภายนอก (anon) ทั้งหมดโดยสิ้นเชิง
revoke all on public.admin_trash from anon;

-- เฉพาะแอดมิน (authenticated) เท่านั้นที่เข้าถึงถังขยะได้
create policy admin_trash_admin_only on public.admin_trash
  for all to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------------------
-- 6. ตาราง admin_sessions (ประวัติและเซสชันการเข้าสู่ระบบแอดมิน)
-- ---------------------------------------------------------------------
alter table public.admin_sessions enable row level security;

drop policy if exists admin_sessions_all on public.admin_sessions;
drop policy if exists admin_sessions_admin_only on public.admin_sessions;

-- ตัดสิทธิ์บุคคลภายนอก (anon) ทั้งหมดโดยสิ้นเชิง
revoke all on public.admin_sessions from anon;

-- เฉพาะแอดมิน (authenticated) เท่านั้นที่เข้าถึงตาราง sessions ได้
create policy admin_sessions_admin_only on public.admin_sessions
  for all to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------------------
-- 7. ตาราง admin_accounts (ข้อมูลบัญชีและรหัสผ่านแอดมินที่แฮชแล้ว)
-- ---------------------------------------------------------------------
alter table public.admin_accounts enable row level security;
revoke all on public.admin_accounts from anon, authenticated;

-- หมายเหตุ: ตรวจสอบรหัสผ่านผ่าน Function ด้านล่างเท่านั้น ไม่สามารถ Query ตารางนี้ตรงๆ ได้


-- ---------------------------------------------------------------------
-- 8. Functions สำหรับจัดการฐานข้อมูลอย่างปลอดภัย (Security Definer RPC)
-- ---------------------------------------------------------------------

-- ตรวจสอบรหัสผ่านแอดมิน
create or replace function public.admin_verify(p_username text, p_password text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r public.admin_accounts;
begin
  select * into r from public.admin_accounts where username = lower(trim(p_username));
  if found and r.pass_hash = crypt(p_password, r.pass_hash) then
    return jsonb_build_object('ok', true, 'admin_key', r.admin_key, 'label', r.label, 'username', r.username);
  end if;
  perform pg_sleep(0.6); -- หน่วงเวลาป้องกัน Brute-force
  return jsonb_build_object('ok', false);
end $$;

-- เปลี่ยนรหัสผ่านแอดมิน
create or replace function public.admin_change_password(p_username text, p_old text, p_new text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare r public.admin_accounts;
begin
  select * into r from public.admin_accounts where username = lower(trim(p_username));
  if not found then return false; end if;
  if r.pass_hash <> crypt(p_old, r.pass_hash) and r.pass_hash <> 'INITIAL_SETUP_REQUIRED' then
    return false;
  end if;
  if length(p_new) < 8 then return false; end if;
  update public.admin_accounts
     set pass_hash = crypt(p_new, gen_salt('bf', 10)),
         updated_at = now()
   where username = lower(trim(p_username));
  return true;
end $$;
