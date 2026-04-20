// 인증 페이지 공통 레이아웃 — 좌측 브랜드 패널 + 우측 폼
// - 데스크톱: 2분할 (브랜드 히어로 | 폼)
// - 모바일: 단일 컬럼 + 상단 로고
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* 좌측 — 브랜드 히어로 (데스크톱 전용) */}
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--brand-500)] via-[var(--brand-600)] to-[var(--brand-700)]">
        {/* 장식 블롭 */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[var(--brand-500)]">
              M
            </span>
            <span className="text-xl font-bold">모과이 마켓</span>
          </Link>

          <div>
            <h2 className="text-4xl font-bold leading-tight">
              이웃과 함께하는<br />
              따뜻한 중고거래
            </h2>
            <p className="mt-4 text-white/80 text-[15px] leading-relaxed">
              믿을 수 있는 거래,<br />
              모과이 마켓에서 시작하세요.
            </p>
          </div>

          <p className="text-xs text-white/60">© MoGuWai Market. All rights reserved.</p>
        </div>
      </aside>

      {/* 우측 — 폼 카드 */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 bg-neutral-50 lg:bg-white">
        <div className="w-full max-w-sm">
          {/* 모바일용 로고 */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <span className="w-9 h-9 rounded-full bg-[var(--brand-500)] flex items-center justify-center font-bold text-white">
              M
            </span>
            <span className="text-lg font-bold text-neutral-900">모과이 마켓</span>
          </Link>

          <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm lg:shadow-none lg:border-0 p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
