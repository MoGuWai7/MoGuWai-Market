-- ============================================================
-- MoGuWai Market — 테이블 생성 마이그레이션
-- Supabase SQL Editor에서 전체 실행
-- ============================================================

-- ─── 1. users ───────────────────────────────────────────────
-- auth.users와 1:1 연동. 가입 시 trigger로 자동 생성됨
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text        UNIQUE NOT NULL,
  nickname      text        UNIQUE NOT NULL,
  avatar_url    text,
  bio           text,
  role          text        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_banned     boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. categories ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id            serial      PRIMARY KEY,
  name          text        UNIQUE NOT NULL,
  slug          text        UNIQUE NOT NULL,
  sort_order    int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 기본 카테고리 데이터
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('디지털/가전',   'electronics',  1),
  ('의류/패션',     'fashion',      2),
  ('가구/인테리어', 'furniture',    3),
  ('도서/음반',     'books',        4),
  ('스포츠/레저',   'sports',       5),
  ('뷰티/미용',     'beauty',       6),
  ('장난감/취미',   'toys',         7),
  ('식물/반려동물', 'pets',         8),
  ('기타',          'etc',          9)
ON CONFLICT (slug) DO NOTHING;

-- ─── 3. products ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id    int         NOT NULL REFERENCES public.categories(id),
  title          text        NOT NULL,
  description    text,
  price          int         NOT NULL CHECK (price >= 0),
  status         text        NOT NULL DEFAULT 'selling' CHECK (status IN ('selling', 'reserved', 'sold')),
  view_count     int         NOT NULL DEFAULT 0,
  favorite_count int         NOT NULL DEFAULT 0,
  thumbnail_url  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── 4. product_images ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_images (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. favorites ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id  uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- ─── 6. chat_rooms ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid        REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message    text,
  last_message_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, buyer_id, seller_id)
);

-- ─── 7. chat_messages ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid        NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     text        NOT NULL,
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 8. reports ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type  text        NOT NULL CHECK (target_type IN ('product', 'user')),
  target_id    uuid        NOT NULL,
  reason       text        NOT NULL,
  description  text,
  status       text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by  uuid        REFERENCES public.users(id),
  resolved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── 9. admin_action_logs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  action       text        NOT NULL,
  target_type  text,
  target_id    uuid,
  detail       jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── 인덱스 ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_seller_id    ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id  ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status       ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at   ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id     ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id  ON public.favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_reports_status        ON public.reports(status);
