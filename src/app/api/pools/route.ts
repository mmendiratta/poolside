import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateSlug } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { name, description, createdByName } = await req.json();
    if (!name?.trim() || !createdByName?.trim()) return NextResponse.json({ error: "name and createdByName required" }, { status: 400 });
    const slug = generateSlug(name);
    const { data: pool, error } = await supabaseAdmin.from("pools").insert({ slug, name: name.trim(), description: description?.trim()||null, created_by_name: createdByName.trim() }).select().single();
    if (error || !pool) { console.error(error); return NextResponse.json({ error: "Failed to create pool" }, { status: 500 }); }
    return NextResponse.json({ slug: pool.slug, poolId: pool.id, managerToken: pool.manager_token, inviteCode: pool.invite_code });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
