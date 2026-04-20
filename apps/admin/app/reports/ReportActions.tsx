"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ReportTargetType } from "@/types";

export default function ReportActions({
  reportId,
  targetType,
  targetId,
}: {
  reportId: string;
  targetType: ReportTargetType;
  targetId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const resolve = async (action: "resolved" | "dismissed") => {
    const label = action === "resolved" ? "처리완료" : "기각";
    if (!confirm(`신고를 "${label}"로 처리하시겠습니까?`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("reports").update({
      status: action,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", reportId);

    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      action: `report_${action}`,
      target_type: targetType,
      target_id: targetId,
      detail: { report_id: reportId },
    });

    router.refresh();
  };

  return (
    <div className="flex gap-1.5 justify-end">
      <button onClick={() => resolve("resolved")} className="px-2.5 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">처리완료</button>
      <button onClick={() => resolve("dismissed")} className="px-2.5 py-1 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">기각</button>
    </div>
  );
}
