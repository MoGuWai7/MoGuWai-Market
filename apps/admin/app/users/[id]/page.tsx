import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/layout/AdminLayout";
import { UserBanBadge, UserRoleBadge, ProductStatusBadge } from "@/components/ui/Badge";
import { formatDate, formatPrice } from "@/lib/utils";
import type { User, Product } from "@/types";
import UserDetailActions from "./UserDetailActions";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [userRes, productsRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", id).single(),
    supabase
      .from("products")
      .select("id,title,price,status,created_at,category:categories(id,name)")
      .eq("seller_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (userRes.error || !userRes.data) notFound();

  const user = userRes.data as User;
  const products = (productsRes.data ?? []) as unknown as Product[];

  return (
    <AdminLayout title="회원 상세">
      <div className="p-6 space-y-6">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.nickname}</h2>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              {user.bio && <p className="text-sm text-gray-600 mt-2">{user.bio}</p>}
              <div className="flex gap-2 mt-3">
                <UserBanBadge isBanned={user.is_banned} />
                <UserRoleBadge role={user.role} />
              </div>
              <p className="text-xs text-gray-400 mt-3">가입일: {formatDate(user.created_at)}</p>
            </div>
            <UserDetailActions userId={user.id} isBanned={user.is_banned} />
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">등록 상품 ({products.length})</h3>
          </div>
          {products.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">등록된 상품이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">제목</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">카테고리</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">가격</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">상태</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a href={`/products?search=${encodeURIComponent(p.title)}`} className="text-gray-900 hover:text-blue-600 font-medium line-clamp-1">
                        {p.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3"><ProductStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
