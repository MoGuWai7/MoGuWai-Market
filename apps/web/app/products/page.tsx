import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import SortSelect from "@/components/product/SortSelect";
import type { Category, Product, ProductSortKey } from "@/types";
import Link from "next/link";

export const revalidate = 0;

interface SearchParams {
  search?: string;
  category_id?: string;
  sort?: string;
  status?: string;
  page?: string;
}

const LIMIT = 20;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const categoryId = params.category_id ? Number(params.category_id) : undefined;
  const sort = (params.sort ?? "latest") as ProductSortKey;
  const status = params.status ?? "selling";
  const page = Math.max(1, Number(params.page ?? 1));

  const supabase = await createClient();

  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    (async () => {
      let q = supabase
        .from("products")
        .select(
          "id,title,price,status,thumbnail_url,favorite_count,created_at,category:categories(id,name,slug)",
          { count: "exact" }
        );

      if (status !== "all") q = q.eq("status", status);
      if (categoryId) q = q.eq("category_id", categoryId);
      if (search) q = q.ilike("title", `%${search}%`);

      if (sort === "price_asc") q = q.order("price", { ascending: true });
      else if (sort === "price_desc") q = q.order("price", { ascending: false });
      else if (sort === "popular") q = q.order("favorite_count", { ascending: false });
      else q = q.order("created_at", { ascending: false });

      const from = (page - 1) * LIMIT;
      q = q.range(from, from + LIMIT - 1);

      return q;
    })(),
  ]);

  const categories = (categoriesRes.data ?? []) as Category[];
  const products = (productsRes.data ?? []) as Product[];
  const totalCount = productsRes.count ?? 0;
  const totalPages = Math.ceil(totalCount / LIMIT);

  const buildHref = (overrides: SearchParams) => {
    const p: Record<string, string> = {};
    if (search) p.search = search;
    if (categoryId) p.category_id = String(categoryId);
    if (sort !== "latest") p.sort = sort;
    if (status !== "selling") p.status = status;
    // undefined 값은 키 자체를 제거해야 URLSearchParams가 "undefined" 문자열을 URL에 박지 않음
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined) delete p[k as keyof typeof p];
      else p[k] = v;
    });
    const qs = new URLSearchParams(p).toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        {/* 검색 + 필터 헤더 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form action="/products" className="flex-1 flex gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder="상품 검색..."
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {!!categoryId && <input type="hidden" name="category_id" value={categoryId} />}
            {sort !== "latest" && <input type="hidden" name="sort" value={sort} />}
            {status !== "selling" && <input type="hidden" name="status" value={status} />}
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              검색
            </button>
          </form>
          <SortSelect current={sort} />
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          <Link
            href={buildHref({ category_id: undefined, page: "1" })}
            className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              !categoryId ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            전체
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildHref({ category_id: String(cat.id), page: "1" })}
              className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                categoryId === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* 상태 필터 */}
        <div className="flex gap-2 mb-5">
          {(["selling", "all"] as const).map((s) => (
            <Link
              key={s}
              href={buildHref({ status: s, page: "1" })}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                status === s
                  ? "bg-gray-800 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {s === "selling" ? "판매중만" : "전체 상태"}
            </Link>
          ))}
        </div>

        {/* 결과 수 */}
        <p className="text-sm text-gray-500 mb-4">총 {totalCount.toLocaleString()}개의 상품</p>

        {/* 상품 그리드 */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">검색 결과가 없습니다.</p>
            <Link href="/products/new" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
              첫 번째 상품을 등록해보세요
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-8">
            {page > 1 && (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-gray-300 bg-white"
              >
                이전
              </Link>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <Link
                  key={p}
                  href={buildHref({ page: String(p) })}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    p === page ? "bg-blue-600 text-white" : "border border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-gray-300 bg-white"
              >
                다음
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
