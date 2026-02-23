"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { getSession, setSession, getManagerToken, isMarketClosed, cn } from "@/lib/utils";
import { Countdown } from "@/components/Countdown";
import type { Pool, MarketWithOptions, LeaderboardEntry, Member, Pick } from "@/lib/database.types";

type Tab = "predictions" | "leaderboard" | "members";

export default function PoolPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pool, setPool] = useState<Pool | null>(null);
  const [markets, setMarkets] = useState<MarketWithOptions[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("predictions");
  const [memberName, setMemberName] = useState("");
  const [joining, setJoining] = useState(false);
  const [session, setSessionState] = useState<{ memberId: string; sessionToken: string; name: string } | null>(null);
  const [managerToken, setManagerToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [resolving, setResolving] = useState<string | null>(null);

  const loadPool = useCallback(async () => {
    const { data: poolData } = await supabase.from("pools").select("*").eq("slug", slug).single();
    if (!poolData) { setLoading(false); return; }
    setPool(poolData);

    const stored = getManagerToken(poolData.id);
    setManagerToken(stored);

    const s = getSession(poolData.id);
    if (s) {
      setSessionState(s);
      const { data: picksData } = await supabase.from("picks").select("*").eq("member_id", s.memberId);
      const map: Record<string, Pick> = {};
      for (const pick of picksData ?? []) map[pick.market_id] = pick;
      setPicks(map);
    }

    const [{ data: marketsData }, { data: lb }, { data: membersData }] = await Promise.all([
      supabase.from("markets").select("*, options!options_market_id_fkey(*)").eq("pool_id", poolData.id).order("created_at"),
      supabase.from("leaderboard").select("*").eq("pool_id", poolData.id).order("points", { ascending: false }),
      supabase.from("members").select("*").eq("pool_id", poolData.id).order("joined_at"),
    ]);

    setMarkets((marketsData ?? []).map(m => ({ ...m, options: (m.options ?? []).sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order) })));
    setLeaderboard(lb ?? []);
    setMembers(membersData ?? []);
    setLoading(false);
  }, [slug]);

  useEffect(() => { loadPool(); }, [loadPool]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!pool || !memberName.trim()) return;
    setJoining(true);
    const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poolId: pool.id, name: memberName.trim() }) });
    if (res.ok) {
      const data = await res.json();
      const s = { memberId: data.memberId, sessionToken: data.sessionToken, name: data.name };
      setSession(pool.id, s); setSessionState(s);
      await loadPool();
    }
    setJoining(false);
  }

  async function submitPick(marketId: string, optionId?: string, numericValue?: number) {
    if (!session) return;
    const res = await fetch("/api/picks", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: session.memberId, sessionToken: session.sessionToken, marketId, optionId: optionId ?? null, numericValue: numericValue ?? null }) });
    if (res.ok) setPicks(prev => ({ ...prev, [marketId]: { ...prev[marketId], market_id: marketId, option_id: optionId ?? null, numeric_value: numericValue ?? null } as Pick }));
  }

  async function handleResolve(marketId: string, optionId?: string, numericValue?: number) {
    if (!pool || !managerToken) return;
    setResolving(marketId);
    await fetch("/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId, poolId: pool.id, managerToken, resolvedOptionId: optionId ?? null, resolvedNumericValue: numericValue ?? null }) });
    await loadPool();
    setResolving(null);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + `/p/${slug}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="min-h-screen bg-chalk flex items-center justify-center"><div className="text-muted text-sm animate-pulse">Loading pool…</div></div>;
  if (!pool) return <div className="min-h-screen bg-chalk flex flex-col items-center justify-center gap-4"><p className="font-display text-xl">Pool not found</p><Link href="/" className="btn-secondary">← Home</Link></div>;

  const isManager = !!managerToken;
  const resolvedCount = markets.filter(m => m.resolved_at).length;

  return (
    <main className="min-h-screen bg-chalk">
      <header className="bg-felt text-chalk">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link href="/" className="text-chalk/50 text-xs hover:text-chalk/80 mb-3 block transition-colors">← Poolside</Link>
              <h1 className="font-display text-3xl font-bold">{pool.name}</h1>
              {pool.description && <p className="text-chalk/70 mt-2 text-sm">{pool.description}</p>}
              <p className="text-chalk/50 text-xs mt-3">Created by {pool.created_by_name}</p>
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <button onClick={copyLink} className="btn-gold text-sm py-2 px-4">{copied ? "✓ Copied!" : "Share pool"}</button>
              {isManager && <Link href={`/p/${slug}/add-market`} className="btn-secondary text-sm py-2 px-4 border-chalk/30 text-chalk hover:bg-chalk/10">+ Add predictions</Link>}
              {isManager && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold-light">Manager</span>}
            </div>
          </div>
          <div className="flex gap-6 mt-6 text-sm">
            <div><span className="text-chalk/50">Predictions</span><span className="ml-2 font-semibold">{markets.length}</span></div>
            {markets.length > 0 && <div><span className="text-chalk/50">Resolved</span><span className="ml-2 font-semibold">{resolvedCount} / {markets.length}</span></div>}
            <div><span className="text-chalk/50">Members</span><span className="ml-2 font-semibold">{members.length}</span></div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {!session && (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-xl font-bold text-ink mb-1">Join this pool</h2>
            <p className="text-muted text-sm mb-4">Enter your name to participate in predictions.</p>
            <form onSubmit={handleJoin} className="flex gap-3">
              <input className="input flex-1" placeholder="Your name" value={memberName} onChange={e => setMemberName(e.target.value)} required maxLength={50} />
              <button type="submit" disabled={joining} className="btn-primary shrink-0">{joining ? "Joining…" : "Join →"}</button>
            </form>
          </div>
        )}

        {session && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted">Playing as <span className="font-semibold text-ink">{session.name}</span></p>
          </div>
        )}

        <div className="flex gap-1 p-1 bg-border/40 rounded-xl mb-6 w-fit">
          {(["predictions", "leaderboard", "members"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize", tab === t ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}>{t}</button>
          ))}
        </div>

        {tab === "predictions" && (
          <div className="space-y-4 stagger">
            {markets.length === 0 ? (
              <div className="card p-10 text-center text-muted text-sm">
                {isManager ? <><p className="mb-4">No predictions yet.</p><Link href={`/p/${slug}/add-market`} className="btn-primary">+ Add first prediction</Link></> : "No predictions yet. Check back soon!"}
              </div>
            ) : markets.map(market => {
              const myPick = picks[market.id];
              const closed = isMarketClosed(market.closes_at);
              const resolved = !!market.resolved_at;
              return (
                <div key={market.id} className="pool-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="font-display text-lg font-bold text-ink leading-snug">{market.question}</h3>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {resolved ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/15 text-pending">✓ Resolved</span>
                        : market.closes_at ? <Countdown closesAt={market.closes_at} />
                        : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-felt/10 text-felt">Open</span>}
                      <span className="text-xs text-muted">{market.points_value} pts</span>
                    </div>
                  </div>

                  {market.type !== "numeric" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {market.options.map(opt => {
                        const isMyPick = myPick?.option_id === opt.id;
                        const isWinner = resolved && market.resolved_option_id === opt.id;
                        const canPick = !!session && !closed && !resolved;
                        return (
                          <button key={opt.id} disabled={!canPick} onClick={() => canPick && submitPick(market.id, opt.id)}
                            className={cn("px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-200",
                              isWinner ? "bg-gold/15 border-gold text-pending font-semibold" : isMyPick ? "bg-felt text-chalk border-felt" : canPick ? "bg-white border-border hover:border-felt hover:bg-felt/5 text-ink" : "bg-white border-border text-muted cursor-default")}>
                            {isWinner && "✓ "}{opt.label}{isMyPick && !isWinner && <span className="ml-2 text-xs text-chalk/70">your pick</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {market.type === "numeric" && (
                    <NumericPick market={market} myPick={myPick} canPick={!!session && !closed && !resolved} onPick={val => submitPick(market.id, undefined, val)} />
                  )}

                  {isManager && !resolved && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="label mb-2">Resolve</p>
                      {market.type !== "numeric" ? (
                        <div className="flex flex-wrap gap-2">
                          {market.options.map(opt => (
                            <button key={opt.id} disabled={resolving === market.id} onClick={() => handleResolve(market.id, opt.id)} className="btn-secondary text-xs py-1.5 px-3">
                              {resolving === market.id ? "Resolving…" : `"${opt.label}" won`}
                            </button>
                          ))}
                        </div>
                      ) : <NumericResolve marketId={market.id} resolving={resolving === market.id} onResolve={val => handleResolve(market.id, undefined, val)} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="card overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="p-10 text-center text-muted text-sm">No picks yet. Make your predictions to get on the board!</div>
            ) : (
              <table className="w-full">
                <thead><tr className="border-b border-border bg-chalk/50">
                  <th className="text-left px-6 py-3 label">Rank</th>
                  <th className="text-left px-6 py-3 label">Name</th>
                  <th className="text-right px-6 py-3 label">Points</th>
                  <th className="text-right px-6 py-3 label">Picks</th>
                </tr></thead>
                <tbody className="stagger">
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.member_id} className={cn("border-b border-border/60", session?.memberId === entry.member_id && "bg-felt/5", i === 0 && "bg-gold/5")}>
                      <td className="px-6 py-4"><span className={cn("font-display font-bold text-lg", i === 0 ? "text-gold" : i === 1 ? "text-muted" : i === 2 ? "text-pending" : "text-border")}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span></td>
                      <td className="px-6 py-4 font-medium text-ink">{entry.name}{session?.memberId === entry.member_id && <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-felt/10 text-felt">you</span>}</td>
                      <td className="px-6 py-4 text-right font-display font-bold text-lg">{entry.points}</td>
                      <td className="px-6 py-4 text-right text-muted text-sm">{entry.total_picks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "members" && (
          <div className="card overflow-hidden">
            {members.length === 0 ? (
              <div className="p-10 text-center text-muted text-sm">No members yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {members.map(m => (
                  <li key={m.id} className="px-6 py-4 flex items-center justify-between">
                    <span className="font-medium text-ink">{m.name}{session?.memberId === m.id && <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-felt/10 text-felt">you</span>}</span>
                    <span className="text-xs text-muted">{new Date(m.joined_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function NumericPick({ market, myPick, canPick, onPick }: { market: { resolved_at: string | null; resolved_numeric_value: number | null }; myPick?: Pick; canPick: boolean; onPick: (val: number) => void }) {
  const [val, setVal] = useState(myPick?.numeric_value?.toString() ?? "");
  return (
    <div className="flex gap-3 items-center">
      <input type="number" step="any" className="input max-w-[160px]" placeholder="Your guess" value={val} disabled={!canPick} onChange={e => setVal(e.target.value)} />
      {canPick && <button onClick={() => val && onPick(parseFloat(val))} className="btn-primary text-sm py-2 px-4">{myPick?.numeric_value != null ? "Update" : "Submit"}</button>}
      {myPick?.numeric_value != null && !canPick && <span className="text-sm text-muted">Your pick: <strong>{myPick.numeric_value}</strong></span>}
      {market.resolved_at && market.resolved_numeric_value != null && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/15 text-pending">Answer: {market.resolved_numeric_value}</span>}
    </div>
  );
}

function NumericResolve({ marketId: _marketId, resolving, onResolve }: { marketId: string; resolving: boolean; onResolve: (val: number) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2 items-center">
      <input type="number" step="any" className="input max-w-[140px] text-sm" placeholder="Actual value" value={val} onChange={e => setVal(e.target.value)} />
      <button disabled={!val || resolving} onClick={() => val && onResolve(parseFloat(val))} className="btn-secondary text-xs py-1.5 px-3">{resolving ? "Resolving…" : "Set answer"}</button>
    </div>
  );
}
