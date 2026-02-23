import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { marketId, poolId, managerToken, resolvedOptionId, resolvedNumericValue } = await req.json();
    if (!marketId || !poolId || !managerToken) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    const { data: pool } = await supabaseAdmin.from("pools").select("id,manager_token").eq("id", poolId).eq("manager_token", managerToken).single();
    if (!pool) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { error } = await supabaseAdmin.from("markets").update({ resolved_option_id: resolvedOptionId??null, resolved_numeric_value: resolvedNumericValue??null, resolved_at: new Date().toISOString() }).eq("id", marketId);
    if (error) { console.error(error); return NextResponse.json({ error: "Failed to resolve market" }, { status: 500 }); }
    return NextResponse.json({ success: true });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
