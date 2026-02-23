"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { getManagerToken, cn } from "@/lib/utils";

let _id = 0;
interface MarketDraft { _id: number; question: string; type: "binary"|"multiple"|"numeric"; options: string[]; closesAt: string; pointsValue: number; }
function newMarket(): MarketDraft { return { _id: _id++, question: "", type: "multiple", options: ["",""], closesAt: "", pointsValue: 100 }; }

export default function AddMarketPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [poolId, setPoolId] = useState<string | null>(null);
  const [managerToken, setManagerToken] = useState<string | null>(null);
  const [markets, setMarkets] = useState<MarketDraft[]>([newMarket()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: pool } = await supabase.from("pools").select("id").eq("slug", slug).single();
      if (!pool) return;
      setPoolId(pool.id);
      setManagerToken(getManagerToken(pool.id));
    }
    load();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!poolId || !managerToken) { setError("You don't have manager access to this pool."); return; }
    const validMarkets = markets.filter(m => m.question.trim());
    if (!validMarkets.length) { setError("Add at least one prediction."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/markets", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId, managerToken,
          markets: validMarkets.map(m => ({ question: m.question, type: m.type, closesAt: m.closesAt||null, pointsValue: m.pointsValue, options: m.type !== "numeric" ? m.options.filter(o => o.trim()) : [] })) }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to create predictions"); }
      router.push(`/p/${slug}`);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  }

  if (!managerToken) return (
    <div className="min-h-screen bg-chalk flex flex-col items-center justify-center gap-4">
      <p className="text-ink font-display text-xl">Manager access required</p>
      <Link href={`/p/${slug}`} className="btn-secondary">← Back to pool</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-chalk">
      <nav className="flex items-center px-6 py-5 max-w-3xl mx-auto">
        <Link href={`/p/${slug}`} className="font-display text-xl font-bold text-ink tracking-tight">Pool<span className="text-felt">side</span></Link>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-ink mb-1">Add predictions</h1>
        <p className="text-muted text-sm mb-8">Add predictions for your group to weigh in on.</p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {markets.map((market, idx) => (
              <div key={market._id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="label">Prediction {idx + 1}</span>
                  {markets.length > 1 && <button type="button" onClick={() => setMarkets(p => p.filter((_, i) => i !== idx))} className="text-muted hover:text-danger text-xs">Remove</button>}
                </div>
                <div className="space-y-4">
                  <input className="input" placeholder="What are you predicting?" value={market.question} onChange={e => setMarkets(p => p.map((x, i) => i === idx ? { ...x, question: e.target.value } : x))} maxLength={200} />
                  <div>
                    <label className="label block mb-2">Type</label>
                    <div className="flex gap-2">
                      {(["multiple", "binary", "numeric"] as const).map(t => (
                        <button type="button" key={t} onClick={() => setMarkets(p => p.map((x, i) => i === idx ? { ...x, type: t, options: t === "binary" ? ["Yes","No"] : t === "multiple" ? ["",""] : x.options } : x))}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", market.type === t ? "bg-felt text-chalk border-felt" : "bg-white text-muted border-border hover:border-ink")}>
                          {t === "multiple" ? "Multiple choice" : t === "binary" ? "Yes / No" : "Number guess"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {market.type !== "numeric" && (
                    <div>
                      <label className="label block mb-2">Options</label>
                      <div className="space-y-2">
                        {market.options.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input className="input" placeholder={`Option ${i + 1}`} value={opt} readOnly={market.type === "binary"} onChange={e => { const next = [...market.options]; next[i] = e.target.value; setMarkets(p => p.map((x, j) => j === idx ? { ...x, options: next } : x)); }} />
                            {market.type === "multiple" && market.options.length > 2 && <button type="button" onClick={() => setMarkets(p => p.map((x, j) => j === idx ? { ...x, options: x.options.filter((_, k) => k !== i) } : x))} className="text-muted hover:text-danger text-xs px-2">✕</button>}
                          </div>
                        ))}
                      </div>
                      {market.type === "multiple" && market.options.length < 8 && <button type="button" onClick={() => setMarkets(p => p.map((x, i) => i === idx ? { ...x, options: [...x.options, ""] } : x))} className="text-xs text-felt mt-2 font-medium">+ Add option</button>}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="label block mb-2">Picks lock at</label><input type="datetime-local" className="input text-sm" value={market.closesAt} onChange={e => setMarkets(p => p.map((x, i) => i === idx ? { ...x, closesAt: e.target.value } : x))} /></div>
                    <div><label className="label block mb-2">Points</label><input type="number" className="input" min={10} max={1000} step={10} value={market.pointsValue} onChange={e => setMarkets(p => p.map((x, i) => i === idx ? { ...x, pointsValue: Number(e.target.value) } : x))} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setMarkets(p => [...p, newMarket()])} className="btn-secondary w-full mt-4 border-dashed">+ Add another prediction</button>
          {error && <div className="mt-4 p-4 rounded-xl bg-danger/10 text-danger text-sm">{error}</div>}
          <div className="mt-6 flex justify-end gap-3">
            <Link href={`/p/${slug}`} className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary px-8">{loading ? "Saving…" : "Add predictions →"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
