import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  ExternalLink,
  Heart,
  Music2,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastProvider";

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
  const { showToast } = useToast();

  const [requests, setRequests] = useState<MusicRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"Alle" | MusicStatus>("Alle");

  const [requestToDelete, setRequestToDelete] =
    useState<MusicRequest | null>(null);

  const [deleting, setDeleting] = useState(false);

  async function loadRequests(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const { data, error } = await supabase
      .from("music_requests")
      .select("*")
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      showToast({
        type: "error",
        title: "Musikwünsche konnten nicht geladen werden",
        message: error.message,
      });

      setLoading(false);
      setRefreshing(false);
      return;
    }

    setRequests((data ?? []) as MusicRequest[]);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadRequests(true);

    const channel = supabase
      .channel("professional-admin-music")
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

  async function updateStatus(
    request: MusicRequest,
    status: MusicStatus
  ) {
    const { error } = await supabase
      .from("music_requests")
      .update({
        status,
      })
      .eq("id", request.id);

    if (error) {
      showToast({
        type: "error",
        title: "Status konnte nicht geändert werden",
        message: error.message,
      });

      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status,
            }
          : item
      )
    );

    showToast({
      type: "success",
      title: "Status aktualisiert",
      message: `${request.song_title} ist jetzt "${status}".`,
    });
  }

  async function deleteRequest() {
    if (!requestToDelete) {
      return;
    }

    setDeleting(true);

    const { error } = await supabase
      .from("music_requests")
      .delete()
      .eq("id", requestToDelete.id);

    if (error) {
      showToast({
        type: "error",
        title: "Musikwunsch konnte nicht gelöscht werden",
        message: error.message,
      });

      setDeleting(false);
      return;
    }

    showToast({
      type: "success",
      title: "Musikwunsch gelöscht",
      message: `${requestToDelete.song_title} wurde entfernt.`,
    });

    setRequests((currentRequests) =>
      currentRequests.filter(
        (request) => request.id !== requestToDelete.id
      )
    );

    setRequestToDelete(null);
    setDeleting(false);
  }

  const filteredRequests = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !cleanSearch ||
        request.song_title
          .toLowerCase()
          .includes(cleanSearch) ||
        request.artist
          ?.toLowerCase()
          .includes(cleanSearch) ||
        request.guest_name
          .toLowerCase()
          .includes(cleanSearch);

      const matchesStatus =
        statusFilter === "Alle" ||
        request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const statistics = useMemo(() => {
    return {
      total: requests.length,
      new: requests.filter(
        (request) => request.status === "Neu"
      ).length,
      planned: requests.filter(
        (request) => request.status === "Geplant"
      ).length,
      played: requests.filter(
        (request) => request.status === "Gespielt"
      ).length,
    };
  }, [requests]);

  const publicLink = `${window.location.origin}/?view=music`;

  if (loading) {
    return (
      <LoadingState
        title="Musikwünsche werden geladen"
        description="Die aktuelle Wunschliste wird vorbereitet."
      />
    );
  }

  return (
    <div className="page-enter p-4 sm:p-6 lg:p-10">
      <PageHeader
        eyebrow="Party-Musik"
        title="Musikwünsche"
        description="Verwalte die Wünsche der Gäste und bereite die Playlist für den DJ vor."
        actions={
          <>
            <a
              href={publicLink}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                icon={<ExternalLink size={18} />}
              >
                Gastseite öffnen
              </Button>
            </a>

            <Button
              variant="secondary"
              icon={<RefreshCcw size={18} />}
              loading={refreshing}
              onClick={() => loadRequests()}
            >
              Aktualisieren
            </Button>
          </>
        }
      />

      <section className="mb-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard
          title="Total"
          value={statistics.total}
          variant="neutral"
        />

        <SummaryCard
          title="Neu"
          value={statistics.new}
          variant="info"
        />

        <SummaryCard
          title="Geplant"
          value={statistics.planned}
          variant="warning"
        />

        <SummaryCard
          title="Gespielt"
          value={statistics.played}
          variant="success"
        />
      </section>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-zinc-800 p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Music2
                className="text-yellow-400"
                size={22}
              />

              <h2 className="text-xl font-black sm:text-2xl">
                Wunschliste
              </h2>
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              {filteredRequests.length} von {requests.length} Wünschen
              angezeigt
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                size={18}
              />

              <input
                className="app-input pl-11 sm:w-80"
                placeholder="Song, Interpret oder Gast..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              className="app-input"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "Alle"
                    | MusicStatus
                )
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

        {filteredRequests.length === 0 ? (
          <div className="p-5 sm:p-7">
            <EmptyState
              icon={<Music2 size={29} />}
              title="Keine Musikwünsche gefunden"
              description="Passe die Suche oder den Filter an."
            />
          </div>
        ) : (
          <div className="space-y-4 p-4 sm:p-5">
            {filteredRequests.map((request, index) => (
              <article
                key={request.id}
                className="rounded-3xl border border-zinc-800 bg-black/20 p-4 transition hover:border-zinc-700 hover:bg-zinc-900 sm:p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 font-black text-yellow-400">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="truncate text-lg font-black">
                          {request.song_title}
                        </h3>

                        <StatusBadge
                          status={request.status}
                        />

                        <Badge variant="neutral">
                          <Heart
                            size={13}
                            className="mr-1"
                          />
                          {request.likes}
                        </Badge>
                      </div>

                      <p className="mt-1 text-zinc-400">
                        {request.artist ||
                          "Interpret nicht angegeben"}
                      </p>

                      <p className="mt-2 text-sm text-zinc-500">
                        Gewünscht von{" "}
                        <span className="font-semibold text-zinc-300">
                          {request.guest_name}
                        </span>
                        {" · "}
                        {formatDateTime(
                          request.created_at
                        )}
                      </p>

                      {request.note && (
                        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                            Nachricht an den DJ
                          </p>

                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            {request.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:max-w-md xl:justify-end">
                    <Button
                      size="small"
                      variant="secondary"
                      icon={<Clock3 size={17} />}
                      onClick={() =>
                        updateStatus(
                          request,
                          "Geplant"
                        )
                      }
                    >
                      Planen
                    </Button>

                    <Button
                      size="small"
                      variant="success"
                      icon={<Check size={17} />}
                      onClick={() =>
                        updateStatus(
                          request,
                          "Gespielt"
                        )
                      }
                    >
                      Gespielt
                    </Button>

                    <Button
                      size="small"
                      variant="secondary"
                      icon={<X size={17} />}
                      onClick={() =>
                        updateStatus(
                          request,
                          "Abgelehnt"
                        )
                      }
                    >
                      Ablehnen
                    </Button>

                    <Button
                      size="small"
                      variant="danger"
                      icon={<Trash2 size={17} />}
                      onClick={() =>
                        setRequestToDelete(request)
                      }
                    >
                      Löschen
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={requestToDelete !== null}
        title="Musikwunsch löschen?"
        description={
          requestToDelete
            ? `${requestToDelete.song_title} wird dauerhaft aus der Wunschliste entfernt.`
            : ""
        }
        confirmLabel="Musikwunsch löschen"
        dangerous
        loading={deleting}
        onConfirm={deleteRequest}
        onCancel={() => {
          if (!deleting) {
            setRequestToDelete(null);
          }
        }}
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  variant,
}: {
  title: string;
  value: number;
  variant:
    | "neutral"
    | "info"
    | "warning"
    | "success";
}) {
  const styles = {
    neutral: "bg-zinc-800 text-zinc-300",
    info: "bg-blue-500/10 text-blue-400",
    warning: "bg-yellow-400/10 text-yellow-400",
    success: "bg-green-500/10 text-green-400",
  };

  return (
    <Card hover padding="small">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[variant]}`}
      >
        <Music2 size={21} />
      </div>

      <p className="mt-4 text-sm font-semibold text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black">
        {value}
      </p>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: MusicStatus;
}) {
  if (status === "Neu") {
    return <Badge variant="info">Neu</Badge>;
  }

  if (status === "Geplant") {
    return <Badge variant="warning">Geplant</Badge>;
  }

  if (status === "Gespielt") {
    return <Badge variant="success">Gespielt</Badge>;
  }

  return <Badge variant="danger">Abgelehnt</Badge>;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}