import type { Metadata } from "next";
import Link from "next/link";

const quickLinks = [
  { title: "Browse products", description: "See what’s in stock right now", href: "/products" },
  { title: "Shop by categories", description: "Jump into a curated collection", href: "/catalogues" },
  { title: "View your cart", description: "Pick up where you left off", href: "/cart" },
  { title: "Manage your account", description: "Profile, orders, addresses & more", href: "/account" },
];

const troubleshooting = [
  "Double-check the link — even one character can throw things off.",
  "If someone shared this link, ask them to resend it to be sure it’s current.",
  "Still stuck? Let us know so we can fix the trail for everyone.",
];

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <section className="relative isolate mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-10 px-6 py-16 text-zinc-900 sm:px-8 lg:px-10">
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-[2.5rem] bg-white/80 shadow-[0_25px_120px_rgba(15,15,15,0.08)] ring-1 ring-black/5" />
      <div className="absolute inset-x-28 top-16 -z-10 h-40 rounded-full bg-gradient-to-br from-black/10 via-zinc-900/5 to-transparent blur-3xl" />
      <div className="space-y-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.6em] text-zinc-500">
          Smart redirect engaged
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
          The cloud you were chasing just drifted away.
        </h1>
        <p className="mx-auto max-w-3xl text-base text-zinc-600 sm:text-lg">
          We routed you here because the link you followed doesn’t point to anything live right now.
          Try one of the curated paths below to get back in flow.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Return home
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/catalogues"
            className="inline-flex items-center rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:border-black hover:text-black"
          >
            Discover collections
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-3xl border border-zinc-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-semibold text-zinc-500">Popular destinations</p>
          <ul className="space-y-4">
            {quickLinks.map(link => (
              <li key={link.href} className="rounded-2xl border border-transparent transition hover:border-zinc-200 hover:bg-zinc-50">
                <Link href={link.href} className="group flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-base font-semibold">{link.title}</p>
                    <p className="text-sm text-zinc-500">{link.description}</p>
                  </div>
                  <span aria-hidden className="text-2xl text-zinc-300 transition group-hover:translate-x-1 group-hover:text-black">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5 rounded-3xl border border-zinc-100 bg-zinc-950/95 p-6 text-white shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">Need a human?</p>
            <h2 className="mt-2 text-2xl font-semibold">We can nudge you in the right direction.</h2>
            <p className="mt-1 text-sm text-zinc-300">
              Send the broken link or describe what you were trying to open.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-zinc-400">Troubleshooting hints</p>
            <ul className="mt-3 space-y-2">
              {troubleshooting.map(tip => (
                <li key={tip} className="flex gap-2">
                  <span aria-hidden className="text-zinc-500">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
          >
            Message support via your account →
          </Link>
        </div>
      </div>
    </section>
  );
}

