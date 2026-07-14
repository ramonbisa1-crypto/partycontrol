import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  Clock3,
  Search,
  TicketCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import { supabase } from "../lib/supabase";

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanLockedRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const [people, setPeople] = useState<Person[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);

  const [search, setSearch] = useState("");
  const [manualCode, setManualCode] = useState("");

  const [scannerRunning, setScannerRunning] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "error" | ""
  >("");

  const [lastPerson, setLastPerson] = useState<Person | null>(null);
  const [scannerFeedback, setScannerFeedback] =
    useState<ScannerFeedback | null>(null);

  async function loadPeople() {
    const { data: guests, error: guestError } = await supabase
      .from("guests")
      .select(
        "id, name, ticket_code, checked_in, checked_in_at, category"
      )
      .order("name", { ascending: true });

    if (guestError) {
      setMessage(`Gäste konnten nicht geladen werden: ${guestError.message}`);
      setMessageType("error");
      return;
    }

    const { data: companions, error: companionError } = await supabase
      .from("companions")
      .select("id, name, ticket_code, checked_in, checked_in_at")
      .order("name", { ascending: true });

    if (companionError) {
      setMessage(
        `Begleitungen konnten nicht geladen werden: ${companionError.message}`
      );
      setMessageType("error");
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
        navigator.vibrate(150);
      } else {
        navigator.vibrate([180, 100, 180]);
      }
    }
  }

  async function handleTicket(ticketCode: string) {
    const cleanCode = ticketCode.trim();

    if (!cleanCode) {
      setMessage("Bitte einen Ticket-Code eingeben.");
      setMessageType("warning");
      setLastPerson(null);
      return;
    }

    if (scanLockedRef.current) {
      return;
    }

    scanLockedRef.current = true;

    try {
      const person = await findPersonByTicketCode(cleanCode);

      if (!person) {
        setMessage("Ticket wurde nicht gefunden.");
        setMessageType("error");
        setLastPerson(null);

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

      setMessage(`Check-In fehlgeschlagen: ${errorMessage}`);
      setMessageType("error");
      setLastPerson(null);

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
      setLastPerson(person);
      setMessage("Diese Person ist auf der Blacklist.");
      setMessageType("error");

      showScannerFeedback({
        status: "error",
        title: "Zutritt verweigern",
        description: "Diese Person ist als Blacklist markiert.",
        person,
      });

      playFeedback("error");
      return;
    }

    if (person.checked_in) {
      setLastPerson(person);
      setMessage("Diese Person ist bereits eingecheckt.");
      setMessageType("warning");

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
      setMessage(`Check-In fehlgeschlagen: ${error.message}`);
      setMessageType("error");

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

    setLastPerson(updatedPerson);
    setMessage("Check-In erfolgreich.");
    setMessageType("success");
    setManualCode("");
    setSearch("");

    showScannerFeedback({
      status: "success",
      title: "Check-In erfolgreich",
      description: "Das Ticket ist gültig und wurde verwendet.",
      person: updatedPerson,
    });

    playFeedback("success");
    await loadPeople();
  }

  async function startScanner() {
    if (scannerRunning || scannerLoading) {
      return;
    }

    setScannerLoading(true);
    setMessage("");
    setMessageType("");

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
          // Normale Suchfehler der Kamera werden nicht angezeigt.
        }
      );

      setScannerRunning(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Kamera konnte nicht gestartet werden.";

      setMessage(
        `Kamera konnte nicht gestartet werden. Prüfe die Browser-Berechtigung. ${errorMessage}`
      );
      setMessageType("error");
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
      // Scanner wurde möglicherweise bereits gestoppt.
    } finally {
      scannerRef.current = null;
      setScannerRunning(false);
      setScannerFeedback(null);
    }
  }

  useEffect(() => {
    loadPeople();

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

  const messageStyles = {
    success: "border-green-500/30 bg-green-500/10 text-green-300",
    warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    "": "border-zinc-800 bg-zinc-950 text-white",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mb-7">
        <p className="mb-2 font-semibold text-yellow-400">Einlass</p>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Check-In
        </h1>

        <p className="mt-2 text-zinc-400">
          QR-Code scannen, Ticket-Code eingeben oder nach Namen suchen.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
            <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  QR-Scanner
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Nutzt bevorzugt die Rückkamera des Handys.
                </p>
              </div>

              {!scannerRunning ? (
                <button
                  type="button"
                  onClick={startScanner}
                  disabled={scannerLoading}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                  <Camera size={20} />

                  {scannerLoading ? "Kamera startet..." : "Kamera starten"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScanner}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-bold text-white transition hover:bg-zinc-800"
                >
                  <CameraOff size={20} />
                  Kamera stoppen
                </button>
              )}
            </div>

            <div className="p-4 sm:p-6">
              <div className="relative mx-auto max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                <div
                  id="partycontrol-qr-reader"
                  className="min-h-[300px] w-full"
                />

                {scannerFeedback && (
                  <div className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-5 sm:bottom-5">
                    <div
                      className={`rounded-2xl border p-5 shadow-2xl backdrop-blur-xl ${
                        scannerFeedback.status === "success"
                          ? "border-green-400/50 bg-green-950/95"
                          : "border-red-400/50 bg-red-950/95"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
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
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                                  {scannerFeedback.person.type}
                                </span>

                                {scannerFeedback.person.category &&
                                  scannerFeedback.person.category !==
                                    "Normal" && (
                                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                                      {scannerFeedback.person.category}
                                    </span>
                                  )}
                              </div>
                            </>
                          )}

                          <p className="mt-2 text-sm text-white/70">
                            {scannerFeedback.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setScannerFeedback(null)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                          aria-label="Meldung schliessen"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!scannerRunning && !scannerLoading && (
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-center text-sm text-zinc-400">
                  Tippe auf „Kamera starten“ und erlaube den Kamerazugriff.
                </div>
              )}
            </div>
          </section>

          {message && (
            <section
              className={`rounded-2xl border p-5 ${messageStyles[messageType]}`}
            >
              <div className="flex items-start gap-3">
                {messageType === "success" ? (
                  <CheckCircle2 className="mt-1 shrink-0" size={24} />
                ) : messageType === "error" ? (
                  <XCircle className="mt-1 shrink-0" size={24} />
                ) : (
                  <TicketCheck className="mt-1 shrink-0" size={24} />
                )}

                <div>
                  <p className="text-lg font-bold">{message}</p>

                  {lastPerson && (
                    <div className="mt-3">
                      <p className="text-2xl font-black">
                        {lastPerson.name}
                      </p>

                      <p className="mt-1 text-sm opacity-80">
                        {lastPerson.type}
                        {lastPerson.category &&
                          lastPerson.category !== "Normal" &&
                          ` · ${lastPerson.category}`}
                      </p>

                      {lastPerson.checked_in_at && (
                        <p className="mt-2 text-sm opacity-80">
                          Check-In um{" "}
                          {formatTime(lastPerson.checked_in_at)} Uhr
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h2 className="text-xl font-bold sm:text-2xl">
              Manueller Ticket-Code
            </h2>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                className="min-h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none transition focus:border-yellow-400"
                placeholder="Ticket-Code einfügen..."
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleTicket(manualCode);
                  }
                }}
              />

              <button
                type="button"
                onClick={() => handleTicket(manualCode)}
                className="min-h-12 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
              >
                Einchecken
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Search className="text-yellow-400" size={22} />

              <h2 className="text-xl font-bold sm:text-2xl">
                Namenssuche
              </h2>
            </div>

            <input
              className="mt-5 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none transition focus:border-yellow-400"
              placeholder="Name suchen..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search.trim() && (
              <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
                {filteredPeople.map((person) => (
                  <div
                    key={`${person.type}-${person.id}`}
                    className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-yellow-400">
                        <User size={20} />
                      </div>

                      <div>
                        <p className="font-bold">{person.name}</p>

                        <p className="text-sm text-zinc-500">
                          {person.type}
                          {person.category &&
                            person.category !== "Normal" &&
                            ` · ${person.category}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => checkInPerson(person)}
                      disabled={person.checked_in}
                      className={`min-h-11 rounded-xl px-4 py-2 font-bold ${
                        person.checked_in
                          ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                          : person.category === "Blacklist"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-yellow-400 text-black hover:bg-yellow-300"
                      }`}
                    >
                      {person.checked_in
                        ? "Bereits drin"
                        : person.category === "Blacklist"
                          ? "Gesperrt"
                          : "Einchecken"}
                    </button>
                  </div>
                ))}

                {filteredPeople.length === 0 && (
                  <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-400">
                    Keine Person gefunden.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 2xl:sticky 2xl:top-6">
          <div className="flex items-center gap-3">
            <Clock3 className="text-yellow-400" size={22} />

            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Letzte Check-Ins
              </h2>

              <p className="text-sm text-zinc-500">
                Die zehn zuletzt eingecheckten Personen.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recentCheckIns.map((checkIn, index) => (
              <div
                key={`${checkIn.type}-${checkIn.id}`}
                className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 font-bold text-green-400">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{checkIn.name}</p>

                  <p className="text-sm text-zinc-500">
                    {checkIn.type}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-zinc-300">
                  {formatTime(checkIn.checked_in_at)}
                </p>
              </div>
            ))}

            {recentCheckIns.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-zinc-500">
                Noch keine Check-Ins vorhanden.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}