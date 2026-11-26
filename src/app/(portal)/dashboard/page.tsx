"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COMPANY_NAME, UserProfile } from "@/lib/constants";
import { FolderOpen, Video, Music, CheckSquare, MessageSquare, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ novels: 0, media: 0, tasks: 0, deskhelp: 0 });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof as UserProfile);

      const [novelsRes, mediaRes, tasksRes, msgRes] = await Promise.all([
        supabase.from("novels").select("id", { count: "exact", head: true }),
        supabase.from("media_submissions").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "Belum Selesai"),
        supabase.from("messages").select("recipient_id").eq("channel_type", "DESKHELP"),
      ]);

      const uniqueTickets = new Set((msgRes.data || []).map((m) => m.recipient_id));

      setStats({
        novels: novelsRes.count || 0,
        media: mediaRes.count || 0,
        tasks: tasksRes.count || 0,
        deskhelp: uniqueTickets.size,
      });
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
          {COMPANY_NAME}
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold mt-1">
          Selamat Datang, {profile?.full_name || "Kakitangan MTR"}
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          {profile?.role === "admin"
            ? "Anda mempunyai akses pemantauan penuh terhadap karya penerbitan, tugasan unit, dan semua saluran komunikasi."
            : `Unit Bertugas: ${profile?.unit || "-"} ${profile?.is_unit_head ? "(Ketua Unit)" : ""}`}
        </p>
      </div>

      {/* Kad Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Folder Novel</span>
            <FolderOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.novels}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Karya YouTube MTR</span>
            <Video className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.media}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tugasan Aktif</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.tasks}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tiket DeskHelp</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.deskhelp}</div>
        </div>
      </div>

      {/* Pintasan Pantas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/novels" className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 transition group">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">Ruang Penulisan & Folder Novel</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Cipta folder tajuk novel, tulis bab baharu, sunting dan hantar kepada Pentadbir.</p>
        </Link>

        <Link href="/chat" className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 transition group">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">Sembang Masa Nyata & DeskHelp</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Group Utama, Group Unit, DM antara kakitangan/Pentadbir dan tiket bantuan DeskHelp.</p>
        </Link>

        <Link href="/media/video" className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 transition group">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">Terbitan YouTube Rasmi MTR</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Muat naik fail video & muzik untuk diterbitkan di saluran YouTube rasmi {COMPANY_NAME}.</p>
        </Link>
      </div>
    </div>
  );
}
