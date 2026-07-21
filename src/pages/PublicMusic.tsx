import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Heart,
  Music2,
  PartyPopper,
  Send,
  Sparkles,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { EVENT_CONFIG } from "../config/event";

type MusicRequest = {
  id: string;
  guest_name: string;
  song_title: string;
  artist: string | null;
  note: string | null;
  status:
    | "Neu"
    | "Geplant"
    | "Gespielt"
    | "Abgelehnt";
  likes: number;
  created_at: string;
};

export default function PublicMusic() {
  const [requests, setRequests] = useState<MusicRequest[]>([]);

  const [guestName, setGuestName] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadRequests() {
    const { data, error } = await supabase
      .from("music_requests")
      .select("*")
      .neq("status", "Abgelehnt")
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setRequests((data ?? []) as MusicRequest[]);
    setErrorMessage("");
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("professional-public-music")
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

  async function submitRequest(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanGuestName = guestName.trim();
    const cleanSongTitle = songTitle.trim();
    const cleanArtist = artist.trim();
    const cleanNote = note.trim();

    if (!cleanGuestName || !cleanSongTitle) {
      setErrorMessage(
        "Bitte gib deinen Namen und einen Songtitel ein."
      );
      return;
    }

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("music_requests")
      .insert({
        guest_name: cleanGuestName,
        song_title: cleanSongTitle,
        artist: cleanArtist || null,
        note: cleanNote || null,
      });

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    setSongTitle("");
    setArtist("");
    setNote("");

    setSuccessMessage(
      "Dein Musikwunsch wurde erfolgreich eingereicht."
    );

    setSubmitting(false);

    await loadRequests();
  }

  async function likeRequest(
    request: MusicRequest
  ) {
    const storageKey = `partycontrol-like-${request.id}`;

    if (localStorage.getItem(storageKey)) {
      setErrorMessage(
        "Du hast diesen Song bereits geliked."
      );
      return;
    }

    const newLikes = request.likes + 1;

    const { error } = await supabase
      .from("music_requests")
      .update({
        likes: newLikes,
      })
      .eq("id", request.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    localStorage.setItem(storageKey, "true");

    setRequests((currentRequests) =>
      currentRequests.map((item) =>
        item.id === request.id
          ? {
              ...item,
              likes: newLikes,
            }
          : item
      )
    );
  }

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      if (b.likes !== a.likes) {
        return b.likes - a.likes;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [requests]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-zinc-900 bg-black/90 px-4 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <PartyPopper size={23} />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              {EVENT_CONFIG.name}
            </h1>

            <p className="text-sm text-zinc-500">
              {EVENT_CONFIG.dateLabel} · Musikwünsche
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-400">
              <Sparkles size={16} />
              Deine Musik. Deine Party.
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              Welchen Song sollen wir spielen?
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
              Reiche deinen Musikwunsch ein oder unterstütze bereits
              eingereichte Songs mit einem Like.
            </p>

            <p className="mt-3 text-sm text-zinc-600">
              {EVENT_CONFIG.locationName} · {EVENT_CONFIG.city}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="h-fit rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 xl:sticky xl:top-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                <Music2 size={23} />
              </div>

              <div>
                <h3 className="text-xl font-black sm:text-2xl">
                  Musikwunsch einreichen
                </h3>

                <p className="text-sm text-zinc-500">
                  Name und Songtitel sind Pflicht.
                </p>
              </div>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={submitRequest}
            >
              <div>
                <label className="app-label">
                  Dein Name
                </label>

                <input
                  className="app-input"
                  placeholder="z.B. Ramon"
                  value={guestName}
                  onChange={(event) =>
                    setGuestName(event.target.value)
                  }
                  maxLength={80}
                />
              </div>

              <div>
                <label className="app-label">
                  Songtitel
                </label>

                <input
                  className="app-input"
                  placeholder="z.B. Freed From Desire"
                  value={songTitle}
                  onChange={(event) =>
                    setSongTitle(event.target.value)
                  }
                  maxLength={150}
                />
              </div>

              <div>
                <label className="app-label">
                  Interpret
                </label>

                <input
                  className="app-input"
                  placeholder="z.B. Gala"
                  value={artist}
                  onChange={(event) =>
                    setArtist(event.target.value)
                  }
                  maxLength={150}
                />
              </div>

              <div>
                <label className="app-label">
                  Nachricht an den DJ
                </label>

                <textarea
                  className="app-input min-h-28 resize-y"
                  placeholder="Optional"
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  maxLength={300}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-yellow-400 bg-yellow-400 px-5 py-3 font-bold text-black shadow-lg shadow-yellow-400/10 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {submitting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send size={19} />
                )}

                {submitting
                  ? "Wunsch wird gesendet..."
                  : "Musikwunsch absenden"}
              </button>
            </form>

            {successMessage && (
              <div className="scale-enter mt-5 flex items-start gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
                <CheckCircle2
                  className="mt-0.5 shrink-0"
                  size={21}
                />

                <p className="font-semibold">
                  {successMessage}
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="scale-enter mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                {errorMessage}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black sm:text-2xl">
                  Top Musikwünsche
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Die beliebtesten Songs stehen oben.
                </p>
              </div>

              <div className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 font-black text-yellow-400">
                {sortedRequests.length}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {loading && (
                <div className="py-10 text-center text-zinc-500">
                  Musikwünsche werden geladen...
                </div>
              )}

              {!loading &&
                sortedRequests.map((request, index) => (
                  <article
                    key={request.id}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-black/20 p-4 transition hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black ${
                        index === 0
                          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/15"
                          : index === 1
                            ? "bg-zinc-300 text-zinc-900"
                            : index === 2
                              ? "bg-amber-700/30 text-amber-300"
                              : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">
                        {request.song_title}
                      </p>

                      <p className="truncate text-sm text-zinc-500">
                        {request.artist ||
                          "Interpret nicht angegeben"}
                      </p>

                      <p className="mt-1 truncate text-xs text-zinc-600">
                        Gewünscht von {request.guest_name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        likeRequest(request)
                      }
                      className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-black text-zinc-300 transition hover:border-yellow-400 hover:text-yellow-400"
                    >
                      <Heart size={18} />
                      {request.likes}
                    </button>
                  </article>
                ))}

              {!loading &&
                sortedRequests.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-zinc-800 p-10 text-center">
                    <Music2
                      className="mx-auto text-zinc-600"
                      size={34}
                    />

                    <p className="mt-4 font-black text-zinc-300">
                      Noch keine Musikwünsche
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Sei die erste Person, die einen Song einreicht.
                    </p>
                  </div>
                )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}