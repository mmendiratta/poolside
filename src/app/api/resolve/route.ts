import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { poolId, eventId, managerToken, resolvedOptionId, resolvedNumericValue } = await req.json();
    if (!poolId || !eventId || !managerToken) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    const { data: event } = await supabaseAdmin.from("events").select("id,manager_token").eq("id", eventId).eq("manager_token", managerToken).single();
    if (!event) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { error } = await supabaseAdmin.from("pools").update({ resolved_option_id: resolvedOptionId??null, resolved_numeric_value: resolvedNumericValue??null, resolved_at: new Date().toISOString() }).eq("id", poolId).eq("event_id", eventId);
    if (error) { console.error(error); return NextResponse.json({ error: "Failed to resolve pool" }, { status: 500 }); }
    return NextResponse.json({ success: true });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
