// 방문자 로그 API — secret key 헤더 검증, 불일치 시 404 (엔드포인트 존재 자체를 숨김)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function unauthorized() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

function isValidKey(request: NextRequest): boolean {
  const secret = process.env.VISIT_LOG_SECRET_KEY;
  if (!secret) return false;
  return request.headers.get("x-visit-log-key") === secret;
}

// KST 오늘 00:00:00 을 UTC ISO 문자열로 변환
function getTodayKSTasUTC(): string {
  const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }); // 'YYYY-MM-DD'
  return new Date(`${dateStr}T00:00:00+09:00`).toISOString();
}

export async function GET(request: NextRequest) {
  if (!isValidKey(request)) return unauthorized();

  const supabase = getServiceClient();
  const todayStart = getTodayKSTasUTC();

  const [logsRes, totalRes, todayRes, desktopRes, mobileRes] = await Promise.all([
    supabase
      .from("access_logs")
      .select("*")
      .order("visited_at", { ascending: false })
      .limit(500),
    supabase.from("access_logs").select("*", { count: "exact", head: true }),
    supabase
      .from("access_logs")
      .select("*", { count: "exact", head: true })
      .gte("visited_at", todayStart),
    supabase
      .from("access_logs")
      .select("*", { count: "exact", head: true })
      .eq("device_type", "desktop"),
    supabase
      .from("access_logs")
      .select("*", { count: "exact", head: true })
      .eq("device_type", "mobile"),
  ]);

  return NextResponse.json({
    logs: logsRes.data ?? [],
    stats: {
      total: totalRes.count ?? 0,
      today: todayRes.count ?? 0,
      desktop: desktopRes.count ?? 0,
      mobile: mobileRes.count ?? 0,
    },
  });
}

export async function DELETE(request: NextRequest) {
  if (!isValidKey(request)) return unauthorized();

  const supabase = getServiceClient();
  // not null 조건으로 전체 삭제 (RLS service_role 정책 적용)
  const { error } = await supabase.from("access_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
