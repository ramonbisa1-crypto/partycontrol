import { useState } from "react";
import {
  Camera,
  Check,
  Copy,
  ExternalLink,
  Home,
  LogOut,
  Music2,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastProvider";

type PublicLink = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
};

export default function Settings() {
  const { showToast } = useToast();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const baseUrl = window.location.origin;

  const publicLinks: PublicLink[] = [
    {
      id: "home",
      title: "Öffentliche Startseite",
      description: "Zentrale Party-Seite für alle Gäste.",
      url: `${baseUrl}/?view=home`,
      icon: <Home size={20} />,
    },
    {
      id: "music",
      title: "Musikwünsche",
      description: "Öffentliche Seite für Songwünsche und Likes.",
      url: `${baseUrl}/?view=music`,
      icon: <Music2 size={20} />,
    },
    {
      id: "photos",
      title: "Fotowand",
      description: "Öffentlicher Foto-Upload und Live-Galerie.",
      url: `${baseUrl}/?view=photos`,
      icon: <Camera size={20} />,
    },
  ];

  async function copyLink(link: PublicLink) {
    try {
      await navigator.clipboard.writeText(link.url);

      setCopiedId(link.id);

      showToast({
        type: "success",
        title: "Link kopiert",
        message: `${link.title} wurde in die Zwischenablage kopiert.`,
      });

      window.setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch {
      showToast({
        type: "error",
        title: "Link konnte nicht kopiert werden",
        message: "Bitte kopiere die URL manuell.",
      });
    }
  }

  async function logout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      showToast({
        type: "error",
        title: "Logout fehlgeschlagen",
        message: error.message,
      });

      setLoggingOut(false);
    }
  }

  return (
    <div className="page-enter p-4 sm:p-6 lg:p-10">
      <PageHeader
        eyebrow="System"
        title="Einstellungen"
        description="Verwalte öffentliche Links, Eventinformationen und deinen Account."
      />

      <Card className="mb-7" padding="large">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
            <Home size={22} />
          </div>

          <div>
            <h2 className="text-xl font-black sm:text-2xl">
              Öffentliche Party-Seiten
            </h2>

            <p className="text-sm text-zinc-500">
              Diese Seiten funktionieren ohne Login.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {publicLinks.map((link) => (
            <div
              key={link.id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-black/20 p-4 transition hover:border-zinc-700 hover:bg-zinc-900 lg:flex-row lg:items-center"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                {link.icon}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-black">
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
                <Button
                  variant="secondary"
                  icon={
                    copiedId === link.id ? (
                      <Check size={18} />
                    ) : (
                      <Copy size={18} />
                    )
                  }
                  onClick={() => copyLink(link)}
                >
                  {copiedId === link.id
                    ? "Kopiert"
                    : "Kopieren"}
                </Button>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    icon={<ExternalLink size={18} />}
                    fullWidth
                  >
                    Öffnen
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-7" padding="large">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="text-xl font-black sm:text-2xl">
              Eventinformationen
            </h2>

            <p className="text-sm text-zinc-500">
              Aktuelle Konfiguration der Party.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoCard
            title="Datum"
            value="16. Oktober 2026"
          />

          <InfoCard
            title="Startzeit"
            value="Aktuell 19:00 Uhr"
          />

          <InfoCard
            title="Systemstatus"
            value="Online"
          />
        </div>
      </Card>

      <Card padding="large" className="max-w-2xl">
        <h2 className="text-xl font-black sm:text-2xl">
          Account
        </h2>

        <p className="mt-2 leading-7 text-zinc-500">
          Melde dich ab, wenn du PartyControl auf diesem Gerät nicht mehr
          verwendest.
        </p>

        <div className="mt-6">
          <Button
            variant="danger"
            icon={<LogOut size={19} />}
            loading={loggingOut}
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/20 p-5">
      <p className="text-sm font-semibold text-zinc-500">
        {title}
      </p>

      <p className="mt-2 font-black text-zinc-200">
        {value}
      </p>
    </div>
  );
}