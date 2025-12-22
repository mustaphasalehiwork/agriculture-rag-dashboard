-- راهنمای ایجاد کاربر ادمین پیش‌فرض
-- ====================================

-- روش پیشنهادی و ساده:
-- 1. از طریق فرم ورود/ثبت‌نام پروژه، یک کاربر جدید بسازید
-- 2. ایمیل ساخته شده را به لیست adminEmails در AuthContext.tsx اضافه کنید

-- مقادیر پیشنهادی برای کاربر ادمین:
-- ایمیل: admin@example.com
-- رمز عبور: admin123

-- اگر می‌خواهید از طریق SQL کاربر بسازید، از روش زیر استفاده کنید:

-- روش SQL (تنها برای کاربران پیشرفته)
-- ===================================

-- ابتدا تابع helper را ایجاد کنید
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  -- ایجاد کاربر در جدول auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    email,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    last_sign_in_at,
    encrypted_password
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'admin@example.com',
    now(),
    '',
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "admin", "name": "Administrator"}',
    false,
    now(),
    now(),
    now(),
    crypt('admin123', gen_salt('bf'))
  );

  -- تأیید ایمیل کاربر
  UPDATE auth.users SET email_confirmed_at = now() WHERE id = user_id;
END;
$$;

-- اجرای تابع
SELECT create_admin_user();

-- پاک کردن تابع بعد از اجرا
DROP FUNCTION IF EXISTS create_admin_user();

-- 2. ایجاد رکورد در جدول profiles (اگر این جدول را دارید)
-- INSERT INTO public.profiles (id, email, role, created_at, updated_at)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
--   'admin@example.com',
--   'admin',
--   now(),
--   now()
-- );

-- 3. فعال کردن Row Level Security (RLS) برای جداول مورد نیاز
-- -- مطمئن شوید که کاربر ادمین به تمام داده‌ها دسترسی دارد
-- ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Admin users can do everything" ON your_table_name
--   FOR ALL USING (
--     auth.jwt() ->> 'email' = 'admin@example.com'
--   );

-- 4. جایگزینی مقادیر پیش‌فرض:
-- ایمیل: admin@example.com
-- رمز عبور: admin123
--
-- بعد از ورود، حتماً رمز عبور را تغییر دهید