"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BASE_UNITS, UserProfile } from "@/lib/constants";
import { Megaphone, Users, Headset, Eye, Send, CheckCheck, MessageSquarePlus } from "lucide-react";

type ChatChannel = {
  type: "MAIN_GROUP" | "UNIT_GROUP" | "DM" | "DESKHELP" | "AUDIT_ALL_DM";
  targetId: string;
  title: string;
  subtitle: string;
};

export default function ChatHubPage() {
  const supabase = createClient();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [specialUnit, setSpecialUnit] = useState("Unit Khas (Pengarah Seni)");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  const [activeChat, setActiveChat] = useState<ChatChannel>({
    type: "MAIN_GROUP",
    targetId: "SEMUA",
    title: "Group Utama — Pengumuman Syarikat",
    subtitle: "Maklumat rasmi untuk semua warga MTR PUBLICATION AND PRODUCTION",
  });

  async function initChat() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [myRes, usersRes, settingRes, msgRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("profiles").select("*").order("full_name", { ascending: true }),
      supabase.from("company_settings").select("value").eq("key", "special_unit_name").single(),
      supabase.from("messages").select("*").order("created_at", { ascending: true }),
    ]);

    if (myRes.data) setMe(myRes.data as UserProfile);
    if (usersRes.data) setUsers(usersRes.data as UserProfile[]);
    if (settingRes.data) setSpecialUnit(settingRes.data.value);
    if (msgRes.data) setMessages(msgRes.data);
  }

  useEffect(() => {
    initChat();

    // Langganan masa nyata Supabase Realtime (WebSockets)
    const channel = supabase
      .channel("mtr-realtime-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.new.id ? payload.new : m))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !text.trim() || activeChat.type === "AUDIT_ALL_DM") return;

    const content = text.trim();
    setText("");

    let recipient_id: string | null = null;
    let target_unit = "";
    let ticket_status = "";

    if (activeChat.type === "MAIN_GROUP") {
      target_unit = "SEMUA";
    } else if (activeChat.type === "UNIT_GROUP") {
      target_unit = activeChat.targetId;
    } else if (activeChat.type === "DM") {
      // Kedua-dua Admin dan Pekerja boleh menghantar DM terus kepada activeChat.targetId
      recipient_id = activeChat.targetId;
    } else if (activeChat.type === "DESKHELP") {
      recipient_id = me.role === "admin" ? activeChat.targetId : me.id;
      target_unit = "DESKHELP_ADMIN";
      ticket_status = me.role === "admin" ? "Dijawab Pentadbir" : "Aduan / Persoalan Baharu";
    }

    await supabase.from("messages").insert({
      channel_type: activeChat.type,
      sender_id: me.id,
      recipient_id,
      target_unit,
      content,
      ticket_status,
    });
  }

  async function resolveDeskHelp() {
    if (activeChat.type !== "DESKHELP") return;
    await supabase
      .from("messages")
      .update({ ticket_status: "Selesai Dijawab" })
      .eq("channel_type", "DESKHELP")
      .eq("recipient_id", activeChat.targetId);
  }

  if (!me) return <div className="text-xs text-slate-500">Menyambung ke pelayan komunikasi masa nyata...</div>;

  const isAdmin = me.role === "admin";
  const otherUsers = users.filter((u) => u.id !== me.id);
  const allUnits = [...BASE_UNITS, specialUnit, "Pengurusan"];

  const filteredMessages = messages.filter((m) => {
    if (activeChat.type === "MAIN_GROUP") return m.channel_type === "MAIN_GROUP";
    if (activeChat.type === "UNIT_GROUP")
      return m.channel_type === "UNIT_GROUP" && m.target_unit === activeChat.targetId;
    if (activeChat.type === "DM")
      return (
        m.channel_type === "DM" &&
        ((m.sender_id === me.id && m.recipient_id === activeChat.targetId) ||
          (m.sender_id === activeChat.targetId && m.recipient_id === me.id))
      );
    if (activeChat.type === "DESKHELP")
      return m.channel_type === "DESKHELP" && m.recipient_id === activeChat.targetId;
    if (activeChat.type === "AUDIT_ALL_DM") return m.channel_type === "DM";
    return false;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-7rem)] min-h-[580px]">
      {/* Sidebar Saluran */}
      <div className="md:col-span-4 lg:col-span-3 border-r border-slate-200 bg-slate-50 p-3 space-y-4 overflow-y-auto">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
            Saluran Rasmi
          </div>
          <div className="space-y-1">
            <button
              onClick={() =>
                setActiveChat({
                  type: "MAIN_GROUP",
                  targetId: "SEMUA",
                  title: "Group Utama — Pengumuman Syarikat",
                  subtitle: "Maklumat rasmi & pengumuman warga MTR PUBLICATION AND PRODUCTION",
                })
              }
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeChat.type === "MAIN_GROUP" ? "bg-indigo-600 text-white" : "hover:bg-white text-slate-700"
              }`}
            >
              <Megaphone className="w-4 h-4 shrink-0" />
              <span className="truncate">Group Utama (Pengumuman)</span>
            </button>

            {!isAdmin && (
              <>
                <button
                  onClick={() =>
                    setActiveChat({
                      type: "UNIT_GROUP",
                      targetId: me.unit,
                      title: `Group ${me.unit}`,
                      subtitle: `Bilik sembang rasmi ahli & Ketua Unit ${me.unit}`,
                    })
                  }
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    activeChat.type === "UNIT_GROUP" ? "bg-indigo-600 text-white" : "hover:bg-white text-slate-700"
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">Group {me.unit}</span>
                </button>

                <button
                  onClick={() =>
                    setActiveChat({
                      type: "DESKHELP",
                      targetId: me.id,
                      title: "DeskHelp — Aduan & Persoalan",
                      subtitle: "Tiket aduan & pertanyaan terus ke Pentadbir",
                    })
                  }
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    activeChat.type === "DESKHELP"
                      ? "bg-amber-500 text-white"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-800"
                  }`}
                >
                  <Headset className="w-4 h-4 shrink-0" />
                  <span className="truncate">DeskHelp (Ke Pentadbir)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mula DM Baharu (Dropdown pantas untuk Admin & Pekerja) */}
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1">
            <MessageSquarePlus className="w-3 h-3" />
            <span>Mesej Peribadi (DM Terus)</span>
          </div>
          {otherUsers.length === 0 ? (
            <p className="px-2 text-[11px] text-slate-400">
              Tiada pengguna lain didaftarkan lagi.
            </p>
          ) : (
            <div className="space-y-1">
              {otherUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() =>
                    setActiveChat({
                      type: "DM",
                      targetId: u.id,
                      title: `DM: ${u.full_name}`,
                      subtitle: `${u.unit} • ${u.role === "admin" ? "Pentadbir" : u.is_unit_head ? "Ketua Unit" : "Pekerja"}`,
                    })
                  }
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 ${
                    activeChat.type === "DM" && activeChat.targetId === u.id
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-white text-slate-700"
                  }`}
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{u.full_name}</div>
                    <div
                      className={`text-[10px] truncate ${
                        activeChat.type === "DM" && activeChat.targetId === u.id
                          ? "text-indigo-100"
                          : "text-slate-400"
                      }`}
                    >
                      {u.unit}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kawalan Pemantauan Pentadbir */}
        {isAdmin && (
          <>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 px-2 mb-1.5">
                Peti Aduan DeskHelp Pekerja
              </div>
              <div className="space-y-1">
                {otherUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() =>
                      setActiveChat({
                        type: "DESKHELP",
                        targetId: u.id,
                        title: `DeskHelp: ${u.full_name}`,
                        subtitle: `Aduan & persoalan daripada ${u.full_name} (${u.unit})`,
                      })
                    }
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium truncate ${
                      activeChat.type === "DESKHELP" && activeChat.targetId === u.id
                        ? "bg-amber-600 text-white"
                        : "hover:bg-white text-slate-700"
                    }`}
                  >
                    Tiket: {u.full_name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Semua Group Unit (Pantauan)
              </div>
              <div className="space-y-1">
                {allUnits.map((unitName) => (
                  <button
                    key={unitName}
                    onClick={() =>
                      setActiveChat({
                        type: "UNIT_GROUP",
                        targetId: unitName,
                        title: `Group ${unitName}`,
                        subtitle: `Pemantauan perbualan ${unitName}`,
                      })
                    }
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs truncate ${
                      activeChat.type === "UNIT_GROUP" && activeChat.targetId === unitName
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-white text-slate-700"
                    }`}
                  >
                    # {unitName}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() =>
                  setActiveChat({
                    type: "AUDIT_ALL_DM",
                    targetId: "ALL",
                    title: "Audit Semua Chat Peribadi (Mod Bacaan)",
                    subtitle: "Paparan keseluruhan DM antara kakitangan (Pilih nama pekerja di atas untuk menghantar DM)",
                  })
                }
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  activeChat.type === "AUDIT_ALL_DM"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200/70 hover:bg-slate-200 text-slate-800"
                }`}
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span className="truncate">Pantau Semua DM Pekerja</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Ruang Mesej Utama */}
      <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-white">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-sm truncate">{activeChat.title}</h2>
            <p className="text-[11px] text-slate-500 truncate">{activeChat.subtitle}</p>
          </div>
          {isAdmin && activeChat.type === "DESKHELP" && (
            <button
              onClick={resolveDeskHelp}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandakan Selesai</span>
            </button>
          )}
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/60">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Belum ada mesej dalam saluran ini. Taip mesej di bawah untuk memulakan perbualan.
            </div>
          ) : (
            filteredMessages.map((m) => {
              const sender = users.find((u) => u.id === m.sender_id);
              const recipient = users.find((u) => u.id === m.recipient_id);
              const isMine = m.sender_id === me.id;
              return (
                <div key={m.id} className={`flex items-start gap-2.5 ${isMine ? "flex-row-reverse" : ""}`}>
                  {sender?.avatar_url ? (
                    <img src={sender.avatar_url} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {(sender?.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-800">
                        {sender?.full_name || "Pengguna"}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded">
                        {sender?.unit}
                        {activeChat.type === "AUDIT_ALL_DM" && recipient
                          ? ` ➔ ${recipient.full_name}`
                          : ""}
                      </span>
                      {sender?.is_unit_head && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">
                          Ketua Unit
                        </span>
                      )}
                      {m.ticket_status && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded font-semibold">
                          {m.ticket_status}
                        </span>
                      )}
                    </div>

                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMine
                          ? "bg-indigo-600 text-white rounded-tr-xs"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={feedEndRef} />
        </div>

        {activeChat.type !== "AUDIT_ALL_DM" && (
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 bg-white flex gap-2.5">
            <input
              type="text"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Hantar mesej ke ${activeChat.title}...`}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <span>Hantar</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
