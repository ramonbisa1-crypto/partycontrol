import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  ExternalLink,
  Heart,
  Music2,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type MusicStatus = "Neu" | "Geplant" | "Gespielt" | "Abgelehnt";

type MusicRequest = {
  id: string;
  guest_name: string;
  song_title: string;
  artist: string | null;
  note: string | null;
  status: MusicStatus;
  likes: number;
  created_at: string;
};

export default function Music() {
  const [requests, setRequests] = useState<MusicRequest[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Alle" | MusicStatus>("Alle");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadRequests(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("music_requests")
      .select("*")
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setRequests(data ?? []);
    setErrorMessage("");
    setLoading(false);
  }

  useEffect(() => {
    loadRequests(true);

    const channel = supabase
      .channel("admin-music-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "music_requests",
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateStatus(id: string, status: MusicStatus) {
    const { error } = await supabase
      .from("music_requests")
      .update({
        status,
      })
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
            }
          : request
      )
    );
  }

  async function deleteRequest(id: string) {
    const confirmed = confirm("Diesen Musikwunsch wirklich löschen?");

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("music_requests")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.filter((request) => request.id !== id)
    );
  }

  const filteredRequests = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !cleanSearch ||
        request.song_title.toLowerCase().includes(cleanSearch) ||
        request.artist?.toLowerCase().includes(cleanSearch) ||
        request.guest_name.toLowerCase().includes(cleanSearch);

      const matchesStatus =
        statusFilter === "Alle" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const publicLink = `${window.location.origin}/?view=music`;

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 font-semibold text-yellow-400">
            Party-Musik
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Musikwünsche
          </h1>

          <p className="mt-2 text-zinc-400">
            Wünsche verwalten und für den DJ vorbereiten.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={publicLink}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300"
          >
            <ExternalLink size={18} />
            Gastseite öffnen
          </a>

          <button
            type="button"
            onClick={() => loadRequests(true)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 font-bold transition hover:bg-zinc-900"
          >
            <RefreshCcw size={18} />
            Aktualisieren
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatusCard
          title="Neu"
          value={requests.filter((request) => request.status === "Neu").length}
        />

        <StatusCard
          title="Geplant"
          value={
            requests.filter((request) => request.status === "Geplant").length
          }
        />

        <StatusCard
          title="Gespielt"
          value={
            requests.filter((request) => request.status === "Gespielt").length
          }
        />

        <StatusCard
          title="Total"
          value={requests.length}
        />
      </div>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950">
        <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Music2 className="text-yellow-400" size={22} />

            <div>
              <h2 className="text-xl font-bold">
                Wunschliste
              </h2>

              <p className="text-sm text-zinc-500">
                {filteredRequests.length} Einträge angezeigt
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 outline-none focus:border-yellow-400 sm:w-72"
              placeholder="Song, Interpret oder Gast..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 outline-none focus:border-yellow-400"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "Alle" | MusicStatus)
              }
            >
              <option value="Alle">Alle Status</option>
              <option value="Neu">Neu</option>
              <option value="Geplant">Geplant</option>
              <option value="Gespielt">Gespielt</option>
              <option value="Abgelehnt">Abgelehnt</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {loading && (
            <div className="py-12 text-center text-zinc-500">
              Musikwünsche werden geladen...
            </div>
          )}

          {!loading &&
            filteredRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black">
                        {request.song_title}
                      </h3>

                      <StatusBadge status={request.status} />

                      <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                        <Heart size={14} />
                        {request.likes}
                      </span>
                    </div>

                    <p className="mt-1 text-zinc-400">
                      {request.artist || "Interpret nicht angegeben"}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Gewünscht von {request.guest_name} ·{" "}
                      {new Date(request.created_at).toLocaleString("de-CH", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {request.note && (
                      <p className="mt-3 rounded-xl bg-zinc-950 p-3 text-sm text-zinc-400">
                        {request.note}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
                    <ActionButton
                      label="Planen"
                      icon={<Clock3 size={17} />}
                      onClick={() => updateStatus(request.id, "Geplant")}
                    />

                    <ActionButton
                      label="Gespielt"
                      icon={<Check size={17} />}
                      onClick={() => updateStatus(request.id, "Gespielt")}
                    />

                    <ActionButton
                      label="Ablehnen"
                      icon={<X size={17} />}
                      onClick={() => updateStatus(request.id, "Abgelehnt")}
                    />

                    <button
                      type="button"
                      onClick={() => deleteRequest(request.id)}
                      className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={17} />
                      Löschen
                    </button>
                  </div>
                </div>
              </article>
            ))}

          {!loading && filteredRequests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
              Keine passenden Musikwünsche gefunden.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: MusicStatus;
}) {
  const styles: Record<MusicStatus, string> = {
    Neu: "bg-blue-500/10 text-blue-300",
    Geplant: "bg-yellow-500/10 text-yellow-300",
    Gespielt: "bg-green-500/10 text-green-300",
    Abgelehnt: "bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-bold text-zinc-300 transition hover:border-yellow-400 hover:text-yellow-400"
    >
      {icon}
      {label}
    </button>
  );
}