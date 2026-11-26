"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BASE_UNITS, UserProfile } from "@/lib/constants";
import { UserPlus, Trash2 } from "lucide-react";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [specialUnit, setSpecialUnit] = useState("Unit Khas (Pengarah Seni)");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unit, setUnit] = useState("Unit Penulisan");
  const [role, setRole] = useState<"pekerja" | "admin">("pekerja");
  const [isUnitHead, setIsUnitHead] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadUsersAndSettings() {
    const [usersRes, setRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("company_settings").select("value").eq("key", "special_unit_name").single(),
    ]);
    if (usersRes.data) setUsers(usersRes.data as UserProfile[]);
    if (setRes.data) setSpecialUnit(setRes.data.value);
  }

  useEffect(() => {
    loadUsersAndSettings();
  }, []);

  async function handleSaveSpecialUnit() {
    const { data: oldSetting } = await supabase
      .from("company_settings")
      .select("value")
      .eq("key", "special_unit_name")
      .single();

    await supabase
      .from("company_settings")
      .upsert({ key: "special_unit_name", value: specialUnit.trim() });

    if (oldSetting && oldSetting.value !== specialUnit.trim()) {
      await supabase
        .from("profiles")
        .update({ unit: specialUnit.trim() })
        .eq("unit", oldSetting.value);
    }

    alert("Nama Unit Khas berjaya dikemas kini!");
    loadUsersAndSettings();
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        username,
        password,
        unit,
        role,
        is_unit_head: isUnitHead,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      return alert("Ralat: " + data.error);
    }

    setFullName("");
    setUsername("");
    setPassword("");
    setIsUnitHead(false);
    loadUsersAndSettings();
  }

  async function updateUserField(id: string, field: string, value: any) {
    await supabase.from("profiles").update({ [field]: value }).eq("id", id);
    loadUsersAndSettings();
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Padam akaun kakitangan ini secara kekal?")) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) loadUsersAndSettings();
  }

  const allUnits = [...BASE_UNITS, specialUnit, "Pengurusan"];

  return (
    <div className="space-y-6">
      {/* Tetapan Unit Khas Dinamik */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[11px] font-bold">
            Unit Khas Dinamik
          </span>
          <h2 className="text-sm font-bold text-slate-900 mt-1">
            Ubah Nama Unit Khas (Contoh: Pengarah Seni / Unit Ilustrasi)
          </h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={specialUnit}
            onChange={(e) => setSpecialUnit(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold w-60"
          />
          <button
            onClick={handleSaveSpecialUnit}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
          >
            Simpan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-1">Tambah Pekerja Baharu</h3>
          <p className="text-xs text-slate-500 mb-4">Cipta akaun, tetapkan unit dan lantik Ketua Unit.</p>

          <form onSubmit={handleAddUser} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penuh *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID Pengguna (Username) *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="contoh: aisyah_media"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Laluan (Min 6 aksara) *</label>
              <input
                type="text"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
              >
                {allUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peranan</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "pekerja" | "admin")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  <option value="pekerja">Pekerja</option>
                  <option value="admin">Pentadbir</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ketua Unit?</label>
                <select
                  value={isUnitHead ? "true" : "false"}
                  onChange={(e) => setIsUnitHead(e.target.value === "true")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  <option value="false">Ahli Unit</option>
                  <option value="true">Ketua Unit</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? "Mendaftar..." : "Daftar Kakitangan"}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Senarai Kakitangan & Ketua Unit</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">Kakitangan</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Jawatan</th>
                  <th className="py-3 px-4 text-right">Padam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {u.full_name}
                      <span className="block font-mono text-[11px] font-normal text-slate-400">
                        @{u.username} • {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.unit}
                        onChange={(e) => updateUserField(u.id, "unit", e.target.value)}
                        className="px-2 py-1 border border-slate-200 rounded bg-white"
                      >
                        {allUnits.map((un) => (
                          <option key={un} value={un}>{un}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.is_unit_head ? "true" : "false"}
                        onChange={(e) => updateUserField(u.id, "is_unit_head", e.target.value === "true")}
                        className={`px-2 py-1 border rounded ${
                          u.is_unit_head ? "bg-amber-50 border-amber-200 text-amber-800 font-bold" : "border-slate-200 bg-white"
                        }`}
                      >
                        <option value="false">Ahli Unit</option>
                        <option value="true">★ Ketua Unit</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDeleteUser(u.id)} className="text-rose-600 hover:text-rose-800 p-1">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
