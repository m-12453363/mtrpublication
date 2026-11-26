import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Akses Pentadbir diperlukan" }, { status: 403 });
  }

  const body = await request.json();
  const adminClient = createAdminSupabase();

  const usernameClean = String(body.username).trim().toLowerCase();
  const email = usernameClean.includes("@") ? usernameClean : `${usernameClean}@mtr.com`;

  const { data: created, error } = await adminClient.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      username: usernameClean.split("@")[0],
      full_name: body.full_name,
      role: body.role || "pekerja",
      unit: body.unit || "Unit Penulisan",
      is_unit_head: Boolean(body.is_unit_head),
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: created.user });
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Akses Pentadbir diperlukan" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("id");
  if (!targetId || targetId === user.id) {
    return NextResponse.json({ error: "ID tidak sah atau tidak boleh padam akaun sendiri" }, { status: 400 });
  }

  const adminClient = createAdminSupabase();
  const { error } = await adminClient.auth.admin.deleteUser(targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
