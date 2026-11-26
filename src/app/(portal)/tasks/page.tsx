"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BASE_UNITS, UserProfile } from "@/lib/constants";

export default function TasksPage() {
  const supabase = createClient();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [specialUnit, setSpecialUnit] = useState("Unit Khas (Pengarah Seni)");

  const [title, setTitle] = useState("");
  const [targetUnit, setTargetUnit] = useState("Unit Penulisan");
  const [assignedTo, setAssignedTo] = useState("ALL_UNIT");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  async function loadTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [myRes, usersRes, setRes, tasksRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("company_settings").select("value").eq("key", "special_unit_name").single(),
      supabase.from("tasks").select("*, profiles(full_name)").order("created_at", { ascending: false }),
    ]);

    if (myRes.data) setMe(myRes.data as UserProfile);
    if (usersRes.data) setUsers(usersRes.data as UserProfile[]);
    if (setRes.data) setSpecialUnit(setRes.data.value);
    if (tasksRes.data) setTasks(tasksRes.data);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("tasks").insert({
      title: title.trim(),
      description: description.trim(),
      target_unit: targetUnit,
      assigned_to: assignedTo === "ALL_UNIT" ? null : assignedTo,
      deadline: deadline || null,
    });
    setTitle("");
    setDescription("");
    setDeadline("");
    loadTasks();
  }

  async function markDone(id: string) {
    await supabase.from("tasks").update({ status: "Selesai" }).eq("id", id);
    loadTasks();
  }

  const allUnits = [...BASE_UNITS, specialUnit, "Pengurusan", "Semua Unit"];
  const unitWorkers = users.filter((u) => u.unit === targetUnit);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {me?.role === "admin" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 h-fit">
          <h2 className="text-base font-bold text-slate-900 mb-1">Agih Tugasan Baharu</h2>
          <p className="text-xs text-slate-500 mb-4">Tetapkan tugasan kepada unit, ketua unit, atau individu.</p>

          <form onSubmit={handleCreateTask} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tajuk Tugasan *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Sasaran</label>
              <select
                value={targetUnit}
                onChange={(e) => {
                  setTargetUnit(e.target.value);
                  setAssignedTo("ALL_UNIT");
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
              >
                {allUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kakitangan Khusus</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
              >
                <option value="ALL_UNIT">Semua Ahli Unit Ini</option>
                {unitWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name} {w.is_unit_head ? "(Ketua Unit)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tarikh Akhir</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Arahan Tugasan *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Agih Tugasan
            </button>
          </form>
        </div>
      )}

      <div className={`${me?.role === "admin" ? "lg:col-span-2" : "lg:col-span-3"} space-y-3`}>
        <h2 className="text-lg font-extrabold text-slate-900">Senarai Tugasan</h2>
        {tasks.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            Tiada tugasan buat masa ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-semibold">
                      {t.profiles?.full_name ? `${t.profiles.full_name} (${t.target_unit})` : t.target_unit}
                    </span>
                    <span className="text-[11px] text-slate-400">Tarikh Akhir: {t.deadline || "-"}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{t.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-xs font-bold ${t.status === "Selesai" ? "text-emerald-600" : "text-amber-600"}`}>
                    {t.status}
                  </span>
                  {t.status !== "Selesai" && (
                    <button
                      onClick={() => markDone(t.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Tanda Selesai
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
