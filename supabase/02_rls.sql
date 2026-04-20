-- ============================================================
-- MoGuWai Market — RLS(Row Level Security) 정책
-- 01_tables.sql 실행 후 이어서 실행
-- ============================================================

-- ─── RLS 활성화 ─────────────────────────────────────────────
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- ─── users ──────────────────────────────────────────────────
CREATE POLICY "users_select_all"   ON public.users FOR SELECT USING (true);
CREATE POLICY "users_update_own"   ON public.users FOR UPDATE USING (auth.uid() = id);

-- ─── categories ─────────────────────────────────────────────
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);
-- INSERT/UPDATE/DELETE: admin만 (service_role 또는 admin role 체크)
CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── products ───────────────────────────────────────────────
-- 전체 공개 조회
CREATE POLICY "products_select_all"   ON public.products FOR SELECT USING (true);
-- 등록: 로그인한 비차단 사용자
CREATE POLICY "products_insert_own"   ON public.products FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_banned = false)
  );
-- 수정/삭제: 본인 또는 관리자
CREATE POLICY "products_update_own"   ON public.products FOR UPDATE
  USING (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "products_delete_own"   ON public.products FOR DELETE
  USING (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── product_images ─────────────────────────────────────────
CREATE POLICY "product_images_select_all" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "product_images_manage_own" ON public.product_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid())
  );

-- ─── favorites ──────────────────────────────────────────────
CREATE POLICY "favorites_select_own"  ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own"  ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own"  ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- ─── chat_rooms ─────────────────────────────────────────────
-- 참여한 채팅방만 조회 가능
CREATE POLICY "chat_rooms_select_participant" ON public.chat_rooms FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "chat_rooms_insert_buyer" ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- ─── chat_messages ──────────────────────────────────────────
CREATE POLICY "chat_messages_select_participant" ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = room_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );
CREATE POLICY "chat_messages_insert_participant" ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = room_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );
CREATE POLICY "chat_messages_update_read" ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = room_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- ─── reports ────────────────────────────────────────────────
CREATE POLICY "reports_insert_auth"  ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_admin" ON public.reports FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "reports_update_admin" ON public.reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── admin_action_logs ──────────────────────────────────────
CREATE POLICY "logs_admin_only" ON public.admin_action_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
