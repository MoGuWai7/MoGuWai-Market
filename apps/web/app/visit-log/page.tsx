// 비공개 방문자 로그 페이지 — key 쿼리 파라미터 불일치 시 404
// 접근: /visit-log?key=YOUR_SECRET_KEY
//
// 메인 사이트와 분리된 독립 관리 화면:
//   1) Header 는 /visit-log 경로에서 자동 숨김 (components/layout/Header.tsx)
//   2) 방문 집계는 middleware.ts 의 SKIP_LOG 에서 /visit-log · /api/ 가 제외되므로
//      이 페이지에 들어오거나 내부에서 API 를 호출해도 access_logs 에 기록되지 않음
import { notFound } from "next/navigation";
import VisitLogClient from "./VisitLogClient";

export default async function VisitLogPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  // key 불일치 또는 미설정 → 404 (페이지 존재 자체를 노출하지 않음)
  if (!key || key !== process.env.VISIT_LOG_SECRET_KEY) {
    notFound();
  }

  return <VisitLogClient secretKey={key} />;
}
