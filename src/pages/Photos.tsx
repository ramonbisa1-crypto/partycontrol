import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Eye,
  ImagePlus,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type PartyPhoto = {
  id: string;
  guest_name: string;
  caption: string | null;
  storage_path: string;
  public_url: string;
  approved: boolean;
  created_at: string;
};

type PhotoFilter = "Alle" | "Ausstehend" | "Freigegeben";

export default function Photos() {
  const [photos, setPhotos] = useState<PartyPhoto[]>([]);
  const [filter, setFilter] = useState<PhotoFilter>("Ausstehend");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPhotos(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("party_photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setPhotos(data ?? []);
    setErrorMessage("");
    setLoading(false);
  }

  useEffect(() => {
    loadPhotos(true);

    const channel = supabase
      .channel("admin-party-photos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "party_photos",
        },
        () => {
          loadPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function setApproval(photoId: string, approved: boolean) {
    const { error } = await supabase
      .from("party_photos")
      .update({
        approved,
      })
      .eq("id", photoId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setPhotos((currentPhotos) =>
      currentPhotos.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              approved,
            }
          : photo
      )
    );
  }

  async function deletePhoto(photo: PartyPhoto) {
    const confirmed = confirm(
      "Dieses Foto wirklich dauerhaft löschen?"
    );

    if (!confirmed) {
      return;
    }

    const { error: storageError } = await supabase.storage
      .from("party-photos")
      .remove([photo.storage_path]);

    if (storageError) {
      setErrorMessage(
        `Datei konnte nicht gelöscht werden: ${storageError.message}`
      );
      return;
    }

    const { error: databaseError } = await supabase
      .from("party_photos")
      .delete()
      .eq("id", photo.id);

    if (databaseError) {
      setErrorMessage(databaseError.message);
      return;
    }

    setPhotos((currentPhotos) =>
      currentPhotos.filter((item) => item.id !== photo.id)
    );
  }

  const filteredPhotos = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return photos.filter((photo) => {
      const matchesSearch =
        !cleanSearch ||
        photo.guest_name.toLowerCase().includes(cleanSearch) ||
        photo.caption?.toLowerCase().includes(cleanSearch);

      const matchesFilter =
        filter === "Alle" ||
        (filter === "Ausstehend" && !photo.approved) ||
        (filter === "Freigegeben" && photo.approved);

      return matchesSearch && matchesFilter;
    });
  }, [photos, filter, search]);

  const pendingCount = photos.filter(
    (photo) => !photo.approved
  ).length;

  const approvedCount = photos.filter(
    (photo) => photo.approved
  ).length;

  const publicLink = `${window.location.origin}/?view=photos`;

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 font-semibold text-yellow-400">
            Galerie-Moderation
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Fotowand
          </h1>

          <p className="mt-2 text-zinc-400">
            Fotos prüfen, freigeben und verwalten.
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
            onClick={() => loadPhotos(true)}
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Ausstehend"
          value={pendingCount}
        />

        <SummaryCard
          title="Freigegeben"
          value={approvedCount}
        />

        <SummaryCard
          title="Fotos total"
          value={photos.length}
        />
      </div>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950">
        <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <ImagePlus
              className="text-yellow-400"
              size={22}
            />

            <div>
              <h2 className="text-xl font-bold">
                Foto-Warteschlange
              </h2>

              <p className="text-sm text-zinc-500">
                {filteredPhotos.length} Fotos angezeigt
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 outline-none focus:border-yellow-400 sm:w-72"
              placeholder="Name oder Beschreibung..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 outline-none focus:border-yellow-400"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as PhotoFilter)
              }
            >
              <option value="Alle">Alle Fotos</option>
              <option value="Ausstehend">Ausstehend</option>
              <option value="Freigegeben">Freigegeben</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-zinc-500">
            Fotos werden geladen...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredPhotos.map((photo) => (
              <article
                key={photo.id}
                className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900"
              >
                <div className="relative aspect-square bg-black">
                  <img
                    src={photo.public_url}
                    alt={
                      photo.caption ||
                      `Foto von ${photo.guest_name}`
                    }
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />

                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold backdrop-blur ${
                      photo.approved
                        ? "bg-green-500/80 text-white"
                        : "bg-yellow-400/90 text-black"
                    }`}
                  >
                    {photo.approved
                      ? "Freigegeben"
                      : "Ausstehend"}
                  </span>

                  <a
                    href={photo.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur"
                    aria-label="Foto gross öffnen"
                  >
                    <Eye size={18} />
                  </a>
                </div>

                <div className="p-4">
                  <p className="font-bold">
                    {photo.guest_name}
                  </p>

                  {photo.caption && (
                    <p className="mt-2 line-clamp-3 text-sm text-zinc-400">
                      {photo.caption}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-zinc-600">
                    {new Date(photo.created_at).toLocaleString(
                      "de-CH",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {!photo.approved ? (
                      <button
                        type="button"
                        onClick={() =>
                          setApproval(photo.id, true)
                        }
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-500/15 px-3 py-2 font-bold text-green-300 transition hover:bg-green-500/25"
                      >
                        <Check size={18} />
                        Freigeben
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setApproval(photo.id, false)
                        }
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-yellow-500/15 px-3 py-2 font-bold text-yellow-300 transition hover:bg-yellow-500/25"
                      >
                        <X size={18} />
                        Verbergen
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deletePhoto(photo)}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 font-bold text-red-300 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={18} />
                      Löschen
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && filteredPhotos.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            Keine passenden Fotos gefunden.
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}