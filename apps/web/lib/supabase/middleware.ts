// 미들웨어용 Supabase 클라이언트 — 세션 토큰 갱신 및 라우트 보호 처리
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// 로그인이 필요한 경로 prefix
const PROTECTED_PATHS = [
  "/products/new",
  "/chat",
  "/profile",
];

// 로그인 상태에서 접근 불가 경로 (이미 로그인된 경우 홈으로)
const AUTH_PATHS = ["/login", "/register"];

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
          // 요청 쿠키 업데이트
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          // 응답 쿠키 업데이트 (갱신된 토큰 반영)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()를 반드시 호출해야 세션 토큰이 갱신됨
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 보호 경로 접근 시 로그인 페이지로 리다이렉트
  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  // /products/[id]/edit 도 보호
  const isProductEdit = /^\/products\/[^/]+\/edit/.test(pathname);

  if ((isProtected || isProductEdit) && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 이미 로그인 상태에서 인증 페이지 접근 시 홈으로
  if (AUTH_PATHS.includes(pathname) && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
