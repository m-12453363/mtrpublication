"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { COMPANY_NAME, UserProfile } from "@/lib/constants";
import { Youtube, UploadCloud, ExternalLink } from "lucide-react";

export default function MediaUploadManager({ mediaType }: { mediaType: "Video" | "Lagu" }) {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadMedia() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(prof as UserProfile);

    const { data } = await supabase
      .from("media_submissions")
      .select("*, profiles(full_name)")
      .eq("media_type", mediaType)
      .order("created_at", { ascending: false });

    if (data) setItems(data);
  }

  useEffect(() => {
    loadMedia();
  }, [mediaType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (!file && !externalUrl.trim()) {
      return alert("Sila pilih fail atau masukkan pautan Google Drive.");
    }

    setUploading(true);
    let finalUrl = externalUrl.trim();
    let fileName = "Pautan Luaran";

    if (file) {
      const path = `${mediaType.toLowerCase()}/${profile.id}_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("mtr-storage").upload(path, file);
      if (error) {
        alert("Ralat muat naik fail: " + error.message);
        setUploading(false);
        return;
      }
      const { data: pub } = supabase.storage.from("mtr-storage").getPublicUrl(path);
      finalUrl = pub.publicUrl;
      fileName = file.name;
    }

    await supabase.from("media_submissions").insert({
      media_type: mediaType,
      title: title.trim(),
      description: description.trim(),
      file_url: finalUrl,
      file_name: fileName,
      author_id: profile.id,
      unit: profile.unit,
    });

    setTitle("");
    setDescription("");
    setExternalUrl("");
    setFile(null);
    setUploading(false);
    loadMedia();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("media_submissions").update({ status }).eq("id", id);
    loadMedia();
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
        <Youtube className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-xs text-rose-900 leading-relaxed">
          <strong className="block text-sm font-bold text-rose-800">
            Makluman Penerbitan YouTube Rasmi {COMPANY_NAME}:
          </strong>
          Semua karya {mediaType.toLowerCase()} yang dihantar dan diluluskan oleh Pentadbir akan diterbitkan (<em>publish</em>) secara rasmi di saluran <strong>YouTube rasmi {COMPANY_NAME}</strong>.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 h-fit">
          <h2 className="text-base font-bold text-slate-900 mb-1">Hantar Karya {mediaType}</h2>
          <p className="text-xs text-slate-500 mb-4">Muat naik terus (maks 50MB) atau tampal pautan Drive.</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tajuk {mediaType} *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fail {mediaType} ({mediaType === "Video" ? "MP4/MOV" : "MP3/WAV"})
              </label>
              <input
                type="file"
                accept={mediaType === "Video" ? "video/*" : "audio/*"}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Atau Pautan Google Drive</label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan & Kredit Produksi</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? "Memuat naik..." : `Hantar ${mediaType} ke Pentadbir`}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-base font-bold text-slate-900">Senarai Penghantaran {mediaType}</h3>
          {items.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              Belum ada rekod {mediaType.toLowerCase()}.
            </div>
          ) : (
            items.map((m) => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-sm">{m.title}</h4>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[11px] font-semibold">
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{m.description || "-"}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Oleh: {m.profiles?.full_name} ({m.unit})
                  </span>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <a
                    href={m.file_url}
                    target="_blank"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {profile?.role === "admin" && (
                    <select
                      value={m.status}
                      onChange={(e) => updateStatus(m.id, e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded text-[11px]"
                    >
                      <option value="Dihantar (Menunggu Terbitan YouTube MTR)">Menunggu Terbitan</option>
                      <option value="Diluluskan untuk YouTube MTR">Diluluskan</option>
                      <option value="Telah Dipublish di YouTube MTR">Dipublish di YouTube MTR</option>
                    </select>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
