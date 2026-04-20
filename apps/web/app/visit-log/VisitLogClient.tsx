// 방문자 로그 클라이언트 — 30초 자동 갱신, CSV 다운로드, 전체 삭제
"use client";

import { useEffect, useState, useCallback } from "react";

interface AccessLog {
  id: string;
  visited_at: string;
  ip: string | null;
  country_code: string | null;
  country_name: string | null;
  city: string | null;
  device_type: "mobile" | "desktop" | "tablet" | null;
  os: string | null;
  browser: string | null;
  path: string | null;
  referrer: string | null;
}

interface Stats {
  total: number;
  today: number;
  desktop: number;
  mobile: number;
}

const IP_DOT_COLORS = [
  "bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400",
  "bg-purple-400", "bg-pink-400", "bg-indigo-400", "bg-orange-400",
  "bg-teal-400", "bg-cyan-400",
];

function ipColor(ip: string): string {
  let h = 0;
  for (let i = 0; i < ip.length; i++) { h = (h << 5) - h + ip.charCodeAt(i); h |= 0; }
  return IP_DOT_COLORS[Math.abs(h) % IP_DOT_COLORS.length];
}

function formatKST(dateStr: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(dateStr));
}

function pathColor(path: string): string {
  if (path.startsWith("/products")) return "text-emerald-400";
  if (path.startsWith("/chat")) return "text-blue-400";
  if (path.startsWith("/profile")) return "text-purple-400";
  if (path === "/login" || path === "/register") return "text-yellow-400";
  if (path === "/") return "text-orange-400";
  return "text-gray-300";
}

function downloadCSV(logs: AccessLog[]) {
  const BOM = "\uFEFF";
  const headers = ["#", "시각(KST)", "IP", "국가", "도시", "디바이스", "OS", "브라우저", "경로", "유입"];
  const rows = logs.map((l, i) => [
    i + 1,
    formatKST(l.visited_at),
    l.ip ?? "",
    l.country_name ?? "",
    l.city ?? "",
    l.device_type ?? "",
    l.os ?? "",
    l.browser ?? "",
    l.path ?? "",
    l.referrer ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `visit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VisitLogClient({ secretKey }: { secretKey: string }) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, desktop: 0, mobile: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/visit-log", {
        headers: { "x-visit-log-key": secretKey },
      });
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs);
      setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [secretKey]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30_000); // 30초 자동 갱신
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleDelete = async () => {
    if (!confirm("방문 로그 전체를 삭제합니다. 복구할 수 없습니다.")) return;
    await fetch("/api/visit-log", {
      method: "DELETE",
      headers: { "x-visit-log-key": secretKey },
    });
    setLogs([]);
    setStats({ total: 0, today: 0, desktop: 0, mobile: 0 });
  };

  const STAT_CARDS = [
    { label: "총 방문", value: stats.total.toLocaleString(), sub: "누적 전체" },
    { label: "오늘 방문 (KST)", value: stats.today.toLocaleString(), sub: "당일 기준" },
    { label: "데스크탑", value: stats.desktop.toLocaleString(), sub: `전체 ${stats.total}건` },
    { label: "모바일", value: stats.mobile.toLocaleString(), sub: `· tablet 제외` },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 font-mono">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">방문자 로그</h1>
          <p className="text-xs text-gray-500 mt-1">moguwai-market · access_logs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(logs)}
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
          >
            CSV 다운로드
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-400 rounded-lg transition-colors"
          >
            전체 삭제
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-gray-600 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 mb-3">
        국가 코드 참고:{" "}
        <a
          href="https://ko.wikipedia.org/wiki/ISO_3166-1_alpha-2"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-400 underline"
        >
          ISO 3166-1 alpha-2 전체 목록 (Wikipedia)
        </a>{" "}
        — 국가명은 한국어로 자동 변환됩니다.
      </p>

      {/* 테이블 */}
      <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-600 py-20 text-sm">로그 없음</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
                  {["#", "시각 (KST)", "IP", "국가", "도시", "기기", "OS", "브라우저", "경로", "유입"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 whitespace-nowrap font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-900 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-400">{formatKST(log.visited_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.ip ? ipColor(log.ip) : "bg-gray-600"}`} />
                        <span className="text-gray-300">{log.ip ?? "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{log.country_name ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-500">{log.city ?? "-"}</td>
                    <td className="px-3 py-2 text-center">
                      {log.device_type === "mobile" ? (
                        <span className="text-orange-400">📱</span>
                      ) : (
                        <span className="text-gray-500">🖥</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{log.os ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{log.browser ?? "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={pathColor(log.path ?? "")}>{log.path ?? "-"}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 max-w-[180px] truncate">{log.referrer ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-700 mt-4 text-right">최신 500건 · 30초 자동 갱신</p>
    </div>
  );
}
