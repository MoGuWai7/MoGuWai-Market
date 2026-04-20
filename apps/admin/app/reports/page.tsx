import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/layout/AdminLayout";
import { ReportStatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Report } from "@/types";
import ReportActions from "./ReportActions";

const LIMIT = 20;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; target_type?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const status = params.status ?? "pending";
  const targetType = params.target_type ?? "all";
  const supabase = await createClient();

  let q = supabase
    .from("reports")
    .select("*, reporter:users!reporter_id(id,nickname,email)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status !== "all") q = q.eq("status", status);
  if (targetType !== "all") q = q.eq("target_type", targetType);

  const from = (page - 1) * LIMIT;
  q = q.range(from, from + LIMIT - 1);

  const { data, count } = await q;
  const reports = (data ?? []) as Report[];
  const totalPages = Math.ceil((count ?? 0) / LIMIT);

  const buildQs = (overrides: Record<string, string>) => {
    const p: Record<string, string> = {};
    if (status !== "pending") p.status = status;
    if (targetType !== "all") p.target_type = targetType;
    Object.assign(p, overrides);
    return new URLSearchParams(p).toString();
  };

  return (
    <AdminLayout title="신고 관리">
      <div className="p-6">
        {/* 필터 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["pending", "resolved", "dismissed", "all"] as const).map((s) => (
            <a
              key={s}
              href={`/reports?${buildQs({ status: s, page: "1" })}`}
              className={`px-3 py-1.5 text-sm rounded-full ${status === s ? "bg-slate-800 text-white" : "border border-gray-200 bg-white text-gray-600"}`}
            >
              {{ pending: "미처리", resolved: "처리완료", dismissed: "기각", all: "전체" }[s]}
            </a>
          ))}
          <div className="ml-auto flex gap-2">
            {(["all", "product", "user"] as const).map((t) => (
              <a
                key={t}
                href={`/reports?${buildQs({ target_type: t, page: "1" })}`}
                className={`px-3 py-1.5 text-sm rounded-full ${targetType === t ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-600"}`}
              >
                {{ all: "전체", product: "상품", user: "사용자" }[t]}
              </a>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">총 {(count ?? 0).toLocaleString()}건</p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">신고 사유</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">대상</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">신고자</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">신고일</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">결과가 없습니다.</td></tr>
              )}
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{report.reason}</p>
                    {report.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{report.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${report.target_type === "product" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {report.target_type === "product" ? "상품" : "사용자"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{report.reporter?.nickname ?? "-"}</p>
                  </td>
                  <td className="px-4 py-3"><ReportStatusBadge status={report.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(report.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {report.status === "pending" && (
                      <ReportActions reportId={report.id} targetType={report.target_type} targetId={report.target_id} />
                    )}
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
              return (
                <a key={p} href={`/reports?${buildQs({ page: String(p) })}`} className={`px-3 py-1.5 text-sm rounded-lg ${p === page ? "bg-slate-800 text-white" : "border border-gray-200 bg-white"}`}>{p}</a>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
