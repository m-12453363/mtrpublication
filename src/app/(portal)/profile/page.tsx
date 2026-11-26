"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/lib/constants";
import { Camera } from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data as UserProfile);
      setFullName(data.full_name);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    let avatar_url = profile.avatar_url;
    if (file) {
      const path = `avatars/${profile.id}_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("mtr-storage").upload(path, file);
      if (!error) {
        const { data: pub } = supabase.storage.from("mtr-storage").getPublicUrl(path);
        avatar_url = pub.publicUrl;
      }
    }

    await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), avatar_url })
      .eq("id", profile.id);

    setFile(null);
    setSaving(false);
    alert("Profil dan gambar profil berjaya dikemas kini!");
    loadProfile();
  }

  if (!profile) return <div className="text-xs text-slate-500">Memuatkan profil...</div>;

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
      <div className="flex items-center gap-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xl flex items-center justify-center">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-base font-extrabold text-slate-900">{profile.full_name}</h1>
          <p className="text-xs text-indigo-600 font-semibold">
            {profile.unit} {profile.is_unit_head ? "• ★ Ketua Unit" : ""}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 pt-3 border-t border-slate-100">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Paparan</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tukar Gambar Profil (JPG/PNG)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan Profil"}
        </button>
      </form>
    </div>
  );
}
