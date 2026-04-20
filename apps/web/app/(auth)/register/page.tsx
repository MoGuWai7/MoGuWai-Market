// 회원가입 페이지
// - 클라이언트 측 유효성 검증 후 supabase.auth.signUp → 자동 로그인
// - 닉네임은 user_metadata에 저장되고 DB trigger로 users 테이블에 동기화됨
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface FormErrors {
  nickname?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nickname: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 클라이언트 유효성 검증
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (form.nickname.trim().length < 2) e.nickname = "닉네임은 2자 이상이어야 합니다.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "유효한 이메일 주소를 입력하세요.";
    if (form.password.length < 6) e.password = "비밀번호는 6자 이상이어야 합니다.";
    if (form.password !== form.passwordConfirm) e.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();

    // 가입 — user_metadata.nickname 은 trigger가 users 테이블로 복사
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nickname: form.nickname.trim() } },
    });

    if (error) {
      const msg = error.message === "User already registered"
        ? "이미 사용 중인 이메일입니다."
        : error.message;
      setServerError(msg);
      setLoading(false);
      return;
    }

    // 이메일 인증 비활성 환경 기준으로 즉시 로그인 처리
    await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    router.push("/");
    router.refresh();
  };

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
    };

  return (
    <>
      <h1 className="text-2xl font-bold text-neutral-900">환영해요 🎉</h1>
      <p className="mt-1.5 text-sm text-neutral-500">새 계정을 만들고 모과이 마켓을 시작해보세요.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="닉네임"
          placeholder="2자 이상"
          value={form.nickname}
          onChange={handleChange("nickname")}
          error={errors.nickname}
          autoComplete="nickname"
          required
        />
        <Input
          type="email"
          label="이메일"
          placeholder="example@email.com"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Input
          type="password"
          label="비밀번호"
          placeholder="6자 이상"
          value={form.password}
          onChange={handleChange("password")}
          error={errors.password}
          autoComplete="new-password"
          required
        />
        <Input
          type="password"
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력하세요"
          value={form.passwordConfirm}
          onChange={handleChange("passwordConfirm")}
          error={errors.passwordConfirm}
          autoComplete="new-password"
          required
        />

        {serverError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            {serverError}
          </p>
        )}

        <Button type="submit" loading={loading} fullWidth className="mt-2">
          가입하기
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-[var(--brand-500)] hover:underline">
          로그인
        </Link>
      </p>
    </>
  );
}
