"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatTimeAgo, cn } from "@/lib/utils";
import type { ChatMessage, ChatRoom } from "@/types";

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setMyId(user.id);

    const [roomRes, msgsRes] = await Promise.all([
      supabase
        .from("chat_rooms")
        .select("*, product:products(id,title,thumbnail_url,status), buyer:users!chat_rooms_buyer_id_fkey(id,nickname,avatar_url), seller:users!chat_rooms_seller_id_fkey(id,nickname,avatar_url)")
        .eq("id", id)
        .single(),
      supabase
        .from("chat_messages")
        .select("*, sender:users!chat_messages_sender_id_fkey(id,nickname,avatar_url)")
        .eq("room_id", id)
        .order("created_at", { ascending: true })
        .limit(100),
    ]);

    if (roomRes.error || !roomRes.data) { router.replace("/chat"); return; }
    const r = roomRes.data as ChatRoom;
    if (r.buyer_id !== user.id && r.seller_id !== user.id) { router.replace("/chat"); return; }

    setRoom(r);
    setMessages((msgsRes.data ?? []) as ChatMessage[]);
    setLoading(false);

    // 읽음 처리
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("room_id", id)
      .neq("sender_id", user.id)
      .eq("is_read", false);
  }, [id, router, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Realtime 구독 — RLS 가 적용된 chat_messages 를 구독하려면 WebSocket 에 access_token
  // 이 전달되어야 한다. subscribe 직전에 setAuth 로 명시적으로 세션 토큰을 실어 준다.
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
      }

      channel = supabase
        .channel(`chat:${id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${id}` },
          async (payload) => {
            const msg = payload.new as ChatMessage;
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));

            const { data: senderData } = await supabase
              .from("users")
              .select("id,nickname,avatar_url")
              .eq("id", msg.sender_id)
              .single();
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, sender: senderData ?? undefined } : m)),
            );

            if (msg.sender_id !== myId) {
              await supabase.from("chat_messages").update({ is_read: true }).eq("id", msg.id);
            }
          }
        )
        .subscribe((status) => {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[chat:${id}] realtime status:`, status);
          }
        });
    })();

    // 토큰 갱신 시 realtime WebSocket 에도 새 토큰 재주입 — 1시간 후 끊김 방지
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
      authSub.unsubscribe();
    };
  }, [id, myId, supabase]);

  // 메시지 전송 — 낙관적 UI 업데이트 + Realtime 이중 처리로 이중노출 방지
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !myId || sending) return;
    setSending(true);
    setInput("");

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ room_id: id, sender_id: myId, content })
      .select("*, sender:users!chat_messages_sender_id_fkey(id,nickname,avatar_url)")
      .single();

    if (error) {
      console.error("send message failed:", error);
      setInput(content);  // 실패 시 입력 내용 복구
      alert(`메시지 전송에 실패했습니다: ${error.message}`);
    } else if (data) {
      // Realtime 이벤트가 먼저 도착했을 수도 있으므로 중복 방지
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data as ChatMessage],
      );
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room || !myId) return null;

  const other = room.buyer_id === myId ? room.seller : room.buyer;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-sm mx-auto h-screen flex flex-col border-x border-gray-200 bg-white">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => router.push("/chat")} className="text-gray-500 hover:text-gray-700">
            ←
          </button>
          <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {other?.avatar_url ? (
              <Image src={other.avatar_url} alt="" width={36} height={36} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">👤</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{other?.nickname ?? "알 수 없음"}</p>
          </div>
          {room.product && (
            <Link
              href={`/products/${room.product.id}`}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
            >
              {room.product.thumbnail_url && (
                <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                  <Image src={room.product.thumbnail_url} alt="" fill className="object-cover" sizes="32px" />
                </div>
              )}
              <p className="text-xs text-gray-600 truncate max-w-[100px]">{room.product.title}</p>
            </Link>
          )}
        </header>

        {/* 메시지 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 mt-10">첫 메시지를 보내보세요!</p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === myId;
            return (
              <div key={msg.id} className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}>
                {!isMine && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {msg.sender?.avatar_url ? (
                      <Image src={msg.sender.avatar_url} alt="" width={32} height={32} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">👤</div>
                    )}
                  </div>
                )}
                <div className={cn("max-w-[70%]", isMine && "items-end flex flex-col")}>
                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-400 mt-1">{formatTimeAgo(msg.created_at)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <form
          onSubmit={send}
          className="bg-white border-t border-gray-200 px-4 py-3 flex gap-2 flex-shrink-0"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2.5 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
