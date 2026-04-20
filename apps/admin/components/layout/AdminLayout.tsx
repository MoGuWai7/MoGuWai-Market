// 관리자 공통 레이아웃 — 좌측 사이드바 + 우측 콘텐츠 영역
import Sidebar from "./Sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export default function AdminLayout({
  children,
  title,
  actions,
}: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 페이지 헤더 (title이 있을 때만 렌더) */}
        {title && (
          <div className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <h1 className="text-base font-semibold text-gray-900">{title}</h1>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {/* 스크롤 가능한 본문 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
