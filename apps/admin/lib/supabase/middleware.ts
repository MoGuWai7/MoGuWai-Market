// 미들웨어용 Supabase 클라이언트 — 세션 갱신 + 관리자 권한 체크
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 로그인 페이지 처리
  if (pathname === "/login") {
    // 이미 관리자로 로그인된 경우 대시보드로
    if (user && user.app_metadata?.role === "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // 모든 다른 경로는 관리자 인증 필요
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 관리자 역할 체크 — app_metadata.role = "admin" 이어야 함
  // (Supabase Dashboard 또는 service_role key로만 설정 가능 → 보안 유지)
  if (user.app_metadata?.role !== "admin") {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // 비관리자 세션 강제 만료
    await supabase.auth.signOut();
    return response;
  }

  return response;
}
