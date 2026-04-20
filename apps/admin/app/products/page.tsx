import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/layout/AdminLayout";
import { ProductStatusBadge } from "@/components/ui/Badge";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Product, Category } from "@/types";
import ProductAdminActions from "./ProductAdminActions";

const LIMIT = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string; category_id?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Math.max(1, Number(params.page ?? 1));
  const status = params.status ?? "all";
  const categoryId = params.category_id ? Number(params.category_id) : undefined;
  const supabase = await createClient();

  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from("categories").select("id,name").order("sort_order"),
    (async () => {
      let q = supabase
        .from("products")
        .select(
          "id,title,price,status,created_at,view_count,favorite_count,seller:users!products_seller_id_fkey(id,nickname,email),category:categories(id,name)",
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (status !== "all") q = q.eq("status", status);
      if (categoryId) q = q.eq("category_id", categoryId);
      if (search) q = q.ilike("title", `%${search}%`);

      const from = (page - 1) * LIMIT;
      return q.range(from, from + LIMIT - 1);
    })(),
  ]);

  const categories = (categoriesRes.data ?? []) as Category[];
  const products = (productsRes.data ?? []) as Product[];
  const totalCount = productsRes.count ?? 0;
  const totalPages = Math.ceil(totalCount / LIMIT);

  return (
    <AdminLayout title="상품 관리">
      <div className="p-6">
        <form className="flex flex-wrap gap-3 mb-6">
          <input
            name="search"
            defaultValue={search}
            placeholder="상품명 검색"
            className="flex-1 min-w-[200px] px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select name="status" defaultValue={status} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
            <option value="all">전체 상태</option>
            <option value="selling">판매중</option>
            <option value="reserved">예약중</option>
            <option value="sold">판매완료</option>
          </select>
          <select name="category_id" defaultValue={categoryId ?? ""} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
            <option value="">전체 카테고리</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900">검색</button>
        </form>

        <p className="text-sm text-gray-500 mb-4">총 {totalCount.toLocaleString()}개</p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">상품명</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">판매자</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">가격</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">조회/관심</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">등록일</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">결과가 없습니다.</td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.category?.name ?? "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{p.seller?.nickname ?? "-"}</p>
                    <p className="text-xs text-gray-400">{p.seller?.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3"><ProductStatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.view_count} / {p.favorite_count}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <ProductAdminActions productId={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-6">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              const qs = new URLSearchParams({ ...(search ? { search } : {}), ...(status !== "all" ? { status } : {}), page: String(p) }).toString();
              return (
                <a key={p} href={`/products?${qs}`} className={`px-3 py-1.5 text-sm rounded-lg ${p === page ? "bg-slate-800 text-white" : "border border-gray-200 bg-white"}`}>{p}</a>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
