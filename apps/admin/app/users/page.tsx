import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/layout/AdminLayout";
import { UserBanBadge, UserRoleBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";
import UserActions from "./UserActions";

const LIMIT = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; banned?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Math.max(1, Number(params.page ?? 1));
  const bannedFilter = params.banned;
  const supabase = await createClient();

  let q = supabase
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) q = q.or(`nickname.ilike.%${search}%,email.ilike.%${search}%`);
  if (bannedFilter === "true") q = q.eq("is_banned", true);
  else if (bannedFilter === "false") q = q.eq("is_banned", false);

  const from = (page - 1) * LIMIT;
  q = q.range(from, from + LIMIT - 1);

  const { data, count } = await q;
  const users = (data ?? []) as User[];
  const totalPages = Math.ceil((count ?? 0) / LIMIT);

  return (
    <AdminLayout title="회원 관리">
      <div className="p-6">
        {/* 검색 */}
        <form className="flex gap-3 mb-6">
          <input
            name="search"
            defaultValue={search}
            placeholder="닉네임 또는 이메일 검색"
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="banned"
            defaultValue={bannedFilter ?? ""}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="">전체</option>
            <option value="false">정상</option>
            <option value="true">정지</option>
          </select>
          <button type="submit" className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900">
            검색
          </button>
        </form>

        <p className="text-sm text-gray-500 mb-4">총 {(count ?? 0).toLocaleString()}명</p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">회원</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">이메일</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">역할</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">가입일</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">결과가 없습니다.</td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/users/${user.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {user.nickname}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                  <td className="px-4 py-3"><UserBanBadge isBanned={user.is_banned} /></td>
                  <td className="px-4 py-3"><UserRoleBadge role={user.role} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <UserActions userId={user.id} isBanned={user.is_banned} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-6">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              const qs = new URLSearchParams({ ...(search ? { search } : {}), ...(bannedFilter ? { banned: bannedFilter } : {}), page: String(p) }).toString();
              return (
                <a
                  key={p}
                  href={`/users?${qs}`}
                  className={`px-3 py-1.5 text-sm rounded-lg ${p === page ? "bg-slate-800 text-white" : "border border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  {p}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
