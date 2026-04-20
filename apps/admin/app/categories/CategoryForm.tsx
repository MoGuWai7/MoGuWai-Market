"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CategoryForm() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !slug.trim()) { setError("이름과 슬러그를 입력해주세요."); return; }
    setSaving(true);

    const { error: err } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: slug.trim(),
      sort_order: Number(sortOrder) || 0,
    });

    if (err) { setError(err.message); setSaving(false); return; }

    setName(""); setSlug(""); setSortOrder("");
    router.refresh();
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs text-gray-500 mb-1">이름</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="전자기기" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">슬러그</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="electronics" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 font-mono" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">순서</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-20" />
      </div>
      <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50">
        {saving ? "추가 중..." : "추가"}
      </button>
      {error && <p className="w-full text-xs text-red-500">{error}</p>}
    </form>
  );
}
