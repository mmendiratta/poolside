import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { memberId, sessionToken, marketId, optionId, numericValue } = await req.json();
    if (!memberId || !sessionToken || !marketId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    const { data: member } = await supabaseAdmin.from("members").select("id,session_token").eq("id", memberId).eq("session_token", sessionToken).single();
    if (!member) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    const { data: market } = await supabaseAdmin.from("markets").select("id,closes_at").eq("id", marketId).single();
    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
    if (market.closes_at && new Date(market.closes_at) < new Date()) return NextResponse.json({ error: "Market is closed" }, { status: 400 });
    const { error } = await supabaseAdmin.from("picks").upsert({ member_id: memberId, market_id: marketId, option_id: optionId ?? null, numeric_value: numericValue ?? null }, { onConflict: "member_id,market_id" });
    if (error) { console.error(error); return NextResponse.json({ error: "Failed to save pick" }, { status: 500 }); }
    return NextResponse.json({ success: true });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
