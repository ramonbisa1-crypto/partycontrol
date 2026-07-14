import {
  ArrowRight,
  Camera,
  Clock3,
  MapPin,
  Music2,
  PartyPopper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function PublicHome() {
  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-zinc-900 bg-black/90 px-4 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <PartyPopper size={23} />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Birthday Party
            </h1>

            <p className="text-sm text-zinc-500">
              Offizielle Party-Seite
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 px-5 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-yellow-400/5 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-400">
              <Sparkles size={16} />
              Oktober · Birthday Party
            </div>

            <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Willkommen auf unserer
              <span className="block text-yellow-400">
                Party-Plattform
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Reiche Musikwünsche ein, teile deine besten Fotos und finde alle
              wichtigen Informationen für den Abend.
            </p>
          </div>
        </section>

        <section className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
          <PublicFeatureCard
            href={`${baseUrl}/?view=music`}
            icon={<Music2 size={27} />}
            eyebrow="DJ & Musik"
            title="Musikwunsch einreichen"
            description="Wünsche dir einen Song oder unterstütze bereits eingereichte Wünsche mit einem Like."
          />

          <PublicFeatureCard
            href={`${baseUrl}/?view=photos`}
            icon={<Camera size={27} />}
            eyebrow="Live-Galerie"
            title="Foto hochladen"
            description="Teile deine besten Momente. Nach der Freigabe erscheint das Bild auf der Fotowand."
          />
        </section>

        <section className="mt-7 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
          <div className="mb-6">
            <p className="font-semibold text-yellow-400">
              Party-Informationen
            </p>

            <h3 className="mt-1 text-2xl font-black">
              Alles Wichtige auf einen Blick
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoCard
              icon={<Clock3 size={21} />}
              title="Datum und Uhrzeit"
              value="Oktober · genaue Zeit folgt"
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
          <h3 className="text-xl font-black text-yellow-300">
            Wichtig
          </h3>

          <p className="mt-2 max-w-3xl leading-7 text-yellow-100/70">
            Jeder Hauptgast und jede Begleitung besitzt einen eigenen
            QR-Code. Weitergeleitete oder bereits verwendete Tickets werden
            beim Einlass erkannt.
          </p>
        </section>

        <footer className="py-10 text-center">
          <p className="font-bold text-zinc-400">
            PartyControl
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            Event Management System
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
      className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition hover:-translate-y-1 hover:border-yellow-400/50 hover:bg-zinc-900 sm:p-7"
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="text-yellow-400">
        {icon}
      </div>

      <p className="mt-4 text-sm font-semibold text-zinc-500">
        {title}
      </p>

      <p className="mt-1 font-bold">
        {value}
      </p>
    </div>
  );
}