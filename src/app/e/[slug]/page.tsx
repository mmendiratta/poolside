"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { getSession, setSession, getManagerToken, isPoolClosed, cn } from "@/lib/utils";
import { Countdown } from "@/components/Countdown";
import type { EventWithPools, LeaderboardEntry, Pick } from "@/lib/database.types";

type Tab = "pools"|"leaderboard";

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<EventWithPools|null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pools");
  const [participantName, setParticipantName] = useState("");
  const [session, setSessionState] = useState<{participantId:string;sessionToken:string;name:string}|null>(null);
  const [picks, setPicks] = useState<Record<string,Pick>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [joining, setJoining] = useState(false);
  const [managerToken, setManagerToken] = useState<string|null>(null);
  const [resolving, setResolving] = useState<string|null>(null);
  const [copied, setCopied] = useState(false);

  const loadEvent = useCallback(async () => {
    const { data: eventData } = await supabase.from("events").select("*").eq("slug", slug).single();
    if (!eventData) { setLoading(false); return; }
    const { data: poolsData } = await supabase.from("pools").select("*, options!options_pool_id_fkey(*)").eq("event_id", eventData.id).order("created_at");
    const enriched = { ...eventData, pools: (poolsData??[]).map((p: { options: any; })=>({...p,options:(p.options??[]).sort((a:{ display_order:number },b:{ display_order:number })=>a.display_order-b.display_order)})) } as EventWithPools;
    setEvent(enriched);
    const stored = getManagerToken(eventData.id);
    setManagerToken(stored);
    const s = getSession(eventData.id);
    if (s) {
      setSessionState(s);
      const { data: picksData } = await supabase.from("picks").select("*").eq("participant_id", s.participantId);
      const map: Record<string,Pick> = {};
      for (const pick of picksData??[]) map[pick.pool_id] = pick;
      setPicks(map);
    }
    const { data: lb } = await supabase.from("leaderboard").select("*").eq("event_id", eventData.id).order("points", { ascending: false });
    setLeaderboard(lb??[]);
    setLoading(false);
  }, [slug]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !participantName.trim()) return;
    setJoining(true);
    const res = await fetch("/api/participants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: event.id, name: participantName.trim() }) });
    if (res.ok) {
      const data = await res.json();
      const s = { participantId: data.participantId, sessionToken: data.sessionToken, name: data.name };
      setSession(event.id, s); setSessionState(s);
    }
    setJoining(false);
  }

  async function submitPick(poolId: string, optionId?: string, numericValue?: number) {
    if (!session) return;
    const res = await fetch("/api/picks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantId: session.participantId, sessionToken: session.sessionToken, poolId, optionId: optionId??null, numericValue: numericValue??null }) });
    if (res.ok) setPicks(prev => ({ ...prev, [poolId]: { ...prev[poolId], pool_id: poolId, option_id: optionId??null, numeric_value: numericValue??null } as Pick }));
  }

  async function handleResolve(poolId: string, optionId?: string, numericValue?: number) {
    if (!event || !managerToken) return;
    setResolving(poolId);
    await fetch("/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ poolId, eventId: event.id, managerToken, resolvedOptionId: optionId??null, resolvedNumericValue: numericValue??null }) });
    await loadEvent(); setResolving(null);
  }

  function copyLink() { navigator.clipboard.writeText(window.location.origin+`/e/${slug}`); setCopied(true); setTimeout(()=>setCopied(false),2000); }

  if (loading) return <div className="min-h-screen bg-chalk flex items-center justify-center"><div className="text-muted text-sm animate-pulse">Loading event…</div></div>;
  if (!event) return <div className="min-h-screen bg-chalk flex flex-col items-center justify-center gap-4"><p className="font-display text-xl text-ink">Event not found</p><Link href="/" className="btn-secondary">← Home</Link></div>;

  const isManager = !!managerToken;

  return (
    <main className="min-h-screen bg-chalk">
      <header className="bg-felt text-chalk">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link href="/" className="text-chalk/50 text-xs hover:text-chalk/80 mb-3 block transition-colors">← Poolside</Link>
              <h1 className="font-display text-3xl font-bold leading-tight">{event.name}</h1>
              {event.description && <p className="text-chalk/70 mt-2 text-sm">{event.description}</p>}
              <p className="text-chalk/50 text-xs mt-3">Created by {event.created_by_name}</p>
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <button onClick={copyLink} className="btn-gold text-sm py-2 px-4">{copied?"✓ Copied!":"Share link"}</button>
              {isManager && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold-light">Manager view</span>}
            </div>
          </div>
          <div className="flex gap-6 mt-6 text-sm">
            <div><span className="text-chalk/50">Pools</span><span className="ml-2 font-semibold">{event.pools.length}</span></div>
            <div><span className="text-chalk/50">Participants</span><span className="ml-2 font-semibold">{leaderboard.length}</span></div>
            <div><span className="text-chalk/50">Resolved</span><span className="ml-2 font-semibold">{event.pools.filter(p=>p.resolved_at).length} / {event.pools.length}</span></div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {!session && (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-xl font-bold text-ink mb-1">Join this event</h2>
            <p className="text-muted text-sm mb-4">Enter your name to start making picks.</p>
            <form onSubmit={handleJoin} className="flex gap-3">
              <input className="input flex-1" placeholder="Your name" value={participantName} onChange={e=>setParticipantName(e.target.value)} required maxLength={50} />
              <button type="submit" disabled={joining} className="btn-primary shrink-0">{joining?"Joining…":"Join →"}</button>
            </form>
          </div>
        )}
        {session && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted">Playing as <span className="font-semibold text-ink">{session.name}</span></p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-felt/10 text-felt">{Object.keys(picks).length} / {event.pools.length} picks made</span>
          </div>
        )}

        <div className="flex gap-1 p-1 bg-border/40 rounded-xl mb-6 w-fit">
          {(["pools","leaderboard"] as Tab[]).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize", tab===t?"bg-white text-ink shadow-sm":"text-muted hover:text-ink")}>{t}</button>
          ))}
        </div>

        {tab==="pools" && (
          <div className="space-y-4 stagger">
            {event.pools.map(pool => {
              const myPick = picks[pool.id];
              const closed = isPoolClosed(pool.closes_at);
              const resolved = !!pool.resolved_at;
              return (
                <div key={pool.id} className="pool-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="font-display text-lg font-bold text-ink leading-snug">{pool.question}</h3>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {resolved ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/15 text-pending">✓ Resolved</span>
                        : pool.closes_at ? <Countdown closesAt={pool.closes_at} />
                        : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-felt/10 text-felt">Open</span>}
                      <span className="text-xs text-muted">{pool.points_value} pts</span>
                    </div>
                  </div>
                  {pool.type!=="numeric" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pool.options.map(opt => {
                        const isMyPick = myPick?.option_id===opt.id;
                        const isWinner = resolved && pool.resolved_option_id===opt.id;
                        const canPick = !!session && !closed && !resolved;
                        return (
                          <button key={opt.id} disabled={!canPick} onClick={()=>canPick&&submitPick(pool.id,opt.id)}
                            className={cn("px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-200",
                              isWinner?"bg-gold/15 border-gold text-pending font-semibold":isMyPick?"bg-felt text-chalk border-felt":canPick?"bg-white border-border hover:border-felt hover:bg-felt/5 text-ink":"bg-white border-border text-muted cursor-default")}>
                            {isWinner&&"✓ "}{opt.label}{isMyPick&&!isWinner&&<span className="ml-2 text-xs text-chalk/70">your pick</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {pool.type==="numeric" && (
                    <NumericPick pool={pool} myPick={myPick} canPick={!!session&&!closed&&!resolved} onPick={val=>submitPick(pool.id,undefined,val)} />
                  )}
                  {isManager && !resolved && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="label mb-2">Resolve this pool</p>
                      {pool.type!=="numeric" ? (
                        <div className="flex flex-wrap gap-2">
                          {pool.options.map(opt=>(
                            <button key={opt.id} disabled={resolving===pool.id} onClick={()=>handleResolve(pool.id,opt.id)} className="btn-secondary text-xs py-1.5 px-3">
                              {resolving===pool.id?"Resolving…":`"${opt.label}" won`}
                            </button>
                          ))}
                        </div>
                      ) : <NumericResolve poolId={pool.id} resolving={resolving===pool.id} onResolve={val=>handleResolve(pool.id,undefined,val)} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab==="leaderboard" && (
          <div className="card overflow-hidden">
            {leaderboard.length===0 ? (
              <div className="p-10 text-center text-muted text-sm">No participants yet. Share the link to get picks coming in!</div>
            ) : (
              <table className="w-full">
                <thead><tr className="border-b border-border bg-chalk/50">
                  <th className="text-left px-6 py-3 label">Rank</th>
                  <th className="text-left px-6 py-3 label">Name</th>
                  <th className="text-right px-6 py-3 label">Points</th>
                  <th className="text-right px-6 py-3 label">Picks</th>
                </tr></thead>
                <tbody className="stagger">
                  {leaderboard.map((entry,i)=>(
                    <tr key={entry.participant_id} className={cn("border-b border-border/60 transition-colors", session?.participantId===entry.participant_id&&"bg-felt/5", i===0&&"bg-gold/5")}>
                      <td className="px-6 py-4"><span className={cn("font-display font-bold text-lg", i===0?"text-gold":i===1?"text-muted":i===2?"text-pending":"text-border")}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</span></td>
                      <td className="px-6 py-4 font-medium text-ink">{entry.name}{session?.participantId===entry.participant_id&&<span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-felt/10 text-felt">you</span>}</td>
                      <td className="px-6 py-4 text-right font-display font-bold text-lg text-ink">{entry.points}</td>
                      <td className="px-6 py-4 text-right text-muted text-sm">{entry.total_picks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function NumericPick({ pool, myPick, canPick, onPick }: { pool: { resolved_at: string|null; resolved_numeric_value: number|null }; myPick?: Pick; canPick: boolean; onPick: (val: number)=>void }) {
  const [val, setVal] = useState(myPick?.numeric_value?.toString()??"");
  return (
    <div className="flex gap-3 items-center">
      <input type="number" step="any" className="input max-w-[160px]" placeholder="Your guess" value={val} disabled={!canPick} onChange={e=>setVal(e.target.value)} />
      {canPick && <button onClick={()=>val&&onPick(parseFloat(val))} className="btn-primary text-sm py-2 px-4">{myPick?.numeric_value!=null?"Update":"Submit"}</button>}
      {myPick?.numeric_value!=null&&!canPick&&<span className="text-sm text-muted">Your pick: <strong>{myPick.numeric_value}</strong></span>}
      {pool.resolved_at&&pool.resolved_numeric_value!=null&&<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/15 text-pending">Answer: {pool.resolved_numeric_value}</span>}
    </div>
  );
}

function NumericResolve({ poolId: _poolId, resolving, onResolve }: { poolId: string; resolving: boolean; onResolve: (val: number)=>void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2 items-center">
      <input type="number" step="any" className="input max-w-[140px] text-sm" placeholder="Actual value" value={val} onChange={e=>setVal(e.target.value)} />
      <button disabled={!val||resolving} onClick={()=>val&&onResolve(parseFloat(val))} className="btn-secondary text-xs py-1.5 px-3">{resolving?"Resolving…":"Set answer"}</button>
    </div>
  );
}
