// 로그인 페이지 — 이메일/비밀번호 기반 로그인
// - next 쿼리 파라미터로 로그인 후 리다이렉트 위치를 지정 가능
// - useSearchParams()는 Suspense로 감싸야 Next.js 15 prerender 에러를 피함
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message === "Invalid login credentials"
        ? "이메일 또는 비밀번호가 올바르지 않습니다."
        : error.message;
      setError(msg);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-neutral-900">어서오세요 👋</h1>
      <p className="mt-1.5 text-sm text-neutral-500">계정에 로그인하고 거래를 시작하세요.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          type="email"
          label="이메일"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          type="password"
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} fullWidth className="mt-2">
          로그인
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-500">
        아직 계정이 없으신가요?{" "}
        <Link href="/register" className="font-semibold text-[var(--brand-500)] hover:underline">
          회원가입
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20" />}>
      <LoginForm />
    </Suspense>
  );
}
