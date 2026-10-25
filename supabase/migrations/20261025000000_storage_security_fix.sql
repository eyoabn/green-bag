-- Storage Security Fix: Drop legacy wide-open policies that bypassed RLS
-- Date: 2026-10-25

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated and public uploads" ON storage.objects;
