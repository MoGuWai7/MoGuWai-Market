// 홈 페이지 — 히어로, 카테고리 칩, 최신 / 인기 상품 섹션
// - 60초 ISR 캐싱 (revalidate)
// - 당근마켓 스타일: 큰 히어로 배너, 칩 네비게이션, 4열 그리드
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import type { Category, Product } from "@/types";

export const revalidate = 60;

async function getHomeData() {
  const supabase = await createClient();
  const select = "id,title,price,status,thumbnail_url,favorite_count,created_at,category:categories(id,name,slug)";

  // 최신/인기/카테고리 병렬 조회로 TTFB 단축
  const [latestRes, popularRes, categoriesRes] = await Promise.all([
    supabase.from("products").select(select).eq("status", "selling").order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select(select).eq("status", "selling").order("favorite_count", { ascending: false }).limit(8),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  return {
    latest: (latestRes.data ?? []) as unknown as Product[],
    popular: (popularRes.data ?? []) as unknown as Product[],
    categories: (categoriesRes.data ?? []) as Category[],
  };
}

export default async function HomePage() {
  const { latest, popular, categories } = await getHomeData();

  return (
    <main className="min-h-screen bg-white">
      {/* ─────── 히어로 배너 ─────── */}
      <section className="bg-gradient-to-br from-[var(--brand-50)] via-white to-white border-b border-neutral-100">
        <div className="max-w-screen-xl mx-auto px-4 py-16 sm:py-20 grid sm:grid-cols-2 items-center gap-10">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-100)] text-[var(--brand-700)] text-xs font-semibold mb-4">
              NEW · 모과이 마켓
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
              필요한 건 사고,<br />
              <span className="text-[var(--brand-500)]">안 쓰는 건 팔고.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-neutral-600 leading-relaxed">
              동네 이웃과 믿을 수 있는 중고거래.<br />
              지금 모과이 마켓에서 시작해보세요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="px-6 py-3 bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white text-sm font-semibold rounded-full transition-colors shadow-sm"
              >
                상품 둘러보기
              </Link>
              <Link
                href="/products/new"
                className="px-6 py-3 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-900 text-sm font-semibold rounded-full transition-colors"
              >
                판매하기
              </Link>
            </div>
          </div>

          {/* 히어로 우측 장식 — 실제 서비스 느낌의 카드 스택 목업 */}
          <div className="hidden sm:block relative h-72">
            <div className="absolute top-0 right-0 w-48 h-60 rounded-3xl bg-white shadow-xl border border-neutral-100 rotate-6 overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-[var(--brand-200)] to-[var(--brand-400)]" />
              <div className="p-3">
                <div className="h-2.5 w-24 rounded-full bg-neutral-200" />
                <div className="mt-2 h-3 w-16 rounded-full bg-neutral-900" />
              </div>
            </div>
            <div className="absolute top-10 right-36 w-48 h-60 rounded-3xl bg-white shadow-xl border border-neutral-100 -rotate-3 overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-amber-200 to-amber-400" />
              <div className="p-3">
                <div className="h-2.5 w-28 rounded-full bg-neutral-200" />
                <div className="mt-2 h-3 w-20 rounded-full bg-neutral-900" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── 카테고리 칩 ─────── */}
      {categories.length > 0 && (
        <section className="border-b border-neutral-100 sticky top-16 bg-white/95 backdrop-blur z-40">
          <div className="max-w-screen-xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <Link
                href="/products"
                className="flex-shrink-0 px-4 py-2 text-[13px] font-semibold rounded-full bg-neutral-900 text-white"
              >
                전체
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category_id=${cat.id}`}
                  className="flex-shrink-0 px-4 py-2 text-[13px] font-medium rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────── 최신 상품 / 인기 상품 ─────── */}
      <div className="max-w-screen-xl mx-auto px-4 py-10 space-y-14">
        <SectionBlock title="따끈따끈 최신 상품" subtitle="방금 올라온 매물을 놓치지 마세요" href="/products?sort=latest" products={latest} />
        {popular.length > 0 && (
          <SectionBlock title="지금 인기있는 상품" subtitle="사람들이 제일 많이 찜한 상품" href="/products?sort=popular" products={popular} />
        )}
      </div>

      {/* ─────── 하단 CTA ─────── */}
      <section className="bg-neutral-50 border-t border-neutral-100">
        <div className="max-w-screen-xl mx-auto px-4 py-14 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            안 쓰는 물건을 돈으로 바꿔보세요
          </h3>
          <p className="mt-3 text-neutral-500">사진 몇 장이면 충분해요. 1분이면 판매 등록 끝.</p>
          <Link
            href="/products/new"
            className="inline-flex mt-6 px-7 py-3 bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white text-sm font-semibold rounded-full transition-colors shadow-sm"
          >
            지금 판매 등록하기 →
          </Link>
        </div>
      </section>
    </main>
  );
}

/** 홈 페이지 전용 섹션 블록 — 타이틀 + 상품 그리드 */
function SectionBlock({
  title, subtitle, href, products,
}: { title: string; subtitle: string; href: string; products: Product[] }) {
  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">{title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        </div>
        <Link href={href} className="text-sm font-medium text-neutral-600 hover:text-[var(--brand-500)] transition-colors">
          더보기 →
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="text-center text-neutral-400 py-12 text-sm">등록된 상품이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-8">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
