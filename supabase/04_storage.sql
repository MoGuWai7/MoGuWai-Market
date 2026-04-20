-- ============================================================
-- MoGuWai Market — Storage 버킷 + 정책
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ─── 버킷 생성 ───────────────────────────────────────────────
-- (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('avatars',        'avatars',        true)
ON CONFLICT (id) DO NOTHING;

-- ─── product-images 정책 ─────────────────────────────────────
-- 전체 공개 조회
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 로그인한 사용자 업로드 (본인 폴더: {user_id}/*)
CREATE POLICY "product_images_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 삭제
CREATE POLICY "product_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── avatars 정책 ────────────────────────────────────────────
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
