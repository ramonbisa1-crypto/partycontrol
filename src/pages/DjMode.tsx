import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Heart,
  ListMusic,
  Music2,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import { useToast } from "../components/ui/ToastProvider";

type MusicStatus =
  | "Neu"
  | "Geplant"
  | "Gespielt"
  | "Abgelehnt";

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

type DjFilter =
  | "Offen"
  | "Neu"
  | "Geplant"
  | "Gespielt"
  | "Alle";

export default function DjMode() {
  const { showToast } = useToast();

  const [requests, setRequests] = useState<
    MusicRequest[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<DjFilter>("Offen");

  async function loadRequests(
    showLoading = false
  ) {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const { data, error } =
      await supabase
        .from("music_requests")
        .select("*")
        .order(
          "likes",
          {
            ascending: false,
          }
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

    if (error) {
      showToast({
        type: "error",
        title:
          "Musikwünsche konnten nicht geladen werden",
        message: error.message,
      });

      setLoading(false);
      setRefreshing(false);
      return;
    }

    setRequests(
      (data ?? []) as MusicRequest[]
    );

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadRequests(true);

    const channel =
      supabase
        .channel(
          "partycontrol-dj-mode"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "music_requests",
          },
          () => {
            loadRequests();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  async function updateStatus(
    request: MusicRequest,
    status: MusicStatus
  ) {
    const { error } =
      await supabase
        .from("music_requests")
        .update({
          status,
        })
        .eq(
          "id",
          request.id
        );

    if (error) {
      showToast({
        type: "error",
        title:
          "Status konnte nicht geändert werden",
        message: error.message,
      });

      return;
    }

    setRequests(
      (
        currentRequests
      ) =>
        currentRequests.map(
          (item) =>
            item.id ===
            request.id
              ? {
                  ...item,
                  status,
                }
              : item
        )
    );

    if (
      status ===
      "Gespielt"
    ) {
      showToast({
        type: "success",
        title:
          "Song als gespielt markiert",
        message:
          request.song_title,
      });
    }
  }

  const statistics =
    useMemo(() => {
      return {
        total:
          requests.length,

        new:
          requests.filter(
            (request) =>
              request.status ===
              "Neu"
          ).length,

        planned:
          requests.filter(
            (request) =>
              request.status ===
              "Geplant"
          ).length,

        played:
          requests.filter(
            (request) =>
              request.status ===
              "Gespielt"
          ).length,
      };
    }, [requests]);

  const filteredRequests =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLowerCase();

      return requests.filter(
        (request) => {
          const matchesSearch =
            !cleanSearch ||
            request.song_title
              .toLowerCase()
              .includes(
                cleanSearch
              ) ||
            request.artist
              ?.toLowerCase()
              .includes(
                cleanSearch
              ) ||
            request.guest_name
              .toLowerCase()
              .includes(
                cleanSearch
              );

          let matchesFilter =
            true;

          if (
            filter === "Offen"
          ) {
            matchesFilter =
              request.status ===
                "Neu" ||
              request.status ===
                "Geplant";
          } else if (
            filter !== "Alle"
          ) {
            matchesFilter =
              request.status ===
              filter;
          }

          return (
            matchesSearch &&
            matchesFilter &&
            request.status !==
              "Abgelehnt"
          );
        }
      );
    }, [
      requests,
      search,
      filter,
    ]);

  if (loading) {
    return (
      <LoadingState
        fullPage
        title="DJ-Modus wird geladen"
        description="Musikwünsche werden vorbereitet."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
              <Music2
                size={24}
              />
            </div>

            <div>
              <p className="text-xl font-black tracking-tight">
                PartyControl
              </p>

              <p className="text-sm font-semibold text-yellow-400">
                DJ-Modus
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />

              <span className="text-sm font-bold text-green-300">
                Live
              </span>
            </div>

            <Button
              size="small"
              variant="secondary"
              icon={
                <RefreshCcw
                  size={17}
                />
              }
              loading={
                refreshing
              }
              onClick={() =>
                loadRequests()
              }
            >
              Aktualisieren
            </Button>

            <a
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900"
            >
              Admin-Bereich
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
        <section className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <DjStatistic
            title="Neue Wünsche"
            value={
              statistics.new
            }
            variant="info"
          />

          <DjStatistic
            title="Geplant"
            value={
              statistics.planned
            }
            variant="warning"
          />

          <DjStatistic
            title="Gespielt"
            value={
              statistics.played
            }
            variant="success"
          />

          <DjStatistic
            title="Total"
            value={
              statistics.total
            }
            variant="neutral"
          />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
              size={19}
            />

            <input
              className="app-input pl-12"
              placeholder="Song, Interpret oder Gast suchen..."
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event
                    .target
                    .value
                )
              }
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {(
              [
                "Offen",
                "Neu",
                "Geplant",
                "Gespielt",
                "Alle",
              ] as DjFilter[]
            ).map(
              (
                filterOption
              ) => (
                <button
                  key={
                    filterOption
                  }
                  type="button"
                  onClick={() =>
                    setFilter(
                      filterOption
                    )
                  }
                  className={`min-h-12 shrink-0 rounded-xl border px-5 py-3 font-bold transition ${
                    filter ===
                    filterOption
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {
                    filterOption
                  }
                </button>
              )
            )}
          </div>
        </section>

        {filteredRequests.length ===
        0 ? (
          <EmptyState
            icon={
              <ListMusic
                size={32}
              />
            }
            title="Keine Musikwünsche"
            description="Für diesen Filter sind aktuell keine Songs vorhanden."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredRequests.map(
              (
                request,
                index
              ) => (
                <SongCard
                  key={
                    request.id
                  }
                  request={
                    request
                  }
                  position={
                    index + 1
                  }
                  onStatusChange={
                    updateStatus
                  }
                />
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SongCard({
  request,
  position,
  onStatusChange,
}: {
  request: MusicRequest;
  position: number;
  onStatusChange: (
    request: MusicRequest,
    status: MusicStatus
  ) => void;
}) {
  return (
    <Card
      hover
      padding="large"
      className={
        request.status ===
        "Geplant"
          ? "border-yellow-400/30"
          : ""
      }
    >
      <div className="flex gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${
            position === 1
              ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/15"
              : position === 2
                ? "bg-zinc-300 text-zinc-900"
                : position ===
                    3
                  ? "bg-amber-700/30 text-amber-300"
                  : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {position}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black sm:text-2xl">
                {
                  request.song_title
                }
              </h2>

              <p className="mt-1 truncate text-base text-zinc-400">
                {request.artist ||
                  "Interpret nicht angegeben"}
              </p>
            </div>

            <StatusBadge
              status={
                request.status
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="vip">
              <Heart
                size={14}
                className="mr-1"
              />

              {request.likes}{" "}
              Likes
            </Badge>

            <Badge variant="neutral">
              Gewünscht von{" "}
              {
                request.guest_name
              }
            </Badge>
          </div>

          {request.note && (
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Nachricht
              </p>

              <p className="mt-2 leading-6 text-zinc-300">
                {
                  request.note
                }
              </p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button
              variant={
                request.status ===
                "Geplant"
                  ? "primary"
                  : "secondary"
              }
              icon={
                <Clock3
                  size={18}
                />
              }
              onClick={() =>
                onStatusChange(
                  request,
                  "Geplant"
                )
              }
            >
              Planen
            </Button>

            <Button
              variant="success"
              icon={
                <Check
                  size={18}
                />
              }
              onClick={() =>
                onStatusChange(
                  request,
                  "Gespielt"
                )
              }
            >
              Gespielt
            </Button>

            <Button
              variant="danger"
              icon={
                <X
                  size={18}
                />
              }
              onClick={() =>
                onStatusChange(
                  request,
                  "Abgelehnt"
                )
              }
            >
              Ablehnen
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: MusicStatus;
}) {
  if (
    status === "Neu"
  ) {
    return (
      <Badge variant="info">
        Neu
      </Badge>
    );
  }

  if (
    status === "Geplant"
  ) {
    return (
      <Badge variant="warning">
        Geplant
      </Badge>
    );
  }

  if (
    status === "Gespielt"
  ) {
    return (
      <Badge variant="success">
        Gespielt
      </Badge>
    );
  }

  return (
    <Badge variant="danger">
      Abgelehnt
    </Badge>
  );
}

function DjStatistic({
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
    neutral:
      "bg-zinc-800 text-zinc-300",

    info:
      "bg-blue-500/10 text-blue-400",

    warning:
      "bg-yellow-400/10 text-yellow-400",

    success:
      "bg-green-500/10 text-green-400",
  };

  return (
    <Card
      hover
      padding="small"
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[variant]}`}
      >
        <Music2
          size={21}
        />
      </div>

      <p className="mt-4 text-sm font-semibold text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black sm:text-4xl">
        {value}
      </p>
    </Card>
  );
}