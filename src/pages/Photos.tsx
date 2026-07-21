import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Eye,
  ImagePlus,
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
  const { showToast } = useToast();

  const [photos, setPhotos] = useState<PartyPhoto[]>([]);
  const [filter, setFilter] =
    useState<PhotoFilter>("Ausstehend");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [photoToDelete, setPhotoToDelete] =
    useState<PartyPhoto | null>(null);

  async function loadPhotos(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const { data, error } = await supabase
      .from("party_photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showToast({
        type: "error",
        title: "Fotos konnten nicht geladen werden",
        message: error.message,
      });

      setLoading(false);
      setRefreshing(false);
      return;
    }

    setPhotos((data ?? []) as PartyPhoto[]);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadPhotos(true);

    const channel = supabase
      .channel("professional-admin-photos")
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

  async function setApproval(
    photo: PartyPhoto,
    approved: boolean
  ) {
    const { error } = await supabase
      .from("party_photos")
      .update({
        approved,
      })
      .eq("id", photo.id);

    if (error) {
      showToast({
        type: "error",
        title: "Status konnte nicht geändert werden",
        message: error.message,
      });

      return;
    }

    setPhotos((currentPhotos) =>
      currentPhotos.map((item) =>
        item.id === photo.id
          ? {
              ...item,
              approved,
            }
          : item
      )
    );

    showToast({
      type: "success",
      title: approved
        ? "Foto freigegeben"
        : "Foto verborgen",
      message: approved
        ? `Das Foto von ${photo.guest_name} ist jetzt öffentlich sichtbar.`
        : `Das Foto von ${photo.guest_name} wurde aus der öffentlichen Galerie entfernt.`,
    });
  }

  async function deletePhoto() {
    if (!photoToDelete) {
      return;
    }

    setDeleting(true);

    const { error: storageError } =
      await supabase.storage
        .from("party-photos")
        .remove([photoToDelete.storage_path]);

    if (storageError) {
      showToast({
        type: "error",
        title: "Datei konnte nicht gelöscht werden",
        message: storageError.message,
      });

      setDeleting(false);
      return;
    }

    const { error: databaseError } =
      await supabase
        .from("party_photos")
        .delete()
        .eq("id", photoToDelete.id);

    if (databaseError) {
      showToast({
        type: "error",
        title: "Fotoeintrag konnte nicht gelöscht werden",
        message: databaseError.message,
      });

      setDeleting(false);
      return;
    }

    showToast({
      type: "success",
      title: "Foto gelöscht",
      message: `Das Foto von ${photoToDelete.guest_name} wurde dauerhaft entfernt.`,
    });

    setPhotos((currentPhotos) =>
      currentPhotos.filter(
        (item) => item.id !== photoToDelete.id
      )
    );

    setPhotoToDelete(null);
    setDeleting(false);
  }

  const filteredPhotos = useMemo(() => {
    const cleanSearch =
      search.trim().toLowerCase();

    return photos.filter((photo) => {
      const matchesSearch =
        !cleanSearch ||
        photo.guest_name
          .toLowerCase()
          .includes(cleanSearch) ||
        photo.caption
          ?.toLowerCase()
          .includes(cleanSearch);

      const matchesFilter =
        filter === "Alle" ||
        (filter === "Ausstehend" &&
          !photo.approved) ||
        (filter === "Freigegeben" &&
          photo.approved);

      return matchesSearch && matchesFilter;
    });
  }, [photos, filter, search]);

  const statistics = useMemo(() => {
    return {
      total: photos.length,
      pending: photos.filter(
        (photo) => !photo.approved
      ).length,
      approved: photos.filter(
        (photo) => photo.approved
      ).length,
    };
  }, [photos]);

  const publicLink = `${window.location.origin}/?view=photos`;

  if (loading) {
    return (
      <LoadingState
        title="Fotowand wird geladen"
        description="Die hochgeladenen Bilder werden vorbereitet."
      />
    );
  }

  return (
    <div className="page-enter p-4 sm:p-6 lg:p-10">
      <PageHeader
        eyebrow="Galerie-Moderation"
        title="Fotowand"
        description="Prüfe hochgeladene Bilder, gib sie frei und verwalte die öffentliche Galerie."
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
              onClick={() => loadPhotos()}
            >
              Aktualisieren
            </Button>
          </>
        }
      />

      <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Ausstehend"
          value={statistics.pending}
          variant="warning"
        />

        <SummaryCard
          title="Freigegeben"
          value={statistics.approved}
          variant="success"
        />

        <SummaryCard
          title="Fotos total"
          value={statistics.total}
          variant="neutral"
        />
      </section>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-zinc-800 p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ImagePlus
                className="text-yellow-400"
                size={22}
              />

              <h2 className="text-xl font-black sm:text-2xl">
                Foto-Warteschlange
              </h2>
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              {filteredPhotos.length} von{" "}
              {photos.length} Bildern angezeigt
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
                placeholder="Name oder Beschreibung..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              className="app-input"
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as PhotoFilter
                )
              }
            >
              <option value="Alle">
                Alle Fotos
              </option>

              <option value="Ausstehend">
                Ausstehend
              </option>

              <option value="Freigegeben">
                Freigegeben
              </option>
            </select>
          </div>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="p-5 sm:p-7">
            <EmptyState
              icon={<ImagePlus size={29} />}
              title="Keine Fotos gefunden"
              description="Passe die Suche oder den Filter an."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredPhotos.map((photo) => (
              <article
                key={photo.id}
                className="group overflow-hidden rounded-3xl border border-zinc-800 bg-black/20 transition hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="relative aspect-square overflow-hidden bg-black">
                  <img
                    src={photo.public_url}
                    alt={
                      photo.caption ||
                      `Foto von ${photo.guest_name}`
                    }
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
                    <Badge
                      variant={
                        photo.approved
                          ? "success"
                          : "warning"
                      }
                    >
                      {photo.approved
                        ? "Freigegeben"
                        : "Ausstehend"}
                    </Badge>

                    <a
                      href={photo.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/70 text-white backdrop-blur transition hover:bg-black/90"
                      aria-label="Foto gross öffnen"
                    >
                      <Eye size={18} />
                    </a>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <p className="font-black">
                    {photo.guest_name}
                  </p>

                  {photo.caption ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">
                      {photo.caption}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-600">
                      Keine Beschreibung
                    </p>
                  )}

                  <p className="mt-3 text-xs text-zinc-600">
                    {formatDateTime(
                      photo.created_at
                    )}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {!photo.approved ? (
                      <Button
                        size="small"
                        variant="success"
                        icon={<Check size={17} />}
                        onClick={() =>
                          setApproval(photo, true)
                        }
                      >
                        Freigeben
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="secondary"
                        icon={<X size={17} />}
                        onClick={() =>
                          setApproval(photo, false)
                        }
                      >
                        Verbergen
                      </Button>
                    )}

                    <Button
                      size="small"
                      variant="danger"
                      icon={<Trash2 size={17} />}
                      onClick={() =>
                        setPhotoToDelete(photo)
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
        open={photoToDelete !== null}
        title="Foto löschen?"
        description={
          photoToDelete
            ? `Das Foto von ${photoToDelete.guest_name} wird dauerhaft aus dem Storage und der Galerie gelöscht.`
            : ""
        }
        confirmLabel="Foto löschen"
        dangerous
        loading={deleting}
        onConfirm={deletePhoto}
        onCancel={() => {
          if (!deleting) {
            setPhotoToDelete(null);
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
    | "warning"
    | "success";
}) {
  const styles = {
    neutral: "bg-zinc-800 text-zinc-300",
    warning:
      "bg-yellow-400/10 text-yellow-400",
    success:
      "bg-green-500/10 text-green-400",
  };

  return (
    <Card hover padding="small">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[variant]}`}
      >
        <ImagePlus size={21} />
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(
    "de-CH",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}