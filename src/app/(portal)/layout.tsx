"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COMPANY_NAME, UserProfile } from "@/lib/constants";
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  CheckSquare,
  Video,
  Music,
  Users,
  UserCircle,
  LogOut,
  Feather,
  Menu,
  X,
} from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data as UserProfile);
    }
    loadProfile();
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/dashboard", label: "Papan Pemuka", icon: LayoutDashboard },
    { href: "/novels", label: "Penulisan (Novel)", icon: FolderOpen },
    { href: "/chat", label: "Sembang & DeskHelp", icon: MessageSquare },
    { href: "/tasks", label: "Tugasan Unit", icon: CheckSquare },
    { href: "/media/video", label: "Karya Video (YouTube)", icon: Video },
    { href: "/media/audio", label: "Karya Lagu (YouTube)", icon: Music },
    ...(profile?.role === "admin"
      ? [{ href: "/admin/users", label: "Pekerja & Unit Khas", icon: Users }]
      : []),
    { href: "/profile", label: "Profil & Gambar", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-950 text-white flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Feather className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold tracking-tight leading-snug">
              {COMPANY_NAME}
            </div>
            <div className="text-[11px] text-indigo-400 font-medium truncate">
              {profile?.role === "admin" ? "Panel Pentadbir" : profile?.unit}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Kad Profil Bawah Sidebar */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <Link href="/profile" className="flex items-center gap-3 group">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-9 h-9 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                {(profile?.full_name || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold truncate group-hover:text-indigo-400">
                {profile?.full_name || "Memuatkan..."}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {profile?.is_unit_head ? `★ Ketua ${profile.unit}` : profile?.unit}
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Mobile */}
        <header className="lg:hidden bg-slate-950 text-white px-4 h-14 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <Feather className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-extrabold truncate">{COMPANY_NAME}</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden bg-slate-900 text-white p-3 space-y-1 border-b border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Keluar</span>
            </button>
          </div>
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
