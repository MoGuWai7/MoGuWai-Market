// 관리자 로그인 페이지 — 인증 후 app_metadata.role = "admin" 확인
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    // 관리자 역할 확인 — app_metadata.role이 "admin"이어야 접근 가능
    // (app_metadata는 service_role key로만 수정 가능 → 보안 유지)
    if (data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("관리자 권한이 없습니다. 관리자 계정으로 로그인해주세요.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-white">MoGuWai Market</span>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-700 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            <span className="text-xs text-slate-300">Admin Console</span>
          </div>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="text-lg font-bold text-gray-900 mb-1">관리자 로그인</h1>
          <p className="text-sm text-gray-400 mb-6">관리자 계정으로 로그인하세요</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="mt-2 bg-slate-800 hover:bg-slate-700 w-full"
            >
              로그인
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          관리자 권한 설정은 Supabase Dashboard에서 app_metadata를 통해 관리됩니다.
        </p>
      </div>
    </div>
  );
}
