import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-chalk flex flex-col">
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <span className="font-display text-xl font-bold text-ink tracking-tight">Pool<span className="text-felt">side</span></span>
        <div className="flex items-center gap-2">
          <Link href="/golf/create" className="btn-secondary text-sm py-2 px-4">⛳ Masters pool</Link>
          <Link href="/create" className="btn-primary text-sm py-2 px-4">Create a pool</Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-3 sm:px-6 py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-felt/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto stagger">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/15 text-pending mb-6">🎉 Private prediction markets for your group</div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-ink leading-tight mb-6"><span className="whitespace-nowrap">Make any occasion</span><br /><span className="text-felt">worth predicting.</span></h1>
          <p className="text-muted text-lg leading-relaxed mb-10 max-w-lg mx-auto">Create a private prediction hub for your wedding, birthday, work launch — anything. Share one link. Everyone picks. One person wins the bragging rights.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create" className="btn-primary px-8 py-4 text-base">Create your pool →</Link>
            <a href="#how-it-works" className="btn-secondary px-8 py-4 text-base">See how it works</a>
          </div>
        </div>
      </section>

      <section className="py-14 px-6 border-t border-border bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="label text-center mb-8">Works for any occasion</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger">
            {[
              { emoji: "💍", label: "Weddings" },
              { emoji: "🏈", label: "Game day" },
              { emoji: "✈️", label: "Group trips" },
              { emoji: "🎬", label: "Show finales" },
              { emoji: "🏆", label: "Tournaments" },
              { emoji: "🎂", label: "Birthdays" },
              { emoji: "🏅", label: "Award shows" },
              { emoji: "🎲", label: "Anything else" },
            ].map(({ emoji, label }) => (
              <div key={label} className="card p-4 flex flex-col items-center gap-2 fade-up">
                <span className="text-3xl">{emoji}</span>
                <span className="text-sm font-medium text-ink">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-6 bg-white border-t border-border">
        <div className="max-w-4xl mx-auto">
          <p className="label text-center mb-3">How it works</p>
          <h2 className="font-display text-3xl font-bold text-center text-ink mb-14">One pool per occasion. Infinite replayability.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 stagger">
            {[
              { step: "01", title: "Create a pool", body: "Pick your occasion — a wedding, a game, a trip. Name it and share the link with your crew." },
              { step: "02", title: "Add markets", body: "Drop in your predictions. Will they cry? Who wins? What's the final score? Each question is a market." },
              { step: "03", title: "See who called it", body: "Everyone picks before the markets close. Points are awarded when you resolve the outcomes." },
            ].map(({ step, title, body }) => (
              <div key={step} className="card p-7">
                <div className="font-display text-4xl font-bold text-felt/20 mb-4">{step}</div>
                <h3 className="font-display text-xl font-bold text-ink mb-2">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-felt text-chalk text-center">
        <h2 className="font-display text-3xl font-bold mb-4">Got an occasion coming up?</h2>
        <p className="text-chalk/70 mb-8">Free. No account needed. Takes 30 seconds.</p>
        <Link href="/create" className="btn-gold px-10 py-4 text-base">Create your pool →</Link>
      </section>

      <footer className="py-6 text-center text-muted text-xs border-t border-border">Poolside Markets — built for the moments worth predicting</footer>
    </main>
  );
}
