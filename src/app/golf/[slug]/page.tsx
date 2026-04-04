"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { getSession, setSession, getManagerToken, cn } from "@/lib/utils";
import { PLAYERS_BY_TIER, PLAYER_BY_ID, DEADLINE, TOTAL_PICKS, PICKS_FROM_TIER_6 } from "@/lib/golf-data";
import type { GolfLeaderboardEntry, GolfPickDetail } from "@/lib/golf.types";
import type { Member } from "@/lib/database.types";

const SYNC_INTERVAL_MS = 2 * 60 * 1000;

function formatScore(score: number | null): string {
  if (score === null) return "-";
  if (score === 0) return "E";
  return score > 0 ? `+${score}` : `${score}`;
}

function scoreClass(score: number | null): string {
  if (score === null) return "text-muted";
  if (score < 0) return "text-felt font-semibold";
  if (score > 0) return "text-danger";
  return "text-ink";
}

export default function GolfPoolPage() {
  const { slug } = useParams<{ slug: string }>();

  const [pool, setPool] = useState<{ id: string; name: string; description: string | null; created_by_name: string } | null>(null);
  const [golfPoolId, setGolfPoolId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaderboard, setLeaderboard] = useState<GolfLeaderboardEntry[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSessionState] = useState<{ memberId: string; sessionToken: string; name: string } | null>(null);
  const [memberName, setMemberName] = useState("");
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const [myPicks, setMyPicks] = useState<string[]>([]);
  const [myTiebreaker, setMyTiebreaker] = useState<string>("");
  const [savingPicks, setSavingPicks] = useState(false);
  const [picksSaved, setPicksSaved] = useState(false);
  const [picksError, setPicksError] = useState<string | null>(null);

  const [openEntry, setOpenEntry] = useState<string | null>(null);

  const syncTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPool = useCallback(async () => {
    const { data: poolData } = await supabase.from("pools").select("*").eq("slug", slug).single();
    if (!poolData) { setLoading(false); return; }
    setPool(poolData);

    const stored = getManagerToken(poolData.id);
    setManagerToken(stored);

    // Restore session from URL params if present (personal link flow), else from localStorage
    const params = new URLSearchParams(window.location.search);
    const urlMemberId = params.get("m");
    const urlToken = params.get("t");
    let s = getSession(poolData.id);
    if (urlMemberId && urlToken) {
      const { data: memberRow } = await supabase.from("members").select("name").eq("id", urlMemberId).single();
      if (memberRow) {
        s = { memberId: urlMemberId, sessionToken: urlToken, name: memberRow.name };
        setSession(poolData.id, s);
      }
    }
    if (s) setSessionState(s);

    const { data: golfPool } = await supabase.from("golf_pools").select("id").eq("pool_id", poolData.id).single();
    if (!golfPool) { setLoading(false); return; }
    setGolfPoolId(golfPool.id);

    const res = await fetch(`/api/golf/leaderboard?golfPoolId=${golfPool.id}`);
    const data = await res.json();
    setIsLocked(data.isLocked);
    setMembers(data.members ?? []);
    setLeaderboard(data.leaderboard ?? []);

    if (s) {
      const pickRes = await fetch(`/api/golf/picks?memberId=${s.memberId}&golfPoolId=${golfPool.id}`);
      if (pickRes.ok) {
        const pickData = await pickRes.json();
        setMyPicks(pickData.picks ?? []);
        setMyTiebreaker(pickData.tiebreakerScore !== null ? String(pickData.tiebreakerScore) : "");
      }
    }

    setLoading(false);
  }, [slug]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [managerToken, setManagerToken] = useState<string | null>(null);

  const syncScores = useCallback(async () => {
    if (!golfPoolId) return;
    await fetch("/api/golf/sync");
    const res = await fetch(`/api/golf/leaderboard?golfPoolId=${golfPoolId}`);
    const data = await res.json();
    setLeaderboard(data.leaderboard ?? []);
  }, [golfPoolId]);

  useEffect(() => { loadPool(); }, [loadPool]);

  useEffect(() => {
    if (!isLocked || !golfPoolId) return;
    syncTimer.current = setInterval(syncScores, SYNC_INTERVAL_MS);
    return () => { if (syncTimer.current) clearInterval(syncTimer.current); };
  }, [isLocked, golfPoolId, syncScores]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!pool || !memberName.trim()) return;
    setJoining(true);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poolId: pool.id, name: memberName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      const s = { memberId: data.memberId, sessionToken: data.sessionToken, name: data.name };
      setSession(pool.id, s);
      setSessionState(s);
      await loadPool();
    }
    setJoining(false);
  }

  function togglePick(playerId: string, tier: number) {
    if (isLocked) return;
    setPicksSaved(false);
    setPicksError(null);

    if (tier < 6) {
      const otherTierPicks = myPicks.filter(id => PLAYER_BY_ID[id]?.tier !== tier);
      if (myPicks.includes(playerId)) {
        setMyPicks(otherTierPicks);
      } else {
        setMyPicks([...otherTierPicks, playerId]);
      }
    } else {
      if (myPicks.includes(playerId)) {
        setMyPicks(myPicks.filter(id => id !== playerId));
      } else {
        const currentTier6 = myPicks.filter(id => PLAYER_BY_ID[id]?.tier === 6);
        if (currentTier6.length >= PICKS_FROM_TIER_6) return;
        setMyPicks([...myPicks, playerId]);
      }
    }
  }

  async function handleSavePicks() {
    if (!session || !golfPoolId) return;
    setPicksError(null);

    const tier6picks = myPicks.filter(id => PLAYER_BY_ID[id]?.tier === 6);
    const tier15picks = myPicks.filter(id => (PLAYER_BY_ID[id]?.tier ?? 0) < 6);
    if (tier15picks.length !== 5 || tier6picks.length !== PICKS_FROM_TIER_6 || myPicks.length !== TOTAL_PICKS) {
      setPicksError("Please pick 1 player from each of Tiers 1-5 and 3 players from Tier 6.");
      return;
    }

    setSavingPicks(true);
    const res = await fetch("/api/golf/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: session.memberId,
        sessionToken: session.sessionToken,
        golfPoolId,
        picks: myPicks,
        tiebreakerScore: myTiebreaker !== "" ? parseInt(myTiebreaker, 10) : null,
      }),
    });
    setSavingPicks(false);
    if (res.ok) {
      setPicksSaved(true);
    } else {
      const d = await res.json();
      setPicksError(d.error ?? "Failed to save picks");
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + `/golf/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const deadline = new Date(DEADLINE);
  const msUntilDeadline = deadline.getTime() - Date.now();
  const daysLeft = Math.floor(msUntilDeadline / 86400000);
  const hoursLeft = Math.floor((msUntilDeadline % 86400000) / 3600000);

  const tier6PickCount = myPicks.filter(id => PLAYER_BY_ID[id]?.tier === 6).length;
  const tier15PickCount = myPicks.filter(id => (PLAYER_BY_ID[id]?.tier ?? 0) < 6).length;
  const picksComplete = tier15PickCount === 5 && tier6PickCount === PICKS_FROM_TIER_6;

  if (loading) return (
    <div className="min-h-screen bg-chalk flex items-center justify-center">
      <div className="text-muted text-sm animate-pulse">Loading pool…</div>
    </div>
  );
  if (!pool || !golfPoolId) return (
    <div className="min-h-screen bg-chalk flex flex-col items-center justify-center gap-4">
      <p className="font-display text-xl">Pool not found</p>
      <Link href="/" className="btn-secondary">← Home</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-chalk">
      <header className="bg-felt text-chalk">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link href="/" className="text-chalk/50 text-xs hover:text-chalk/80 mb-3 block transition-colors">← Poolside</Link>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold-light mb-2">⛳ 2026 Masters</div>
              <h1 className="font-display text-3xl font-bold">{pool.name}</h1>
              {pool.description && <p className="text-chalk/70 mt-2 text-sm">{pool.description}</p>}
              <p className="text-chalk/50 text-xs mt-3">Created by {pool.created_by_name}</p>
            </div>
            <button onClick={copyLink} className="btn-gold text-sm py-2 px-4 shrink-0">
              {copied ? "✓ Copied!" : "Share pool"}
            </button>
          </div>
          <div className="flex gap-6 mt-6 text-sm">
            <div><span className="text-chalk/50">Members</span><span className="ml-2 font-semibold">{members.length}</span></div>
            {!isLocked && (
              <div>
                <span className="text-chalk/50">Picks lock in</span>
                <span className="ml-2 font-semibold">
                  {msUntilDeadline > 0 ? (daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`) : "Locked"}
                </span>
              </div>
            )}
            {isLocked && <div><span className="text-chalk/50">Status</span><span className="ml-2 font-semibold text-gold-light">Live</span></div>}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Join */}
        {!session && (
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold text-ink mb-1">Join this pool</h2>
            <p className="text-muted text-sm mb-4">Enter your name to make your picks before Thursday 5am ET.</p>
            <form onSubmit={handleJoin} className="flex gap-3">
              <input className="input flex-1" placeholder="Your name" value={memberName}
                onChange={e => setMemberName(e.target.value)} required maxLength={50} />
              <button type="submit" disabled={joining} className="btn-primary shrink-0">
                {joining ? "Joining…" : "Join →"}
              </button>
            </form>
          </div>
        )}


        {/* Pick interface (pre-lock) */}
        {!isLocked && session && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Playing as <span className="font-semibold text-ink">{session.name}</span></p>
                <p className="text-xs text-muted mt-0.5">
                  {tier15PickCount}/5 tiers · {tier6PickCount}/{PICKS_FROM_TIER_6} from Tier 6
                </p>
              </div>
              <button onClick={handleSavePicks} disabled={savingPicks || !picksComplete}
                className={cn("btn-primary text-sm py-2 px-5", !picksComplete && "opacity-50 cursor-not-allowed")}>
                {savingPicks ? "Saving…" : picksSaved ? "✓ Saved" : "Save picks"}
              </button>
            </div>

            {picksError && <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm">{picksError}</div>}

            {([1, 2, 3, 4, 5] as const).map(tier => {
              const players = PLAYERS_BY_TIER[tier];
              const myTierPick = myPicks.find(id => PLAYER_BY_ID[id]?.tier === tier);
              return (
                <div key={tier} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold text-ink">Tier {tier}</h3>
                    <span className="text-xs text-muted">Pick 1</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {players.map(player => {
                      const selected = myTierPick === player.id;
                      return (
                        <button key={player.id} onClick={() => togglePick(player.id, tier)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-sm text-left transition-all duration-150 flex items-center justify-between",
                            selected ? "bg-felt text-chalk border-felt" : "bg-white border-border hover:border-felt hover:bg-felt/5 text-ink"
                          )}>
                          <span className="font-medium">{player.name}</span>
                          <span className={cn("text-xs", selected ? "text-chalk/70" : "text-muted")}>{player.odds}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-ink">Tier 6</h3>
                <span className="text-xs text-muted">Pick 3 · {tier6PickCount}/{PICKS_FROM_TIER_6} selected</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PLAYERS_BY_TIER[6].map(player => {
                  const selected = myPicks.includes(player.id);
                  const maxed = !selected && tier6PickCount >= PICKS_FROM_TIER_6;
                  return (
                    <button key={player.id} onClick={() => !maxed && togglePick(player.id, 6)}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm text-left transition-all duration-150 flex items-center justify-between",
                        selected ? "bg-felt text-chalk border-felt"
                          : maxed ? "bg-white border-border text-muted cursor-not-allowed opacity-50"
                            : "bg-white border-border hover:border-felt hover:bg-felt/5 text-ink"
                      )}>
                      <span className="font-medium">{player.name}</span>
                      <span className={cn("text-xs", selected ? "text-chalk/70" : "text-muted")}>{player.odds}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-bold text-ink mb-1">Tiebreaker</h3>
              <p className="text-sm text-muted mb-3">
                What will the winner&apos;s final score be (to par)? Last year Rory McIlroy won at <strong>-11</strong>.
                Closest guess breaks ties at tournament end.
              </p>
              <div className="flex items-center gap-3">
                <input type="number" className="input max-w-[120px]" placeholder="-11"
                  value={myTiebreaker} onChange={e => { setMyTiebreaker(e.target.value); setPicksSaved(false); }} />
                <span className="text-sm text-muted">to par</span>
              </div>
            </div>

            <PersonalLinkBanner slug={slug} memberId={session.memberId} sessionToken={session.sessionToken} />

            <div className="flex justify-end">
              <button onClick={handleSavePicks} disabled={savingPicks || !picksComplete}
                className={cn("btn-primary px-8", !picksComplete && "opacity-50 cursor-not-allowed")}>
                {savingPicks ? "Saving…" : picksSaved ? "✓ Picks saved!" : "Save picks"}
              </button>
            </div>
          </div>
        )}

        {/* Pre-lock member list */}
        {!isLocked && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-display font-bold text-ink">Who&apos;s in</h2>
              <p className="text-xs text-muted mt-0.5">Picks are hidden until Thursday 5am ET</p>
            </div>
            {members.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No one has joined yet. Share the link!</div>
            ) : (
              <ul className="divide-y divide-border">
                {members.map(m => (
                  <li key={m.id} className="px-6 py-3 flex items-center justify-between">
                    <span className="font-medium text-ink text-sm">{m.name}</span>
                    {session?.memberId === m.id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-felt/10 text-felt">you</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Post-lock leaderboard */}
        {isLocked && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-ink">Leaderboard</h2>
              <span className="text-xs text-muted">Updates every 2 min</span>
            </div>
            {leaderboard.length === 0 ? (
              <div className="card p-10 text-center text-muted text-sm">No complete entries.</div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map(entry => (
                  <LeaderboardAccordion key={entry.member_id} entry={entry}
                    isMe={session?.memberId === entry.member_id}
                    open={openEntry === entry.member_id}
                    onToggle={() => setOpenEntry(openEntry === entry.member_id ? null : entry.member_id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function PersonalLinkBanner({ slug, memberId, sessionToken }: { slug: string; memberId: string; sessionToken: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined"
    ? `${window.location.origin}/golf/${slug}?m=${memberId}&t=${sessionToken}`
    : "";
  return (
    <div className="card p-4 bg-gold/5 border-gold/30">
      <p className="text-sm font-medium text-ink mb-1">Your personal link</p>
      <p className="text-xs text-muted mb-3">Bookmark this to get back to your picks from any device.</p>
      <div className="flex gap-2 items-center">
        <code className="flex-1 text-xs bg-white border border-border rounded-lg px-3 py-2 text-muted truncate">{link}</code>
        <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="btn-secondary text-xs py-2 px-3 shrink-0">
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function LeaderboardAccordion({ entry, isMe, open, onToggle }: {
  entry: GolfLeaderboardEntry; isMe: boolean; open: boolean; onToggle: () => void;
}) {
  return (
    <div className={cn("card overflow-hidden", isMe && "ring-2 ring-felt/30")}>
      <button onClick={onToggle}
        className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-chalk/50 transition-colors">
        <span className={cn("font-display font-bold text-lg w-10 shrink-0",
          entry.rank === "1" || entry.rank === "T1" ? "text-gold" : "text-muted")}>
          {entry.rank === "1" ? "🥇" : entry.rank === "2" ? "🥈" : entry.rank === "3" ? "🥉" : entry.rank}
        </span>
        <span className="flex-1 font-medium text-ink">
          {entry.name}
          {isMe && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-felt/10 text-felt">you</span>}
        </span>
        <span className={cn("font-display font-bold text-xl tabular-nums", scoreClass(entry.total_score))}>
          {formatScore(entry.total_score)}
        </span>
        <span className={cn("text-muted text-xs transition-transform duration-200", open && "rotate-180")}>▼</span>
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="px-6 py-3 bg-chalk/40">
            <p className="text-xs text-muted font-medium uppercase tracking-wide">Picks — best 6 of 8 count</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left px-6 py-2 label text-xs">Player</th>
                <th className="text-center px-3 py-2 label text-xs">Tier</th>
                <th className="text-right px-3 py-2 label text-xs">Score</th>
                <th className="text-right px-3 py-2 label text-xs">Pos</th>
                <th className="text-right px-6 py-2 label text-xs">Thru</th>
              </tr>
            </thead>
            <tbody>
              {entry.picks.map((pick: GolfPickDetail) => (
                <tr key={pick.player_id} className={cn("border-b border-border/40", !pick.counts && "opacity-40")}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{pick.player_name}</span>
                      {pick.status === "cut" && <span className="text-xs text-danger font-medium">CUT</span>}
                      {pick.status === "wd" && <span className="text-xs text-muted font-medium">WD</span>}
                      {!pick.counts && <span className="text-xs text-muted">(dropped)</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-muted text-xs">{pick.tier}</td>
                  <td className={cn("px-3 py-3 text-right tabular-nums", scoreClass(pick.effective_score))}>
                    {(pick.status === "cut" || pick.status === "wd")
                      ? `${formatScore(pick.score_to_par)} (+8)`
                      : formatScore(pick.score_to_par)}
                  </td>
                  <td className="px-3 py-3 text-right text-muted text-xs">{pick.position ?? "-"}</td>
                  <td className="px-6 py-3 text-right text-muted text-xs">{pick.thru ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entry.tiebreaker_score !== null && (
            <div className="px-6 py-3 border-t border-border/40 text-xs text-muted">
              Tiebreaker guess: <span className="font-semibold text-ink">{formatScore(entry.tiebreaker_score)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
