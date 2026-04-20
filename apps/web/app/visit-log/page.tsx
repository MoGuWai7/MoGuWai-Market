// 비공개 방문자 로그 페이지 — key 쿼리 파라미터 불일치 시 404
// 접근: /visit-log?key=YOUR_SECRET_KEY
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
