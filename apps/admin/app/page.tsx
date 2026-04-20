// 관리자 대시보드 — 핵심 지표 카드 + 최근 미처리 신고 + 최근 가입 회원
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/layout/AdminLayout";
import { ReportStatusBadge } from "@/components/ui/Badge";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import type { DashboardStats, Report, User } from "@/types";

async function getDashboardData(): Promise<{
  stats: DashboardStats;
  recentReports: Report[];
  recentUsers: User[];
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // 병렬로 통계 쿼리 실행
  const [
    { count: totalUsers },
    { count: totalProducts },
    { count: pendingReports },
    { count: todaySignups },
    { data: recentReports },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase
      .from("reports")
      .select("*, reporter:users!reporter_id(id, nickname, email)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("users")
      .select("id, email, nickname, role, is_banned, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    stats: {
      totalUsers: totalUsers ?? 0,
      totalProducts: totalProducts ?? 0,
      pendingReports: pendingReports ?? 0,
      todaySignups: todaySignups ?? 0,
    },
    recentReports: (recentReports as unknown as Report[]) ?? [],
    recentUsers: (recentUsers as unknown as User[]) ?? [],
  };
}

const STAT_CARDS = [
  { key: "totalUsers",    label: "전체 회원",    color: "text-blue-600"   },
  { key: "totalProducts", label: "전체 상품",    color: "text-green-600"  },
  { key: "pendingReports",label: "미처리 신고",  color: "text-red-600"    },
  { key: "todaySignups",  label: "오늘 가입",    color: "text-purple-600" },
] as const;

export default async function DashboardPage() {
  const { stats, recentReports, recentUsers } = await getDashboardData();

  return (
    <AdminLayout title="대시보드">
      <div className="p-6 space-y-6">

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ key, label, color }) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>
                {stats[key].toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 최근 미처리 신고 */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">최근 미처리 신고</h2>
              <Link href="/reports" className="text-xs text-blue-600 hover:underline">
                전체 보기
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">
                미처리 신고가 없습니다.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentReports.map((report) => (
                  <li key={report.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">{report.reason}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {report.target_type === "product" ? "상품 신고" : "사용자 신고"} ·{" "}
                          {formatTimeAgo(report.created_at)}
                        </p>
                      </div>
                      <ReportStatusBadge status={report.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 최근 가입 회원 */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">최근 가입 회원</h2>
              <Link href="/users" className="text-xs text-blue-600 hover:underline">
                전체 보기
              </Link>
            </div>

            {recentUsers.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">
                가입 회원이 없습니다.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentUsers.map((user) => (
                  <li key={user.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {user.nickname}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "회원 관리",    href: "/users" },
            { label: "상품 관리",    href: "/products" },
            { label: "신고 관리",    href: "/reports" },
            { label: "카테고리 관리",href: "/categories" },
            { label: "운영 로그",    href: "/logs" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium text-gray-700 hover:border-slate-400 hover:text-slate-900 transition-colors text-center"
            >
              {item.label}
            </Link>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}
