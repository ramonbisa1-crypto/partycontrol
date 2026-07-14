import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  PartyPopper,
  RefreshCcw,
  Upload,
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

const maximumFileSize = 10 * 1024 * 1024;

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export default function PublicPhotos() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos] = useState<PartyPhoto[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [guestName, setGuestName] = useState("");
  const [caption, setCaption] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("party_photos")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setPhotos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadPhotos();

    const channel = supabase
      .channel("public-party-photos")
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

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  function handleFileSelection(file: File | undefined) {
    setSuccessMessage("");
    setErrorMessage("");

    if (!file) {
      clearSelectedFile();
      return;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      setErrorMessage(
        "Erlaubt sind JPG, PNG, WebP, HEIC und HEIF."
      );
      clearSelectedFile();
      return;
    }

    if (file.size > maximumFileSize) {
      setErrorMessage("Das Foto darf maximal 10 MB gross sein.");
      clearSelectedFile();
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearSelectedFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadPhoto(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanGuestName = guestName.trim();
    const cleanCaption = caption.trim();

    if (!cleanGuestName) {
      setErrorMessage("Bitte gib deinen Namen ein.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Bitte wähle ein Foto aus.");
      return;
    }

    setUploading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const extension =
      selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const storagePath = [
      new Date().getFullYear(),
      String(new Date().getMonth() + 1).padStart(2, "0"),
      `${crypto.randomUUID()}.${extension}`,
    ].join("/");

    const { error: uploadError } = await supabase.storage
      .from("party-photos")
      .upload(storagePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: selectedFile.type,
      });

    if (uploadError) {
      setErrorMessage(`Upload fehlgeschlagen: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("party-photos")
      .getPublicUrl(storagePath);

    const { error: databaseError } = await supabase
      .from("party_photos")
      .insert({
        guest_name: cleanGuestName,
        caption: cleanCaption || null,
        storage_path: storagePath,
        public_url: publicUrl,
      });

    if (databaseError) {
      await supabase.storage
        .from("party-photos")
        .remove([storagePath]);

      setErrorMessage(
        `Foto konnte nicht gespeichert werden: ${databaseError.message}`
      );
      setUploading(false);
      return;
    }

    clearSelectedFile();
    setCaption("");
    setSuccessMessage(
      "Foto wurde hochgeladen und wartet auf die Freigabe."
    );
    setUploading(false);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-zinc-900 bg-black/90 px-4 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <PartyPopper size={23} />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Birthday Party
            </h1>

            <p className="text-sm text-zinc-500">
              Live-Fotowand
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-10">
        <section className="mb-8">
          <p className="mb-2 font-semibold text-yellow-400">
            Teile deinen Moment
          </p>

          <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
            Unsere Party-Fotowand
          </h2>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Lade dein Lieblingsfoto hoch. Nach einer kurzen Freigabe
            erscheint es hier in der Galerie.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[420px_1fr]">
          <section className="h-fit rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 xl:sticky xl:top-6">
            <div className="flex items-center gap-3">
              <ImagePlus className="text-yellow-400" size={23} />

              <div>
                <h3 className="text-xl font-bold">
                  Foto hochladen
                </h3>

                <p className="text-sm text-zinc-500">
                  Maximal 10 MB
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={uploadPhoto}>
              <div>
                <label
                  htmlFor="photo-guest-name"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Dein Name
                </label>

                <input
                  id="photo-guest-name"
                  className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none transition focus:border-yellow-400"
                  placeholder="z.B. Ramon"
                  value={guestName}
                  onChange={(event) =>
                    setGuestName(event.target.value)
                  }
                  maxLength={80}
                />
              </div>

              <div>
                <label
                  htmlFor="photo-caption"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Bildbeschreibung
                </label>

                <textarea
                  id="photo-caption"
                  className="min-h-24 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none transition focus:border-yellow-400"
                  placeholder="Optional"
                  value={caption}
                  onChange={(event) =>
                    setCaption(event.target.value)
                  }
                  maxLength={250}
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                capture="environment"
                className="hidden"
                onChange={(event) =>
                  handleFileSelection(event.target.files?.[0])
                }
              />

              {!selectedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 px-5 py-6 text-zinc-300 transition hover:border-yellow-400 hover:text-yellow-400"
                >
                  <Camera size={28} />

                  <span className="font-bold">
                    Foto aufnehmen oder auswählen
                  </span>
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-black">
                  <img
                    src={previewUrl}
                    alt="Vorschau"
                    className="max-h-96 w-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white backdrop-blur"
                    aria-label="Foto entfernen"
                  >
                    <X size={19} />
                  </button>

                  <div className="border-t border-zinc-800 bg-zinc-950 p-3">
                    <p className="truncate text-sm font-semibold">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                <Upload size={19} />

                {uploading
                  ? "Foto wird hochgeladen..."
                  : "Foto hochladen"}
              </button>
            </form>

            {successMessage && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
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
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                {errorMessage}
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">
                  Galerie
                </h3>

                <p className="text-sm text-zinc-500">
                  {photos.length} freigegebene Fotos
                </p>
              </div>

              <button
                type="button"
                onClick={loadPhotos}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 font-bold transition hover:bg-zinc-900"
              >
                <RefreshCcw size={17} />

                <span className="hidden sm:inline">
                  Aktualisieren
                </span>
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-zinc-500">
                Fotos werden geladen...
              </div>
            ) : (
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {photos.map((photo) => (
                  <article
                    key={photo.id}
                    className="mb-4 break-inside-avoid overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950"
                  >
                    <img
                      src={photo.public_url}
                      alt={photo.caption || `Foto von ${photo.guest_name}`}
                      loading="lazy"
                      className="h-auto w-full object-cover"
                    />

                    <div className="p-4">
                      {photo.caption && (
                        <p className="font-semibold">
                          {photo.caption}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-zinc-500">
                        Hochgeladen von {photo.guest_name}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!loading && photos.length === 0 && (
              <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center">
                <ImagePlus
                  className="mx-auto text-zinc-600"
                  size={34}
                />

                <p className="mt-4 font-bold text-zinc-300">
                  Noch keine Fotos freigegeben
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Sei die erste Person, die einen Moment hochlädt.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}