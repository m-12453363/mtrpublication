"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/lib/constants";
import { ArrowLeft, Plus, Send, PenSquare, Trash2, Save, X, FolderOpen } from "lucide-react";

type ChapterRow = {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  admin_notes: string;
};

export default function NovelDetailPage() {
  const params = useParams<{ novelId: string }>();
  const novelId = params.novelId;
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [novel, setNovel] = useState<any>(null);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);

  // Borang Bab
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadNovelData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(prof as UserProfile);

    const { data: novelData } = await supabase
      .from("novels")
      .select("*, profiles(full_name)")
      .eq("id", novelId)
      .single();

    if (!novelData) return router.push("/novels");
    setNovel(novelData);

    const { data: chData } = await supabase
      .from("chapters")
      .select("*")
      .eq("novel_id", novelId)
      .order("chapter_number", { ascending: true });

    if (chData) setChapters(chData as ChapterRow[]);
  }

  useEffect(() => {
    if (novelId) loadNovelData();
  }, [novelId]);

  function openNewChapter() {
    setEditingChapterId(null);
    setChapterNumber(chapters.length + 1);
    setChapterTitle("");
    setChapterContent("");
    setAdminNotes("");
    setEditorOpen(true);
  }

  function openEditChapter(ch: ChapterRow) {
    setEditingChapterId(ch.id);
    setChapterNumber(ch.chapter_number);
    setChapterTitle(ch.title);
    setChapterContent(ch.content);
    setAdminNotes(ch.admin_notes || "");
    setEditorOpen(true);
  }

  async function handleSaveChapter(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (editingChapterId) {
      await supabase
        .from("chapters")
        .update({
          chapter_number: chapterNumber,
          title: chapterTitle.trim(),
          content: chapterContent,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingChapterId);
    } else {
      await supabase.from("chapters").insert({
        novel_id: novelId,
        chapter_number: chapterNumber,
        title: chapterTitle.trim(),
        content: chapterContent,
      });
    }

    setSaving(false);
    setEditorOpen(false);
    loadNovelData();
  }

  async function handleDeleteChapter(id: string) {
    if (!confirm("Padam bab ini secara kekal?")) return;
    await supabase.from("chapters").delete().eq("id", id);
    loadNovelData();
  }

  async function updateNovelStatus(newStatus: string) {
    await supabase.from("novels").update({ status: newStatus }).eq("id", novelId);
    loadNovelData();
  }

  if (!novel) return <div className="text-xs text-slate-500">Memuatkan folder novel...</div>;

  const isOwner = profile?.id === novel.author_id;
  const isAdmin = profile?.role === "admin";

  return (
    <div className="space-y-6">
      <Link
        href="/novels"
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Senarai Folder Novel</span>
      </Link>

      {/* Header Folder Novel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[11px] font-bold inline-flex items-center gap-1">
              <FolderOpen className="w-3 h-3" /> Folder Novel
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-semibold">
              {novel.genre}
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-semibold">
              {novel.status}
            </span>
            {isAdmin && (
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-bold">
                Penulis: {novel.profiles?.full_name}
              </span>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{novel.title}</h1>
          <p className="text-xs text-slate-500 max-w-3xl">{novel.synopsis || "Tiada sinopsis."}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isOwner && (
            <>
              <button
                onClick={() => updateNovelStatus("Dihantar")}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Hantar ke Pentadbir</span>
              </button>
              <button
                onClick={openNewChapter}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Bab</span>
              </button>
            </>
          )}

          {isAdmin && (
            <select
              value={novel.status}
              onChange={(e) => updateNovelStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50"
            >
              <option value="Draf">Status: Draf</option>
              <option value="Dihantar">Status: Dihantar</option>
              <option value="Dalam Semakan">Status: Dalam Semakan</option>
              <option value="Diluluskan / Terbit">Status: Diluluskan / Terbit</option>
            </select>
          )}
        </div>
      </div>

      {/* Senarai Bab Dalam Folder */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700">Senarai Bab ({chapters.length})</h2>
        {chapters.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
            Folder ini masih kosong. Klik butang <strong>Tambah Bab</strong> untuk mula menulis.
          </div>
        ) : (
          chapters.map((ch) => (
            <div key={ch.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold mr-2">
                    Bab {ch.chapter_number}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{ch.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditChapter(ch)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <PenSquare className="w-3.5 h-3.5" />
                    <span>{isAdmin ? "Baca / Komen" : "Sunting"}</span>
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteChapter(ch.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-3 leading-relaxed">
                {ch.content}
              </p>

              {ch.admin_notes && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                  <strong>Catatan Semakan Pentadbir:</strong> {ch.admin_notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Tulis / Sunting Bab */}
      {editorOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {isAdmin ? "Semakan Kandungan Bab" : editingChapterId ? "Sunting Bab" : "Tambah Bab Baharu"}
              </h3>
              <button onClick={() => setEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Bab</label>
                  <input
                    type="number"
                    min={1}
                    required
                    disabled={isAdmin && !isOwner}
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tajuk Bab *</label>
                  <input
                    type="text"
                    required
                    disabled={isAdmin && !isOwner}
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Kandungan Bab *</label>
                <textarea
                  rows={12}
                  required
                  disabled={isAdmin && !isOwner}
                  value={chapterContent}
                  onChange={(e) => setChapterContent(e.target.value)}
                  placeholder="Tulis isi kandungan bab di sini..."
                  className="w-full p-4 border border-slate-200 rounded-xl text-sm leading-relaxed"
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-indigo-700 mb-1">
                    Catatan Semakan Pentadbir untuk Penulis
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Tulis komen pembetulan atau kelulusan penerbitan..."
                    className="w-full p-3 border border-indigo-200 bg-indigo-50/40 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditorOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Menyimpan..." : "Simpan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
