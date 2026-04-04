"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateGolfPoolPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creatorName, setCreatorName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/golf/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, createdByName: creatorName }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to create pool"); }
      const { slug, poolId, managerToken } = await res.json();
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("poolside_manager") ?? "{}";
        const tokens = JSON.parse(raw);
        tokens[poolId] = managerToken;
        localStorage.setItem("poolside_manager", JSON.stringify(tokens));
      }
      router.push(`/golf/${slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-chalk">
      <nav className="flex items-center px-6 py-5 max-w-3xl mx-auto">
        <Link href="/" className="font-display text-xl font-bold text-ink tracking-tight">
          Pool<span className="text-felt">side</span>
        </Link>
      </nav>
      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/15 text-pending mb-4">
          ⛳ 2026 Masters Golf Pool
        </div>
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Create a golf pool</h1>
        <p className="text-muted text-sm mb-8">
          Pick 8 players across 6 tiers. Your best 6 scores count. Picks lock Thursday April 10 at 5am ET.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="card p-8 space-y-5">
            <div>
              <label className="label block mb-2">Pool name *</label>
              <input className="input" placeholder='e.g. "The Boys Masters Pool"' value={name}
                onChange={e => setName(e.target.value)} required maxLength={80} />
            </div>
            <div>
              <label className="label block mb-2">Description (optional)</label>
              <textarea className="input resize-none" rows={3}
                placeholder='e.g. "Loser buys drinks at the watch party"'
                value={description} onChange={e => setDescription(e.target.value)} maxLength={300} />
            </div>
            <div>
              <label className="label block mb-2">Your name *</label>
              <input className="input" placeholder="Your name" value={creatorName}
                onChange={e => setCreatorName(e.target.value)} required maxLength={50} />
              <p className="text-xs text-muted mt-1.5">You&apos;ll be the manager of this pool.</p>
            </div>
          </div>
          {error && <div className="mt-4 p-4 rounded-xl bg-danger/10 text-danger text-sm">{error}</div>}
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary px-8">
              {loading ? "Creating…" : "Create pool →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
