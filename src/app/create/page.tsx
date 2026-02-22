"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

let _id = 0;
interface PoolDraft { _id: number; question: string; type: "binary"|"multiple"|"numeric"; options: string[]; closesAt: string; pointsValue: number; }
function newPool(): PoolDraft { return { _id: _id++, question: "", type: "multiple", options: ["",""], closesAt: "", pointsValue: 100 }; }

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<"event"|"pools">("event");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [pools, setPools] = useState<PoolDraft[]>([newPool()]);

  async function handleCreate() {
    const validPools = pools.filter(p => p.question.trim());
    if (!validPools.length) { setError("Add at least one prediction pool."); return; }
    for (const p of validPools) {
      if (p.type !== "numeric" && p.options.filter(o => o.trim()).length < 2) { setError(`"${p.question}" needs at least 2 options.`); return; }
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: eventName, description, createdByName: creatorName,
          pools: validPools.map(p => ({ question: p.question, type: p.type, closesAt: p.closesAt||null, pointsValue: p.pointsValue, options: p.type!=="numeric" ? p.options.filter(o=>o.trim()) : [] })) }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to create event"); }
      const { slug, managerId, managerToken } = await res.json();
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("poolside_manager") ?? "{}";
        const tokens = JSON.parse(raw); tokens[managerId] = managerToken;
        localStorage.setItem("poolside_manager", JSON.stringify(tokens));
      }
      router.push(`/e/${slug}?manager=1`);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-chalk">
      <nav className="flex items-center px-6 py-5 max-w-3xl mx-auto">
        <Link href="/" className="font-display text-xl font-bold text-ink tracking-tight">Pool<span className="text-felt">side</span></Link>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-10">
          {(["event","pools"] as const).map((s,i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all", (step===s||(s==="event"&&step==="pools")) ? "bg-felt text-chalk" : "bg-border text-muted")}>{i+1}</div>
              <span className={cn("text-sm font-medium", step===s?"text-ink":"text-muted")}>{s==="event"?"Event details":"Prediction pools"}</span>
              {i===0 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === "event" ? (
          <form onSubmit={e=>{e.preventDefault();if(eventName.trim()&&creatorName.trim())setStep("pools");}} className="stagger">
            <div className="card p-8">
              <h1 className="font-display text-2xl font-bold text-ink mb-1">Create your event</h1>
              <p className="text-muted text-sm mb-8">Give it a name and we'll generate a shareable link.</p>
              <div className="space-y-5">
                <div><label className="label block mb-2">Event name *</label><input className="input" placeholder="Jake & Sarah's Wedding" value={eventName} onChange={e=>setEventName(e.target.value)} required maxLength={80} /></div>
                <div><label className="label block mb-2">Description (optional)</label><textarea className="input resize-none" rows={3} placeholder="A little context for your guests..." value={description} onChange={e=>setDescription(e.target.value)} maxLength={300} /></div>
                <div><label className="label block mb-2">Your name *</label><input className="input" placeholder="Your name (shown as creator)" value={creatorName} onChange={e=>setCreatorName(e.target.value)} required maxLength={50} /><p className="text-xs text-muted mt-1.5">This device will be remembered as the event manager.</p></div>
              </div>
            </div>
            <div className="mt-4 flex justify-end"><button type="submit" className="btn-primary px-8">Continue →</button></div>
          </form>
        ) : (
          <div className="stagger">
            <div className="flex items-center justify-between mb-6">
              <div><h1 className="font-display text-2xl font-bold text-ink">Add prediction pools</h1><p className="text-muted text-sm mt-1">Each pool is one question participants will predict.</p></div>
              <button onClick={()=>setStep("event")} className="text-sm text-muted hover:text-ink transition-colors">← Back</button>
            </div>
            <div className="space-y-4">
              {pools.map((pool,idx) => (
                <div key={pool._id} className="card p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="label mt-1">Pool {idx+1}</span>
                    {pools.length > 1 && <button onClick={()=>setPools(p=>p.filter((_,i)=>i!==idx))} className="text-muted hover:text-danger text-xs transition-colors">Remove</button>}
                  </div>
                  <div className="space-y-4">
                    <input className="input" placeholder="What's your question? e.g. How long will the best man's speech be?" value={pool.question} onChange={e=>setPools(p=>p.map((x,i)=>i===idx?{...x,question:e.target.value}:x))} maxLength={200} />
                    <div>
                      <label className="label block mb-2">Pool type</label>
                      <div className="flex gap-2">
                        {(["multiple","binary","numeric"] as const).map(t=>(
                          <button key={t} onClick={()=>setPools(p=>p.map((x,i)=>i===idx?{...x,type:t,options:t==="binary"?["Yes","No"]:t==="multiple"?["",""]:x.options}:x))}
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", pool.type===t?"bg-felt text-chalk border-felt":"bg-white text-muted border-border hover:border-ink")}>
                            {t==="multiple"?"Multiple choice":t==="binary"?"Yes / No":"Number guess"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {pool.type !== "numeric" && (
                      <div>
                        <label className="label block mb-2">Options</label>
                        <div className="space-y-2">
                          {pool.options.map((opt,i)=>(
                            <div key={i} className="flex gap-2">
                              <input className="input" placeholder={`Option ${i+1}`} value={opt} readOnly={pool.type==="binary"} onChange={e=>{const next=[...pool.options];next[i]=e.target.value;setPools(p=>p.map((x,j)=>j===idx?{...x,options:next}:x));}} />
                              {pool.type==="multiple"&&pool.options.length>2&&<button onClick={()=>setPools(p=>p.map((x,j)=>j===idx?{...x,options:x.options.filter((_,k)=>k!==i)}:x))} className="text-muted hover:text-danger text-xs px-2 shrink-0">✕</button>}
                            </div>
                          ))}
                        </div>
                        {pool.type==="multiple"&&pool.options.length<8&&<button onClick={()=>setPools(p=>p.map((x,i)=>i===idx?{...x,options:[...x.options,""]}:x))} className="text-xs text-felt hover:text-felt-light mt-2 font-medium">+ Add option</button>}
                      </div>
                    )}
                    {pool.type==="numeric"&&<p className="text-xs text-muted bg-border/40 rounded-lg px-3 py-2">Participants will enter a number. Closest guess wins.</p>}
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="label block mb-2">Picks lock at (optional)</label><input type="datetime-local" className="input text-sm" value={pool.closesAt} onChange={e=>setPools(p=>p.map((x,i)=>i===idx?{...x,closesAt:e.target.value}:x))} /></div>
                      <div><label className="label block mb-2">Points value</label><input type="number" className="input" min={10} max={1000} step={10} value={pool.pointsValue} onChange={e=>setPools(p=>p.map((x,i)=>i===idx?{...x,pointsValue:Number(e.target.value)}:x))} /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>setPools(p=>[...p,newPool()])} className="btn-secondary w-full mt-4 border-dashed">+ Add another pool</button>
            {error && <div className="mt-4 p-4 rounded-xl bg-danger/10 text-danger text-sm">{error}</div>}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={()=>setStep("event")} className="btn-secondary">Back</button>
              <button onClick={handleCreate} disabled={loading} className="btn-primary px-8">{loading?"Creating…":"Create event →"}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
