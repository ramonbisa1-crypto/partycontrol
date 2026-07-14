import { useState } from "react";
import {
  Camera,
  Check,
  Copy,
  ExternalLink,
  Home,
  LogOut,
  Music2,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type PublicLink = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
};

export default function Settings() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseUrl = window.location.origin;

  const publicLinks: PublicLink[] = [
    {
      id: "home",
      title: "Öffentliche Startseite",
      description: "Zentrale Seite für alle Gäste.",
      url: `${baseUrl}/?view=home`,
      icon: <Home size={20} />,
    },
    {
      id: "music",
      title: "Musikwünsche",
      description: "Öffentliche Seite für Musikwünsche.",
      url: `${baseUrl}/?view=music`,
      icon: <Music2 size={20} />,
    },
    {
      id: "photos",
      title: "Fotowand",
      description: "Öffentlicher Foto-Upload und Galerie.",
      url: `${baseUrl}/?view=photos`,
      icon: <Camera size={20} />,
    },
  ];

  async function copyLink(link: PublicLink) {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch {
      alert("Link konnte nicht kopiert werden.");
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mb-8">
        <p className="mb-2 font-semibold text-yellow-400">
          System
        </p>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Einstellungen
        </h1>

        <p className="mt-2 text-zinc-400">
          Öffentliche Links und Account verwalten.
        </p>
      </div>

      <section className="mb-7 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
        <h2 className="text-2xl font-black">
          Öffentliche Party-Seiten
        </h2>

        <p className="mt-2 text-zinc-500">
          Diese Seiten funktionieren ohne Login und können als QR-Code
          geteilt werden.
        </p>

        <div className="mt-6 space-y-4">
          {publicLinks.map((link) => (
            <div
              key={link.id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 lg:flex-row lg:items-center"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                {link.icon}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {link.title}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {link.description}
                </p>

                <p className="mt-2 truncate font-mono text-xs text-zinc-600">
                  {link.url}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => copyLink(link)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 font-bold transition hover:border-yellow-400 hover:text-yellow-400"
                >
                  {copiedId === link.id ? (
                    <>
                      <Check size={18} />
                      Kopiert
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Kopieren
                    </>
                  )}
                </button>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black transition hover:bg-yellow-300"
                >
                  <ExternalLink size={18} />
                  Öffnen
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
        <h2 className="text-2xl font-black">
          Account
        </h2>

        <p className="mt-2 text-zinc-500">
          Melde dich ab, wenn du das Gerät wechselst oder PartyControl nicht
          mehr verwendest.
        </p>

        <button
          type="button"
          onClick={logout}
          className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-400"
        >
          <LogOut size={19} />
          Logout
        </button>
      </section>
    </div>
  );
}