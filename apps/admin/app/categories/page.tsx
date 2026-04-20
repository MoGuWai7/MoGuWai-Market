import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/layout/AdminLayout";
import type { Category } from "@/types";
import { formatDate } from "@/lib/utils";
import CategoryForm from "./CategoryForm";
import CategoryActions from "./CategoryActions";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  const categories = (data ?? []) as Category[];

  return (
    <AdminLayout title="카테고리 관리">
      <div className="p-6 space-y-6">
        {/* 추가 폼 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">카테고리 추가</h2>
          <CategoryForm />
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">순서</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">이름</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">슬러그</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">생성일</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">카테고리가 없습니다.</td></tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{cat.sort_order}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(cat.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <CategoryActions categoryId={cat.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
