import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/layout/AdminLayout";
import { formatDate } from "@/lib/utils";
import type { AdminActionLog } from "@/types";

const LIMIT = 30;

const ACTION_LABEL: Record<string, string> = {
  ban_user: "회원 정지",
  unban_user: "정지 해제",
  delete_product: "상품 삭제",
  report_resolved: "신고 처리",
  report_dismissed: "신고 기각",
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const actionFilter = params.action ?? "";
  const supabase = await createClient();

  let q = supabase
    .from("admin_action_logs")
    .select("*, admin:users!admin_action_logs_admin_id_fkey(id,nickname)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (actionFilter) q = q.eq("action", actionFilter);

  const from = (page - 1) * LIMIT;
  q = q.range(from, from + LIMIT - 1);

  const { data, count } = await q;
  const logs = (data ?? []) as AdminActionLog[];
  const totalPages = Math.ceil((count ?? 0) / LIMIT);

  const actions = Object.keys(ACTION_LABEL);

  return (
    <AdminLayout title="운영 로그">
      <div className="p-6">
        {/* 필터 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <a
            href="/logs"
            className={`px-3 py-1.5 text-sm rounded-full ${!actionFilter ? "bg-slate-800 text-white" : "border border-gray-200 bg-white text-gray-600"}`}
          >
            전체
          </a>
          {actions.map((a) => (
            <a
              key={a}
              href={`/logs?action=${a}`}
              className={`px-3 py-1.5 text-sm rounded-full ${actionFilter === a ? "bg-slate-800 text-white" : "border border-gray-200 bg-white text-gray-600"}`}
            >
              {ACTION_LABEL[a]}
            </a>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-4">총 {(count ?? 0).toLocaleString()}건</p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">액션</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">관리자</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">대상 유형</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">대상 ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">로그가 없습니다.</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.admin?.nickname ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{log.target_type ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono truncate max-w-[120px]">{log.target_id ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-6">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              const qs = new URLSearchParams({ ...(actionFilter ? { action: actionFilter } : {}), page: String(p) }).toString();
              return (
                <a key={p} href={`/logs?${qs}`} className={`px-3 py-1.5 text-sm rounded-lg ${p === page ? "bg-slate-800 text-white" : "border border-gray-200 bg-white"}`}>{p}</a>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
