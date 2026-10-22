import Link from 'next/link'

export default function Home() {
return (
<main className="min-h-screen bg-[#070b16] text-white">
<header className="border-b border-white/10 bg-[#090f20]">
<div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
<Link href="/" className="flex items-center gap-3">
<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-2xl font-black shadow-lg shadow-blue-900/30">
B
</div>
<div>
<p className="text-lg font-extrabold tracking-wide text-white">
BESTWAY
</p>
<p className="text-xs font-bold tracking-[0.25em] text-blue-400">
LOGISTICS
</p>
</div>
</Link>

      <Link
        href="/admin/login"
        className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-blue-400 hover:text-white"
      >
        Admin Login
      </Link>
    </div>
  </header>

  <section className="relative overflow-hidden">
    <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
    <div className="pointer-events-none absolute -right-32 top-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />

    <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          Your shipment, tracked with clarity
        </div>

        <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Every shipment.
          <span className="block text-blue-400">
            Every step.
          </span>
        </h1>

        <p className="mt-6 max-w-lg text-base leading-8 text-slate-400 sm:text-lg">
          Follow your delivery journey with shipment status updates,
          location details, and estimated delivery information in one
          convenient place.
        </p>

        <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-300">
          <span className="flex items-center gap-2">
            <span className="text-blue-400">✓</span>
            Simple tracking
          </span>
          <span className="flex items-center gap-2">
            <span className="text-blue-400">✓</span>
            Delivery updates
          </span>
          <span className="flex items-center gap-2">
            <span className="text-blue-400">✓</span>
            Shipment history
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" />
            <path d="M3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5M12 12v9" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold">Track your shipment</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter the tracking number provided to you to view the latest
          available shipment details.
        </p>

        <form action="/track" method="get" className="mt-7 space-y-4">
          <label
            htmlFor="tracking-number"
            className="block text-sm font-semibold text-slate-200"
          >
            Tracking number
          </label>

          <input
            id="tracking-number"
            name="number"
            placeholder="e.g. BW100006"
            required
            autoComplete="off"
            className="w-full rounded-xl border border-white/15 bg-[#090f20] px-4 py-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#101625]"
          >
            Track Shipment
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Please check your tracking number and try again if your shipment
          cannot be found.
        </p>
      </div>
    </div>
  </section>

  <section className="border-t border-white/10 bg-[#090f20]">
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-3">
      <div>
        <p className="font-bold text-white">Shipment visibility</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          View the recorded status and current location of your shipment.
        </p>
      </div>
      <div>
        <p className="font-bold text-white">Delivery estimates</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Check the estimated delivery date when one is available.
        </p>
      </div>
      <div>
        <p className="font-bold text-white">Tracking history</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Review available updates recorded along the shipment journey.
        </p>
      </div>
    </div>
  </section>

  <footer className="border-t border-white/10 px-5 py-6 text-center text-sm text-slate-500">
    © {new Date().getFullYear()} Bestway Logistics. All rights reserved.
  </footer>
</main>

)
}