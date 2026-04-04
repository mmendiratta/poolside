import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLAYER_BY_ID, CUT_PENALTY, SCORING_PICKS, TOTAL_PICKS, PICKS_FROM_TIER_6 } from "@/lib/golf-data";
import type { GolfLeaderboardEntry, GolfPickDetail } from "@/lib/golf.types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const golfPoolId = searchParams.get("golfPoolId");
  if (!golfPoolId) return NextResponse.json({ error: "golfPoolId required" }, { status: 400 });

  const { data: golfPool } = await supabaseAdmin
    .from("golf_pools")
    .select("*, pools(name, slug, created_by_name, description)")
    .eq("id", golfPoolId)
    .single();
  if (!golfPool) return NextResponse.json({ error: "Golf pool not found" }, { status: 404 });

  const isLocked = new Date() >= new Date(golfPool.deadline);

  const { data: members } = await supabaseAdmin
    .from("members")
    .select("id, name")
    .eq("pool_id", golfPool.pool_id)
    .order("joined_at");

  // Before deadline: return member list only, no picks
  if (!isLocked) {
    return NextResponse.json({
      isLocked: false,
      deadline: golfPool.deadline,
      members: (members ?? []).map(m => ({ member_id: m.id, name: m.name })),
      leaderboard: [],
    });
  }

  // After deadline: full leaderboard with all picks
  const [{ data: allPicks }, { data: tiebreakers }, { data: scores }] = await Promise.all([
    supabaseAdmin.from("golf_picks").select("member_id, player_id").eq("golf_pool_id", golfPoolId),
    supabaseAdmin.from("golf_tiebreaker_picks").select("member_id, winning_score").eq("golf_pool_id", golfPoolId),
    supabaseAdmin.from("golf_scores").select("player_id, score_to_par, position, thru, status"),
  ]);

  const scoreMap = new Map<string, { score_to_par: number | null; position: string | null; thru: string | null; status: string }>();
  for (const s of scores ?? []) scoreMap.set(s.player_id, s);

  const tiebreakerMap = new Map<string, number>();
  for (const t of tiebreakers ?? []) tiebreakerMap.set(t.member_id, t.winning_score);

  const picksByMember = new Map<string, string[]>();
  for (const pick of allPicks ?? []) {
    const arr = picksByMember.get(pick.member_id) ?? [];
    arr.push(pick.player_id);
    picksByMember.set(pick.member_id, arr);
  }

  const entries: GolfLeaderboardEntry[] = [];

  for (const member of members ?? []) {
    const memberPicks = picksByMember.get(member.id) ?? [];

    // Exclude incomplete entries
    const tier6count = memberPicks.filter(id => PLAYER_BY_ID[id]?.tier === 6).length;
    const tier15count = memberPicks.filter(id => (PLAYER_BY_ID[id]?.tier ?? 0) < 6).length;
    if (tier15count !== 5 || tier6count !== PICKS_FROM_TIER_6 || memberPicks.length !== TOTAL_PICKS) continue;

    // Compute effective score per pick (cut/wd = raw + penalty)
    const scored = memberPicks.map(playerId => {
      const scoreRow = scoreMap.get(playerId);
      const raw = scoreRow?.score_to_par ?? 0;
      const isCutOrWd = scoreRow?.status === "cut" || scoreRow?.status === "wd";
      return { playerId, effective: isCutOrWd ? raw + CUT_PENALTY : raw };
    });

    // Best 6 of 8
    const sorted = [...scored].sort((a, b) => a.effective - b.effective);
    const countingIds = new Set(sorted.slice(0, SCORING_PICKS).map(p => p.playerId));
    const total = sorted.slice(0, SCORING_PICKS).reduce((sum, p) => sum + p.effective, 0);

    // Build full pick details (all 8, sorted by tier)
    const detailedPicks: GolfPickDetail[] = memberPicks
      .map(playerId => {
        const player = PLAYER_BY_ID[playerId];
        const scoreRow = scoreMap.get(playerId);
        const raw = scoreRow?.score_to_par ?? null;
        const isCutOrWd = scoreRow?.status === "cut" || scoreRow?.status === "wd";
        const effective = raw !== null ? (isCutOrWd ? raw + CUT_PENALTY : raw) : null;
        return {
          player_id: playerId,
          player_name: player?.name ?? playerId,
          tier: player?.tier ?? 0,
          score_to_par: raw,
          effective_score: effective,
          position: scoreRow?.position ?? null,
          thru: scoreRow?.thru ?? null,
          status: scoreRow?.status ?? "active",
          counts: countingIds.has(playerId),
        };
      })
      .sort((a, b) => a.tier - b.tier);

    entries.push({
      member_id: member.id,
      name: member.name,
      total_score: total,
      rank: "",
      picks: detailedPicks,
      tiebreaker_score: tiebreakerMap.get(member.id) ?? null,
      counting_picks: Array.from(countingIds),
    });
  }

  // Sort ascending, assign ranks with T-prefix for ties
  entries.sort((a, b) => a.total_score - b.total_score);
  for (let i = 0; i < entries.length; i++) {
    const rankNum = i === 0 ? 1 : entries[i].total_score === entries[i - 1].total_score
      ? parseInt(entries[i - 1].rank.replace("T", ""))
      : i + 1;
    const isTied = entries.filter(e => e.total_score === entries[i].total_score).length > 1;
    entries[i].rank = isTied ? `T${rankNum}` : `${rankNum}`;
  }

  return NextResponse.json({
    isLocked: true,
    deadline: golfPool.deadline,
    members: (members ?? []).map(m => ({ member_id: m.id, name: m.name })),
    leaderboard: entries,
  });
}
