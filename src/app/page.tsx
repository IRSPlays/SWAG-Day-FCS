import Link from "next/link";

const routes = [
  { href: "/preview", name: "PREVIEW", desc: "Reference deck · motion sandbox", status: "LIVE NOW", live: true },
  { href: "/stage", name: "STAGE", desc: "Projector / LED wall output", status: "BUILD 03", live: false },
  { href: "/controller", name: "CONTROLLER", desc: "Deck pilot + audio mixer", status: "BUILD 04–05", live: false },
  { href: "/editor", name: "EDITOR", desc: "Quick-edit slides, live", status: "BUILD 06", live: false },
  { href: "/audience", name: "AUDIENCE", desc: "Phones: reactions · votes · survey", status: "BUILD 07", live: false },
  { href: "/camera", name: "CAMERA", desc: "Phone → stage video link", status: "BUILD 08", live: false },
  { href: "/report", name: "REPORT", desc: "Post-event analytics", status: "BUILD 09", live: false },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-court text-ice">
      {/* textures */}
      <div className="bg-lanes pointer-events-none absolute inset-0" />
      <div className="bg-noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />

      {/* header strip */}
      <div className="relative z-10 flex items-center justify-between border-b-2 border-ice/10 px-8 py-5">
        <span className="font-body text-sm font-bold tracking-[0.4em] text-ice/60">
          STAGE PRODUCTION SYSTEM
        </span>
        <span className="font-body text-sm font-bold tracking-[0.4em] text-volt">
          SUIT UP! SHOW UP! SPORT IT UP!
        </span>
      </div>

      {/* poster */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 py-14 md:px-16">
        <p className="font-body text-lg font-bold tracking-[0.5em] text-mag">
          SWAG DAY PRESENTS
        </p>
        <h1 className="mt-6 font-display text-7xl uppercase leading-[0.85] md:text-[9rem]">
          SWAG DAY
          <span className="block text-volt">FS</span>
        </h1>
        <p className="mt-8 max-w-xl font-serifit text-3xl italic text-vio">
          suit up. show up. sport it up. — teachers&apos; day under the lights.
        </p>

        {/* route grid */}
        <div className="mt-14 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r) =>
            r.live ? (
              <Link
                key={r.name}
                href={r.href}
                className="group border-2 border-volt bg-volt p-5 text-court transition-transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl uppercase">{r.name}</span>
                  <span className="font-body text-[11px] font-bold tracking-[0.25em]">{r.status}</span>
                </div>
                <p className="mt-2 font-body text-sm font-medium">{r.desc} — enter →</p>
              </Link>
            ) : (
              <div key={r.name} className="border-2 border-ice/15 p-5 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl uppercase">{r.name}</span>
                  <span className="font-body text-[11px] font-bold tracking-[0.25em] text-ice/50">
                    {r.status}
                  </span>
                </div>
                <p className="mt-2 font-body text-sm font-medium text-ice/70">{r.desc}</p>
              </div>
            )
          )}
        </div>
      </div>

      <div className="relative z-10 border-t-2 border-ice/10 px-8 py-4">
        <p className="font-body text-xs tracking-[0.3em] text-ice/40">
          SLIDES = CONTENT FILES · TRANSITIONS &amp; ANIMATIONS = SEPARATE FILES · EDIT ANYTHING LIVE
        </p>
      </div>
    </main>
  );
}
