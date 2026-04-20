// Next.js 미들웨어 — 세션 갱신 + 방문자 로그 수집 (응답 후 비동기)
import { type NextRequest, NextFetchEvent } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getGeoInfo } from "@/lib/geoip";

// 로그 수집 제외 경로 prefix
const SKIP_LOG = ["/api/", "/_next/", "/favicon.ico", "/visit-log"];

function parseUA(ua: string): { os: string; browser: string; device_type: "mobile" | "desktop" | "tablet" } {
  const isTablet = /iPad/i.test(ua);
  const isMobile = !isTablet && /iPhone|iPod|Android/i.test(ua);

  let os = "기타";
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "기타";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";

  return {
    os,
    browser,
    device_type: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
  };
}

async function insertLog(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.warn("[visit-log] SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_URL 미설정");
    return;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const ua = request.headers.get("user-agent") ?? "";
  const { os, browser, device_type } = parseUA(ua);
  const geo = await getGeoInfo(ip);

  await fetch(`${supabaseUrl}/rest/v1/access_logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      ip,
      country_code: geo?.country_code ?? null,
      country_name: geo?.country_name ?? null,
      city: geo?.city ?? null,
      device_type,
      os,
      browser,
      path: request.nextUrl.pathname,
      referrer: request.headers.get("referer") ?? null,
    }),
  });
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // 응답 반환 후 비동기 insert — 사용자 응답 속도에 영향 없음
  if (!SKIP_LOG.some((p) => pathname.startsWith(p))) {
    event.waitUntil(
      insertLog(request).catch((e) => console.error("[visit-log] insert failed:", e))
    );
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
