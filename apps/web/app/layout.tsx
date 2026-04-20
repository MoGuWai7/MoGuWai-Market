// 웹 앱 루트 레이아웃
// - Pretendard 폰트는 globals.css에서 CDN 로드
// - 전역 헤더는 인증 페이지에서 자동 숨김 (Header 컴포넌트 내부 로직)
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "모과이 마켓 — 믿을 수 있는 중고거래",
  description: "동네에서 믿을 수 있는 중고거래, 모과이 마켓",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-white text-neutral-900">
        <Header />
        {children}
      </body>
    </html>
  );
}
