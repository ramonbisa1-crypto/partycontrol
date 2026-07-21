import { useState } from "react";
import {
  LockKeyhole,
  Mail,
  PartyPopper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import Button from "../components/ui/Button";
import { useToast } from "../components/ui/ToastProvider";

export default function Login() {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      showToast({
        type: "warning",
        title: "Login-Daten fehlen",
        message: "Bitte gib deine E-Mail-Adresse und dein Passwort ein.",
      });

      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      showToast({
        type: "error",
        title: "Login fehlgeschlagen",
        message: "E-Mail-Adresse oder Passwort ist nicht korrekt.",
      });

      setLoading(false);
      return;
    }

    showToast({
      type: "success",
      title: "Willkommen zurück",
      message: "Du wirst jetzt bei PartyControl angemeldet.",
    });

    setLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-yellow-400/8 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[36rem] w-[36rem] rounded-full bg-yellow-400/5 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between border-r border-zinc-900 p-10 lg:flex xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/10">
              <PartyPopper size={23} />
            </div>

            <div>
              <p className="text-xl font-black tracking-tight">
                PartyControl
              </p>

              <p className="text-sm text-zinc-500">
                Event Management
              </p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-400">
              <Sparkles size={16} />
              Birthday Party · 16. Oktober 2026
            </div>

            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight xl:text-6xl">
              Alles für eure Party
              <span className="block text-yellow-400">
                an einem Ort.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
              Gäste verwalten, QR-Tickets scannen, Musikwünsche koordinieren
              und die Fotowand moderieren.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FeatureCard
                icon={<ShieldCheck size={20} />}
                title="Sicher"
              />

              <FeatureCard
                icon={<Sparkles size={20} />}
                title="Live"
              />

              <FeatureCard
                icon={<PartyPopper size={20} />}
                title="Einfach"
              />
            </div>
          </div>

          <p className="text-sm text-zinc-600">
            PartyControl · Private Event Management Platform
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                <PartyPopper size={23} />
              </div>

              <div>
                <p className="text-xl font-black">
                  PartyControl
                </p>

                <p className="text-sm text-zinc-500">
                  Event Management
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div>
                <p className="font-semibold text-yellow-400">
                  Admin-Bereich
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight">
                  Willkommen zurück
                </h2>

                <p className="mt-2 leading-7 text-zinc-500">
                  Melde dich an, um PartyControl zu verwalten.
                </p>
              </div>

              <form
                className="mt-7 space-y-5"
                onSubmit={login}
              >
                <div>
                  <label className="app-label">
                    E-Mail-Adresse
                  </label>

                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                      size={18}
                    />

                    <input
                      className="app-input pl-11"
                      type="email"
                      autoComplete="email"
                      placeholder="name@beispiel.ch"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="app-label">
                    Passwort
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                      size={18}
                    />

                    <input
                      className="app-input pl-11"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Passwort"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="large"
                  loading={loading}
                >
                  Anmelden
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 shrink-0 text-green-400"
                    size={19}
                  />

                  <p className="text-sm leading-6 text-zinc-500">
                    Dieser Bereich ist nur für das PartyControl-Team
                    zugänglich.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-700">
              Birthday Party · 16. Oktober 2026
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/20 p-4">
      <div className="text-yellow-400">
        {icon}
      </div>

      <p className="font-black text-zinc-300">
        {title}
      </p>
    </div>
  );
}