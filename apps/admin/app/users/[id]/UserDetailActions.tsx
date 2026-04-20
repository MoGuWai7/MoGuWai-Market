"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UserDetailActions({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const toggle = async () => {
    const newBanned = !isBanned;
    await supabase.from("users").update({ is_banned: newBanned }).eq("id", userId);
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
    <button
      onClick={toggle}
      className={`px-4 py-2 text-sm font-semibold rounded-xl text-white ${isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} transition-colors`}
    >
      {isBanned ? "정지 해제" : "계정 정지"}
    </button>
  );
}
