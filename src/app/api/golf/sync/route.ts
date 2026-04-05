import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GOLF_PLAYERS } from "@/lib/golf-data";

// Fetches live scores from ESPN and upserts into golf_scores table.
// Called by the client every 2 minutes during tournament.
export async function GET() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard",
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return NextResponse.json({ error: "ESPN fetch failed" }, { status: 502 });

    const data = await res.json();
    const events: ESPNEvent[] = data.events ?? [];

    // Find Masters, fall back to first active event for testing
    const masters = events.find((e: ESPNEvent) =>
      e.name?.toLowerCase().includes("masters") || e.shortName?.toLowerCase().includes("masters")
    ) ?? events[0];
    if (!masters) return NextResponse.json({ synced: 0, message: "No events found in scoreboard" });

    const competition = masters.competitions?.[0];
    if (!competition) return NextResponse.json({ synced: 0, message: "No competition data" });

    // Use competition-level status to determine current round reliably
    const currentRound = competition.status?.period ?? 1;

    const competitors: ESPNCompetitor[] = competition.competitors ?? [];

    // Build name→score map from ESPN
    const espnMap = new Map<string, ESPNCompetitor>();
    for (const c of competitors) {
      const name = c.athlete?.displayName;
      if (name) espnMap.set(name.toLowerCase(), c);
    }

    const upserts = [];
    for (const player of GOLF_PLAYERS) {
      const espn = espnMap.get(player.name.toLowerCase());
      if (!espn) continue;

      const statusName = espn.status?.type?.name ?? "";
      const scoreToPar = parseScore(espn.score);
      const position = espn.order != null ? `${espn.order}` : null;
      const rounds: ESPNRound[] = Array.isArray(espn.linescores) ? espn.linescores : [];
      const activeRound = [...rounds].reverse().find(r => (r.linescores?.length ?? 0) > 0);
      const holes = activeRound?.linescores ?? [];
      const thru = holes.length === 18 ? "F" : holes.length > 0 ? `${holes.length}` : rounds.length > 0 ? `R${currentRound}` : null;

      // Infer cut: player has ≤2 rounds and tournament is past round 2 or complete
      const tournamentComplete = competition.status?.type?.completed ?? false;
      const isCutInferred = rounds.length <= 2 && (currentRound > 2 || tournamentComplete);

      const statusDesc = (espn.status?.type?.description ?? "").toLowerCase();
      let status: "active" | "cut" | "wd" | "complete" = "active";
      if (statusName.includes("CUT") || statusDesc.includes("cut") || isCutInferred) status = "cut";
      else if (statusName.includes("WD") || statusDesc.includes("withdraw")) status = "wd";
      else if (statusName.includes("COMPLETE") || statusDesc.includes("complete") || thru === "F") status = "complete";

      upserts.push({
        player_id: player.id,
        score_to_par: scoreToPar,
        position,
        thru,
        status,
        updated_at: new Date().toISOString(),
      });
    }

    if (upserts.length > 0) {
      const { error } = await supabaseAdmin
        .from("golf_scores")
        .upsert(upserts, { onConflict: "player_id" });
      if (error) {
        console.error(error);
        return NextResponse.json({ error: "DB upsert failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ synced: upserts.length, round: currentRound });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function parseScore(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    if (raw === "E" || raw === "") return 0;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

interface ESPNEvent {
  name?: string;
  shortName?: string;
  competitions?: ESPNCompetition[];
}
interface ESPNCompetition {
  competitors?: ESPNCompetitor[];
  status?: {
    period?: number;
    type?: { name?: string; description?: string; completed?: boolean };
  };
}
interface ESPNRound {
  value?: number;
  displayValue?: string;
  period?: number;
  linescores?: { value?: number; period?: number }[];
}
interface ESPNCompetitor {
  order?: number;
  athlete?: { displayName?: string };
  score?: string | number;
  linescores?: ESPNRound[];
  status?: {
    type?: { name?: string; description?: string };
  };
}
