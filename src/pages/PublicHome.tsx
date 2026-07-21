import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Clock3,
  MapPin,
  Music2,
  PartyPopper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const partyDate = new Date("2026-10-16T19:00:00+02:00");

export default function PublicHome() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const baseUrl = window.location.origin;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const countdown = useMemo(() => {
    const difference = partyDate.getTime() - currentTime.getTime();

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        started: true,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      started: false,
    };
  }, [currentTime]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-zinc-900 bg-black/85 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/10">
              <PartyPopper size={23} />
            </div>

            <div>
              <p className="text-xl font-black tracking-tight sm:text-2xl">
                Birthday Party
              </p>

              <p className="text-sm text-zinc-500">
                16. Oktober 2026
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            PartyControl online
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 px-5 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-yellow-400/5 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-10 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-400">
                <Sparkles size={16} />
                16. Oktober 2026
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Willkommen auf unserer
                <span className="block text-yellow-400">
                  Party-Plattform
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                Hier findest du alles für den Abend: Musikwünsche, Fotowand
                und wichtige Informationen zur Party.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`${baseUrl}/?view=music`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-black text-black transition hover:bg-yellow-300"
                >
                  <Music2 size={19} />
                  Musikwunsch einreichen
                </a>

                <a
                  href={`${baseUrl}/?view=photos`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-black text-white transition hover:border-zinc-600 hover:bg-zinc-800"
                >
                  <Camera size={19} />
                  Fotowand öffnen
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-black/30 p-5 sm:p-7">
              <p className="text-sm font-bold uppercase tracking-wider text-yellow-400">
                Countdown
              </p>

              <h2 className="mt-2 text-2xl font-black">
                {countdown.started
                  ? "Die Party läuft"
                  : "Bis zur Party"}
              </h2>

              {!countdown.started ? (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
                  <CountdownUnit
                    value={countdown.days}
                    label="Tage"
                  />

                  <CountdownUnit
                    value={countdown.hours}
                    label="Stunden"
                  />

                  <CountdownUnit
                    value={countdown.minutes}
                    label="Minuten"
                  />

                  <CountdownUnit
                    value={countdown.seconds}
                    label="Sekunden"
                  />
                </div>
              ) : (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-green-400" />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                      Live
                    </p>

                    <p className="font-black text-green-200">
                      Viel Spass auf der Party
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
          <PublicFeatureCard
            href={`${baseUrl}/?view=music`}
            icon={<Music2 size={28} />}
            eyebrow="DJ & Musik"
            title="Musikwünsche"
            description="Wünsche dir deinen Lieblingssong oder unterstütze bereits eingereichte Wünsche mit einem Like."
          />

          <PublicFeatureCard
            href={`${baseUrl}/?view=photos`}
            icon={<Camera size={28} />}
            eyebrow="Live-Galerie"
            title="Fotowand"
            description="Lade deine besten Party-Momente hoch und entdecke die freigegebenen Bilder der Gäste."
          />
        </section>

        <section className="mt-7 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
          <div className="mb-6">
            <p className="font-semibold text-yellow-400">
              Party-Informationen
            </p>

            <h2 className="mt-1 text-2xl font-black sm:text-3xl">
              Alles Wichtige auf einen Blick
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              icon={<CalendarDays size={21} />}
              title="Datum"
              value="Freitag, 16. Oktober 2026"
            />

            <InfoCard
              icon={<Clock3 size={21} />}
              title="Startzeit"
              value="19:00 Uhr"
            />

            <InfoCard
              icon={<MapPin size={21} />}
              title="Location"
              value="Adresse folgt"
            />

            <InfoCard
              icon={<ShieldCheck size={21} />}
              title="Einlass"
              value="Persönlichen QR-Code bereithalten"
            />
          </div>
        </section>

        <section className="mt-7 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h3 className="text-xl font-black text-yellow-200">
                Dein persönliches Ticket
              </h3>

              <p className="mt-2 max-w-3xl leading-7 text-yellow-100/70">
                Jeder Hauptgast und jede Begleitung besitzt einen eigenen
                QR-Code. Bereits verwendete oder ungültige Tickets werden beim
                Einlass erkannt.
              </p>
            </div>
          </div>
        </section>

        <footer className="py-10 text-center">
          <p className="font-black text-zinc-400">
            PartyControl
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            Birthday Party · 16. Oktober 2026
          </p>
        </footer>
      </main>
    </div>
  );
}

function PublicFeatureCard({
  href,
  icon,
  eyebrow,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition hover:-translate-y-1 hover:border-yellow-400/40 hover:bg-zinc-900 sm:p-7"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400 transition group-hover:bg-yellow-400 group-hover:text-black">
        {icon}
      </div>

      <p className="mt-6 text-sm font-bold text-yellow-400">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-2xl font-black">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-zinc-400">
        {description}
      </p>

      <div className="mt-6 flex items-center gap-2 font-bold text-white">
        Öffnen
        <ArrowRight
          className="transition group-hover:translate-x-1"
          size={19}
        />
      </div>
    </a>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/20 p-5">
      <div className="text-yellow-400">
        {icon}
      </div>

      <p className="mt-4 text-sm font-semibold text-zinc-500">
        {title}
      </p>

      <p className="mt-2 font-black text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function CountdownUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-center">
      <p className="text-3xl font-black tabular-nums">
        {String(value).padStart(2, "0")}
      </p>

      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
    </div>
  );
}