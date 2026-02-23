import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { poolId, name } = await req.json();
    if (!poolId || !name?.trim()) return NextResponse.json({ error: "poolId and name required" }, { status: 400 });
    const { data: pool } = await supabaseAdmin.from("pools").select("id").eq("id", poolId).single();
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    const { data: member, error } = await supabaseAdmin.from("members").upsert({ pool_id: poolId, name: name.trim() }, { onConflict: "pool_id,name", ignoreDuplicates: false }).select().single();
    if (error || !member) { console.error(error); return NextResponse.json({ error: "Failed to join pool" }, { status: 500 }); }
    return NextResponse.json({ memberId: member.id, sessionToken: member.session_token, name: member.name });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
