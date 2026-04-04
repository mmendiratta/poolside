import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLAYER_BY_ID, DEADLINE, PICKS_FROM_TIER_6, PICKS_PER_TIER_1_5 } from "@/lib/golf-data";

// POST — submit or update picks for a member
// Body: { memberId, sessionToken, golfPoolId, picks: string[], tiebreakerScore: number }
// picks = array of player_ids (5 from tiers 1-5, 3 from tier 6)
export async function POST(req: NextRequest) {
  try {
    const { memberId, sessionToken, golfPoolId, picks, tiebreakerScore } = await req.json();
    if (!memberId || !sessionToken || !golfPoolId || !Array.isArray(picks))
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    // Validate session
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("id, session_token")
      .eq("id", memberId)
      .eq("session_token", sessionToken)
      .single();
    if (!member) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    // Deadline check
    if (new Date() >= new Date(DEADLINE))
      return NextResponse.json({ error: "Picks are locked" }, { status: 400 });

    // Validate picks — resolve each to a player
    const resolved = picks.map((id: string) => PLAYER_BY_ID[id]).filter(Boolean);
    if (resolved.length !== picks.length)
      return NextResponse.json({ error: "Unknown player id" }, { status: 400 });

    // Enforce tier constraints
    const tier6picks = resolved.filter(p => p.tier === 6);
    const tier15picks = resolved.filter(p => p.tier !== 6);
    if (tier6picks.length > PICKS_FROM_TIER_6)
      return NextResponse.json({ error: `Max ${PICKS_FROM_TIER_6} picks from Tier 6` }, { status: 400 });

    const tiersUsed = tier15picks.map(p => p.tier);
    const uniqueTiers = new Set(tiersUsed);
    if (tiersUsed.length !== uniqueTiers.size)
      return NextResponse.json({ error: "Only one pick allowed per tier (1-5)" }, { status: 400 });

    const invalidTiers = tier15picks.filter(p => p.tier > 5);
    if (invalidTiers.length > 0)
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

    // Check for duplicates
    if (new Set(picks).size !== picks.length)
      return NextResponse.json({ error: "Duplicate player picks" }, { status: 400 });

    // Upsert picks — delete existing and reinsert for simplicity
    await supabaseAdmin.from("golf_picks").delete().eq("member_id", memberId).eq("golf_pool_id", golfPoolId);
    if (picks.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("golf_picks").insert(
        picks.map((playerId: string) => ({ member_id: memberId, golf_pool_id: golfPoolId, player_id: playerId }))
      );
      if (insertError) {
        console.error(insertError);
        return NextResponse.json({ error: "Failed to save picks" }, { status: 500 });
      }
    }

    // Upsert tiebreaker if provided
    if (tiebreakerScore !== undefined && tiebreakerScore !== null) {
      const score = parseInt(tiebreakerScore, 10);
      if (!isNaN(score)) {
        await supabaseAdmin.from("golf_tiebreaker_picks").upsert(
          { member_id: memberId, golf_pool_id: golfPoolId, winning_score: score },
          { onConflict: "member_id,golf_pool_id" }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — fetch picks for a member (before deadline, only their own)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const golfPoolId = searchParams.get("golfPoolId");
  if (!memberId || !golfPoolId)
    return NextResponse.json({ error: "memberId and golfPoolId required" }, { status: 400 });

  const { data: picks } = await supabaseAdmin
    .from("golf_picks")
    .select("player_id")
    .eq("member_id", memberId)
    .eq("golf_pool_id", golfPoolId);

  const { data: tiebreaker } = await supabaseAdmin
    .from("golf_tiebreaker_picks")
    .select("winning_score")
    .eq("member_id", memberId)
    .eq("golf_pool_id", golfPoolId)
    .single();

  return NextResponse.json({
    picks: (picks ?? []).map(p => p.player_id),
    tiebreakerScore: tiebreaker?.winning_score ?? null,
  });
}
