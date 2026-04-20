"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UserActions({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const toggle = async () => {
    const newBanned = !isBanned;
    await supabase.from("users").update({ is_banned: newBanned }).eq("id", userId);

    // 운영 로그
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_action_logs").insert({
        admin_id: user.id,
        action: newBanned ? "ban_user" : "unban_user",
        target_type: "user",
        target_id: userId,
      });
    }
    router.refresh();
  };

  return (
    <div className="flex gap-2 justify-end">
      <a href={`/users/${userId}`} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">상세</a>
      <button
        onClick={toggle}
        className={`px-2.5 py-1 text-xs rounded-lg text-white ${isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
      >
        {isBanned ? "정지 해제" : "정지"}
      </button>
    </div>
  );
}
