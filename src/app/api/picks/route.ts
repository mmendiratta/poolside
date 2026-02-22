import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { participantId, sessionToken, poolId, optionId, numericValue } = await req.json();
    if (!participantId || !sessionToken || !poolId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    const { data: participant } = await supabaseAdmin.from("participants").select("id,session_token").eq("id", participantId).eq("session_token", sessionToken).single();
    if (!participant) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    const { data: pool } = await supabaseAdmin.from("pools").select("id,closes_at,type").eq("id", poolId).single();
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    if (pool.closes_at && new Date(pool.closes_at) < new Date()) return NextResponse.json({ error: "This pool is closed for picks" }, { status: 400 });
    const { error } = await supabaseAdmin.from("picks").upsert({ participant_id: participantId, pool_id: poolId, option_id: optionId??null, numeric_value: numericValue??null }, { onConflict: "participant_id,pool_id" });
    if (error) { console.error(error); return NextResponse.json({ error: "Failed to save pick" }, { status: 500 }); }
    return NextResponse.json({ success: true });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
