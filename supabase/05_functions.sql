-- ============================================================
-- MoGuWai Market — PostgreSQL 함수
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 상품 조회수 증가 (중복 방지 없음 — 단순 increment)
CREATE OR REPLACE FUNCTION increment_view_count(product_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE products
  SET view_count = view_count + 1
  WHERE id = product_id;
$$;
