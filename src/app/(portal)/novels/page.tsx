"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/lib/constants";
import { Folder, FolderPlus, BookOpen, UserPen, X } from "lucide-react";

type NovelRow = {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  author_id: string;
  status: string;
  profiles?: { full_name: string };
  chapters?: { id: string }[];
};

export default function NovelsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [novels, setNovels] = useState<NovelRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Romantik / Drama");
  const [synopsis, setSynopsis] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchNovels() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(prof as UserProfile);

    // Polisi RLS Supabase memastikan pekerja HANYA menerima novel miliknya sendiri,
    // manakala Admin menerima semua novel berserta nama penulis (profiles.full_name).
    const { data } = await supabase
      .from("novels")
      .select("*, profiles(full_name), chapters(id)")
      .order("created_at", { ascending: false });

    if (data) setNovels(data as NovelRow[]);
  }

  useEffect(() => {
    fetchNovels();
  }, []);

  async function handleCreateNovel(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    await supabase.from("novels").insert({
      title: title.trim(),
      genre,
      synopsis: synopsis.trim(),
      author_id: profile.id,
      status: "Draf",
    });

    setTitle("");
    setSynopsis("");
    setModalOpen(false);
    setSaving(false);
    fetchNovels();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">
            {profile?.role === "admin" ? "Semua Folder Novel Kakitangan" : "Folder Penulisan Novel Saya"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {profile?.role === "admin"
              ? "Pentadbir boleh melihat semua folder novel beserta nama penulis dan menyemak setiap bab."
              : "Klik folder tajuk novel untuk menambah bab baharu atau menyunting bab sedia ada."}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Tambah Tajuk Novel</span>
        </button>
      </div>

      {novels.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
          Tiada folder tajuk novel ditemui. Klik <strong>Tambah Tajuk Novel</strong> untuk mencipta folder baharu.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {novels.map((n) => (
            <Link
              key={n.id}
              href={`/novels/${n.id}`}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <Folder className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {n.status}
                  </span>
                </div>

                {profile?.role === "admin" && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-bold">
                    <UserPen className="w-3 h-3" />
                    <span>Penulis: {n.profiles?.full_name || "Tidak diketahui"}</span>
                  </div>
                )}

                <h2 className="font-bold text-slate-900 text-base mt-2.5 line-clamp-1">{n.title}</h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.synopsis || "Tiada sinopsis."}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  {n.chapters?.length || 0} Bab • {n.genre}
                </span>
                <span className="text-indigo-600 font-semibold">Buka Folder →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Tambah Tajuk Novel */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Cipta Folder Tajuk Novel Baharu</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateNovel} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tajuk Novel *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan tajuk novel..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  <option>Romantik / Drama</option>
                  <option>Misteri / Thriller</option>
                  <option>Fantasi / Fiksyen Sains</option>
                  <option>Islamik / Kerohanian</option>
                  <option>Aksi / Pengembaraan</option>
                  <option>Umum</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sinopsis Ringkas</label>
                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Ringkasan jalan cerita..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
                >
                  {saving ? "Menyimpan..." : "Simpan Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
