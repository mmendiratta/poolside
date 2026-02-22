import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-chalk flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <span className="font-display text-xl font-bold text-ink tracking-tight">
          Pool<span className="text-felt">Side</span>
        </span>
        <Link href="/create" className="btn-primary text-sm py-2 px-4">
          Create Event
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        {/* Background felt circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-felt/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto stagger">
          <div className="tag bg-gold/15 text-pending mb-6 mx-auto w-fit">
            🎉 Prediction pools for anything
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold text-ink leading-tight mb-6">
            Make any occasion
            <br />
            <span className="text-felt">worth predicting.</span>
          </h1>

          <p className="text-muted text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            Create a private prediction hub for your wedding, birthday, work
            launch — anything. Share one link. Everyone picks. One person wins
            the bragging rights.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create" className="btn-primary px-8 py-4 text-base">
              Create your event →
            </Link>
            <a href="#how-it-works" className="btn-secondary px-8 py-4 text-base">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-white border-t border-border">
        <div className="max-w-4xl mx-auto">
          <p className="label text-center mb-3">How it works</p>
          <h2 className="font-display text-3xl font-bold text-center text-ink mb-14">
            Three steps to settled debates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 stagger">
            {[
              {
                step: "01",
                title: "Create your event",
                body: "Name your event and add prediction pools — questions with multiple choice or numeric answers.",
              },
              {
                step: "02",
                title: "Share the link",
                body: "One URL. Anyone with it can join with just their name. No accounts, no friction.",
              },
              {
                step: "03",
                title: "Resolve & settle",
                body: "After the event, mark the winners. The leaderboard updates instantly. Venmo the winner.",
              },
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

      {/* Example pool types */}
      <section className="py-20 px-6 bg-chalk">
        <div className="max-w-4xl mx-auto">
          <p className="label text-center mb-3">Ideas to get started</p>
          <h2 className="font-display text-3xl font-bold text-center text-ink mb-12">
            Predict anything
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger">
            {[
              { emoji: "💍", label: "Weddings", example: "How long will the vows be?" },
              { emoji: "🍼", label: "Baby Showers", example: "What will the birth weight be?" },
              { emoji: "🚀", label: "Work Launches", example: "Will we hit 1k users in week 1?" },
              { emoji: "🏆", label: "Sports", example: "Final score? Who scores first?" },
              { emoji: "🎬", label: "Awards Shows", example: "Who wins Best Picture?" },
              { emoji: "🎂", label: "Birthdays", example: "What time will the cake come out?" },
              { emoji: "🗺️", label: "Road Trips", example: "How many gas stops?" },
              { emoji: "📺", label: "Reality TV", example: "Who gets eliminated next?" },
            ].map(({ emoji, label, example }) => (
              <div
                key={label}
                className="card p-5 flex flex-col gap-2 hover:shadow-card-hover transition-shadow duration-300 cursor-default"
              >
                <span className="text-2xl">{emoji}</span>
                <span className="font-semibold text-sm text-ink">{label}</span>
                <span className="text-xs text-muted leading-relaxed">{example}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 bg-felt text-chalk text-center">
        <h2 className="font-display text-3xl font-bold mb-4">
          Ready to make it interesting?
        </h2>
        <p className="text-chalk/70 mb-8">Free. No account needed to join.</p>
        <Link href="/create" className="btn-gold px-10 py-4 text-base">
          Create your event →
        </Link>
      </section>

      <footer className="py-6 text-center text-muted text-xs border-t border-border">
        PoolSide — built for the moments worth betting on
      </footer>
    </main>
  );
}
