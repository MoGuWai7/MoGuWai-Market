// 글로벌 헤더 — 로고, 검색창, 유저 메뉴
// - 당근마켓식 흰 배경 + 브랜드 오렌지 포인트
// - 인증 페이지(/login, /register) 및 비공개 관리 페이지(/visit-log)에서는 헤더 자체를 숨김
//   → /visit-log 는 메인 사이트 프레임과 분리된 독립 화면으로 동작해야 하므로 제외
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// 헤더를 숨길 경로 — 인증/비공개 관리 페이지
const HIDE_ON_PATHS = ["/login", "/register", "/visit-log"];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // 세션 로드 + 실시간 변경 감지 (로그인/로그아웃 즉시 반영)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null),
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  if (HIDE_ON_PATHS.includes(pathname)) return null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100">
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center gap-5">
        {/* 로고 — 당근과 다른 느낌으로 원형 오렌지 뱃지 + 워드마크 */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-full bg-[var(--brand-500)] flex items-center justify-center text-white font-bold text-sm">
            M
          </span>
          <span className="text-[17px] font-bold tracking-tight text-neutral-900 hidden sm:inline">
            모과이
          </span>
        </Link>

        {/* 검색창 — 둥근 사각형 + 내부 아이콘 */}
        <form action="/products" method="get" className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              name="search"
              placeholder="어떤 상품을 찾고 계세요?"
              className="w-full h-10 rounded-full bg-neutral-100 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--brand-500)] transition"
            />
          </div>
        </form>

        {/* 우측 네비게이션 */}
        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/products"
            className="hidden sm:flex px-3 py-1.5 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
          >
            상품
          </Link>

          {user ? (
            <>
              <Link
                href="/chat"
                className="flex px-3 py-1.5 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              >
                채팅
              </Link>

              {/* 판매하기 CTA */}
              <Link
                href="/products/new"
                className="hidden sm:flex items-center gap-1 px-4 py-1.5 text-sm font-semibold text-white bg-[var(--brand-500)] hover:bg-[var(--brand-600)] rounded-full transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                </svg>
                판매하기
              </Link>

              {/* 관리자 페이지 진입 — role === admin 만 노출 */}
              {user.app_metadata?.role === "admin" && (
                <a
                  href={process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-700 rounded-full transition-colors"
                >
                  관리자
                </a>
              )}

              {/* 프로필 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full hover:bg-neutral-100 transition"
                >
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center text-sm font-semibold text-white">
                    {user.email?.[0]?.toUpperCase() ?? "U"}
                  </span>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-2xl shadow-lg z-20 py-1.5 overflow-hidden">
                      <Link
                        href="/products/new"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        상품 등록
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        마이페이지
                      </Link>
                      <hr className="my-1 border-neutral-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        로그아웃
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-semibold text-white bg-[var(--brand-500)] hover:bg-[var(--brand-600)] rounded-full transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
