import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Check,
  Clock3,
  Search,
  ShieldAlert,
  TicketCheck,
  User,
  X,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import { supabase } from "../lib/supabase";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastProvider";

type PersonType = "Hauptgast" | "Begleitung";

type Person = {
  id: string;
  name: string;
  type: PersonType;
  ticket_code: string;
  checked_in: boolean;
  checked_in_at: string | null;
  category?: string | null;
};

type RecentCheckIn = {
  id: string;
  name: string;
  type: PersonType;
  checked_in_at: string;
};

type ScannerFeedback = {
  status: "success" | "error";
  title: string;
  description: string;
  person: Person | null;
};

export default function CheckIn() {
  const { showToast } = useToast();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanLockedRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const [people, setPeople] = useState<Person[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);

  const [search, setSearch] = useState("");
  const [manualCode, setManualCode] = useState("");

  const [scannerRunning, setScannerRunning] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [scannerFeedback, setScannerFeedback] =
    useState<ScannerFeedback | null>(null);

  async function loadPeople(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }

    const { data: guests, error: guestError } = await supabase
      .from("guests")
      .select(
        "id, name, ticket_code, checked_in, checked_in_at, category"
      )
      .order("name", { ascending: true });

    if (guestError) {
      showToast({
        type: "error",
        title: "Gäste konnten nicht geladen werden",
        message: guestError.message,
      });

      setLoading(false);
      return;
    }

    const { data: companions, error: companionError } = await supabase
      .from("companions")
      .select("id, name, ticket_code, checked_in, checked_in_at")
      .order("name", { ascending: true });

    if (companionError) {
      showToast({
        type: "error",
        title: "Begleitungen konnten nicht geladen werden",
        message: companionError.message,
      });

      setLoading(false);
      return;
    }

    const guestPeople: Person[] =
      guests?.map((guest) => ({
        id: guest.id,
        name: guest.name,
        type: "Hauptgast",
        ticket_code: guest.ticket_code,
        checked_in: guest.checked_in,
        checked_in_at: guest.checked_in_at,
        category: guest.category,
      })) ?? [];

    const companionPeople: Person[] =
      companions?.map((companion) => ({
        id: companion.id,
        name: companion.name,
        type: "Begleitung",
        ticket_code: companion.ticket_code,
        checked_in: companion.checked_in,
        checked_in_at: companion.checked_in_at,
        category: null,
      })) ?? [];

    const allPeople = [...guestPeople, ...companionPeople];

    setPeople(allPeople);

    const recent = allPeople
      .filter(
        (person): person is Person & { checked_in_at: string } =>
          person.checked_in && Boolean(person.checked_in_at)
      )
      .sort(
        (a, b) =>
          new Date(b.checked_in_at).getTime() -
          new Date(a.checked_in_at).getTime()
      )
      .slice(0, 10)
      .map((person) => ({
        id: person.id,
        name: person.name,
        type: person.type,
        checked_in_at: person.checked_in_at,
      }));

    setRecentCheckIns(recent);
    setLoading(false);
  }

  async function findPersonByTicketCode(
    ticketCode: string
  ): Promise<Person | null> {
    const cleanCode = ticketCode.trim();

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select(
        "id, name, ticket_code, checked_in, checked_in_at, category"
      )
      .eq("ticket_code", cleanCode)
      .maybeSingle();

    if (guestError) {
      throw new Error(guestError.message);
    }

    if (guest) {
      return {
        id: guest.id,
        name: guest.name,
        type: "Hauptgast",
        ticket_code: guest.ticket_code,
        checked_in: guest.checked_in,
        checked_in_at: guest.checked_in_at,
        category: guest.category,
      };
    }

    const { data: companion, error: companionError } = await supabase
      .from("companions")
      .select("id, name, ticket_code, checked_in, checked_in_at")
      .eq("ticket_code", cleanCode)
      .maybeSingle();

    if (companionError) {
      throw new Error(companionError.message);
    }

    if (!companion) {
      return null;
    }

    return {
      id: companion.id,
      name: companion.name,
      type: "Begleitung",
      ticket_code: companion.ticket_code,
      checked_in: companion.checked_in,
      checked_in_at: companion.checked_in_at,
      category: null,
    };
  }

  function showScannerFeedback(feedback: ScannerFeedback) {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    setScannerFeedback(feedback);

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setScannerFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 2500);
  }

  function playFeedback(status: "success" | "error") {
    if ("vibrate" in navigator) {
      if (status === "success") {
        navigator.vibrate(120);
      } else {
        navigator.vibrate([180, 80, 180]);
      }
    }
  }

  async function handleTicket(ticketCode: string) {
    const cleanCode = ticketCode.trim();

    if (!cleanCode) {
      showToast({
        type: "warning",
        title: "Ticket-Code fehlt",
        message: "Bitte gib einen Ticket-Code ein.",
      });

      return;
    }

    if (scanLockedRef.current) {
      return;
    }

    scanLockedRef.current = true;

    try {
      const person = await findPersonByTicketCode(cleanCode);

      if (!person) {
        showScannerFeedback({
          status: "error",
          title: "Ungültiges Ticket",
          description: "Dieser QR-Code ist nicht im System vorhanden.",
          person: null,
        });

        playFeedback("error");
        return;
      }

      await checkInPerson(person);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unbekannter Fehler";

      showToast({
        type: "error",
        title: "Check-In fehlgeschlagen",
        message: errorMessage,
      });

      showScannerFeedback({
        status: "error",
        title: "Check-In fehlgeschlagen",
        description: errorMessage,
        person: null,
      });

      playFeedback("error");
    } finally {
      window.setTimeout(() => {
        scanLockedRef.current = false;
      }, 2200);
    }
  }

  async function checkInPerson(person: Person) {
    if (person.category === "Blacklist") {
      showScannerFeedback({
        status: "error",
        title: "Zutritt verweigern",
        description: "Diese Person ist als Blacklist markiert.",
        person,
      });

      showToast({
        type: "error",
        title: "Blacklist",
        message: `${person.name} darf nicht eingecheckt werden.`,
      });

      playFeedback("error");
      return;
    }

    if (person.checked_in) {
      showScannerFeedback({
        status: "error",
        title: "Bereits eingecheckt",
        description: person.checked_in_at
          ? `Check-In war um ${formatTime(person.checked_in_at)} Uhr.`
          : "Dieses Ticket wurde bereits verwendet.",
        person,
      });

      playFeedback("error");
      return;
    }

    const table = person.type === "Hauptgast" ? "guests" : "companions";
    const now = new Date().toISOString();

    const { error } = await supabase
      .from(table)
      .update({
        checked_in: true,
        checked_in_at: now,
      })
      .eq("id", person.id);

    if (error) {
      showToast({
        type: "error",
        title: "Check-In fehlgeschlagen",
        message: error.message,
      });

      showScannerFeedback({
        status: "error",
        title: "Check-In fehlgeschlagen",
        description: error.message,
        person,
      });

      playFeedback("error");
      return;
    }

    const updatedPerson: Person = {
      ...person,
      checked_in: true,
      checked_in_at: now,
    };

    showScannerFeedback({
      status: "success",
      title: "Check-In erfolgreich",
      description: "Das Ticket ist gültig und wurde verwendet.",
      person: updatedPerson,
    });

    playFeedback("success");

    setManualCode("");
    setSearch("");

    await loadPeople();
  }

  async function startScanner() {
    if (scannerRunning || scannerLoading) {
      return;
    }

    setScannerLoading(true);

    try {
      const scanner =
        scannerRef.current ?? new Html5Qrcode("partycontrol-qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
          aspectRatio: 1,
        },
        async (decodedText) => {
          await handleTicket(decodedText);
        },
        () => {
          // normale Scanfehler werden ignoriert
        }
      );

      setScannerRunning(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Kamera konnte nicht gestartet werden.";

      showToast({
        type: "error",
        title: "Kamera konnte nicht gestartet werden",
        message: errorMessage,
      });
    } finally {
      setScannerLoading(false);
    }
  }

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (!scanner || !scannerRunning) {
      return;
    }

    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // bereits gestoppt
    } finally {
      scannerRef.current = null;
      setScannerRunning(false);
      setScannerFeedback(null);
    }
  }

  useEffect(() => {
    loadPeople(true);

    return () => {
      const scanner = scannerRef.current;

      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }

      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  const filteredPeople = search.trim()
    ? people
        .filter((person) =>
          person.name.toLowerCase().includes(search.toLowerCase().trim())
        )
        .slice(0, 20)
    : [];

  if (loading) {
    return (
      <LoadingState
        title="Check-In wird geladen"
        description="Gäste und Tickets werden vorbereitet."
      />
    );
  }

  return (
    <div className="page-enter p-4 sm:p-6 lg:p-10">
      <PageHeader
        eyebrow="Einlass"
        title="Check-In"
        description="Scanne QR-Codes, suche Personen oder gib einen Ticket-Code manuell ein."
        actions={
          <Badge variant={scannerRunning ? "success" : "neutral"}>
            <span
              className={`mr-2 h-2 w-2 rounded-full ${
                scannerRunning ? "bg-green-400" : "bg-zinc-500"
              }`}
            />

            {scannerRunning ? "Scanner aktiv" : "Scanner inaktiv"}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card padding="none" className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black sm:text-2xl">
                  QR-Scanner
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Die Rückkamera des Handys wird bevorzugt verwendet.
                </p>
              </div>

              {!scannerRunning ? (
                <Button
                  icon={<Camera size={19} />}
                  loading={scannerLoading}
                  onClick={startScanner}
                >
                  Kamera starten
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  icon={<CameraOff size={19} />}
                  onClick={stopScanner}
                >
                  Kamera stoppen
                </Button>
              )}
            </div>

            <div className="p-4 sm:p-6">
              <div className="relative mx-auto max-w-xl overflow-hidden rounded-3xl border border-zinc-800 bg-black shadow-2xl">
                <div
                  id="partycontrol-qr-reader"
                  className="min-h-[320px] w-full"
                />

                {!scannerRunning && !scannerLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="max-w-xs px-6 text-center">
                      <Camera
                        className="mx-auto text-zinc-600"
                        size={38}
                      />

                      <p className="mt-4 font-black text-zinc-300">
                        Kamera nicht aktiv
                      </p>

                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Starte die Kamera, um QR-Codes zu scannen.
                      </p>
                    </div>
                  </div>
                )}

                {scannerFeedback && (
                  <div className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-5 sm:bottom-5">
                    <div
                      className={`scale-enter rounded-3xl border p-5 shadow-2xl backdrop-blur-xl ${
                        scannerFeedback.status === "success"
                          ? "success-pulse border-green-400/40 bg-green-950/95"
                          : "error-shake border-red-400/40 bg-red-950/95"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                            scannerFeedback.status === "success"
                              ? "bg-green-400 text-green-950"
                              : "bg-red-400 text-red-950"
                          }`}
                        >
                          {scannerFeedback.status === "success" ? (
                            <Check size={38} strokeWidth={3} />
                          ) : (
                            <X size={38} strokeWidth={3} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xl font-black ${
                              scannerFeedback.status === "success"
                                ? "text-green-300"
                                : "text-red-300"
                            }`}
                          >
                            {scannerFeedback.title}
                          </p>

                          {scannerFeedback.person && (
                            <>
                              <p className="mt-1 truncate text-2xl font-black text-white">
                                {scannerFeedback.person.name}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="neutral">
                                  {scannerFeedback.person.type}
                                </Badge>

                                {scannerFeedback.person.category === "VIP" && (
                                  <Badge variant="vip">VIP</Badge>
                                )}

                                {scannerFeedback.person.category ===
                                  "Helfer" && (
                                  <Badge variant="info">Helfer</Badge>
                                )}

                                {scannerFeedback.person.category ===
                                  "Blacklist" && (
                                  <Badge variant="danger">
                                    Blacklist
                                  </Badge>
                                )}
                              </div>
                            </>
                          )}

                          <p className="mt-3 text-sm leading-6 text-white/70">
                            {scannerFeedback.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setScannerFeedback(null)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
                          aria-label="Meldung schliessen"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card padding="large">
            <div className="flex items-center gap-3">
              <TicketCheck className="text-yellow-400" size={22} />

              <div>
                <h2 className="text-xl font-black sm:text-2xl">
                  Manueller Ticket-Code
                </h2>

                <p className="text-sm text-zinc-500">
                  Alternative, falls der QR-Code nicht gelesen werden kann.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                className="app-input flex-1"
                placeholder="Ticket-Code einfügen..."
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleTicket(manualCode);
                  }
                }}
              />

              <Button onClick={() => handleTicket(manualCode)}>
                Einchecken
              </Button>
            </div>
          </Card>

          <Card padding="large">
            <div className="flex items-center gap-3">
              <Search className="text-yellow-400" size={22} />

              <div>
                <h2 className="text-xl font-black sm:text-2xl">
                  Namenssuche
                </h2>

                <p className="text-sm text-zinc-500">
                  Person direkt suchen und manuell einchecken.
                </p>
              </div>
            </div>

            <div className="relative mt-5">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                size={18}
              />

              <input
                className="app-input pl-11"
                placeholder="Name suchen..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {search.trim() && (
              <div className="mt-4 max-h-[440px] space-y-3 overflow-y-auto">
                {filteredPeople.length === 0 ? (
                  <EmptyState
                    icon={<Search size={27} />}
                    title="Keine Person gefunden"
                    description="Passe den Suchbegriff an."
                  />
                ) : (
                  filteredPeople.map((person) => (
                    <div
                      key={`${person.type}-${person.id}`}
                      className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-black/20 p-4 transition hover:border-zinc-700 hover:bg-zinc-900 sm:flex-row sm:items-center"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-yellow-400">
                        {person.category === "Blacklist" ? (
                          <ShieldAlert size={21} />
                        ) : (
                          <User size={21} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black">
                          {person.name}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="neutral">
                            {person.type}
                          </Badge>

                          {person.category === "VIP" && (
                            <Badge variant="vip">VIP</Badge>
                          )}

                          {person.category === "Helfer" && (
                            <Badge variant="info">Helfer</Badge>
                          )}

                          {person.category === "Blacklist" && (
                            <Badge variant="danger">Blacklist</Badge>
                          )}

                          {person.checked_in && (
                            <Badge variant="success">
                              Eingecheckt
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant={
                          person.category === "Blacklist"
                            ? "danger"
                            : person.checked_in
                              ? "secondary"
                              : "primary"
                        }
                        disabled={person.checked_in}
                        onClick={() => checkInPerson(person)}
                      >
                        {person.checked_in
                          ? "Bereits drin"
                          : person.category === "Blacklist"
                            ? "Gesperrt"
                            : "Einchecken"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>

        <Card
          padding="large"
          className="h-fit 2xl:sticky 2xl:top-6"
        >
          <div className="flex items-center gap-3">
            <Clock3 className="text-yellow-400" size={22} />

            <div>
              <h2 className="text-xl font-black sm:text-2xl">
                Letzte Check-ins
              </h2>

              <p className="text-sm text-zinc-500">
                Die zehn zuletzt eingelassenen Personen.
              </p>
            </div>
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<Clock3 size={27} />}
                title="Noch keine Check-ins"
                description="Sobald die erste Person eingecheckt wird, erscheint sie hier."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {recentCheckIns.map((checkIn, index) => (
                <div
                  key={`${checkIn.type}-${checkIn.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-black/20 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 font-black text-green-400">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">
                      {checkIn.name}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {checkIn.type}
                    </p>
                  </div>

                  <p className="shrink-0 font-bold tabular-nums text-zinc-300">
                    {formatTime(checkIn.checked_in_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("de-CH", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
  });
}