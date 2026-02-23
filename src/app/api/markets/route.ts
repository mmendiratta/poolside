import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { poolId, managerToken, markets } = await req.json();
    if (!poolId || !managerToken) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    const { data: pool } = await supabaseAdmin.from("pools").select("id,manager_token").eq("id", poolId).eq("manager_token", managerToken).single();
    if (!pool) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const validMarkets = (markets ?? []).filter((m: { question?: string }) => m.question?.trim());
    if (!validMarkets.length) return NextResponse.json({ error: "Add at least one market" }, { status: 400 });
    for (const market of validMarkets) {
      const { data: createdMarket, error: marketError } = await supabaseAdmin.from("markets").insert({ pool_id: poolId, question: market.question.trim(), type: market.type, closes_at: market.closesAt || null, points_value: market.pointsValue ?? 100 }).select().single();
      if (marketError || !createdMarket) { console.error(marketError); continue; }
      if (market.type !== "numeric" && market.options?.length > 0) {
        const optionRows = market.options.filter((o: string) => o.trim()).map((label: string, i: number) => ({ market_id: createdMarket.id, label: label.trim(), display_order: i }));
        if (optionRows.length > 0) await supabaseAdmin.from("options").insert(optionRows);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
