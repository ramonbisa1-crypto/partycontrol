import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../lib/supabase";

type Person = {
  id: string;
  name: string;
  type: "Hauptgast" | "Begleitung";
  ticket_code: string;
  checked_in: boolean;
  checked_in_at: string | null;
};

export default function CheckIn() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [lastPerson, setLastPerson] = useState<Person | null>(null);
  const [manualCode, setManualCode] = useState("");

  async function loadPeople() {
    const { data: guests } = await supabase
      .from("guests")
      .select("id, name, ticket_code, checked_in, checked_in_at");

    const { data: companions } = await supabase
      .from("companions")
      .select("id, name, ticket_code, checked_in, checked_in_at");

    const guestPeople: Person[] =
      guests?.map((guest) => ({
        id: guest.id,
        name: guest.name,
        type: "Hauptgast",
        ticket_code: guest.ticket_code,
        checked_in: guest.checked_in,
        checked_in_at: guest.checked_in_at,
      })) ?? [];

    const companionPeople: Person[] =
      companions?.map((companion) => ({
        id: companion.id,
        name: companion.name,
        type: "Begleitung",
        ticket_code: companion.ticket_code,
        checked_in: companion.checked_in,
        checked_in_at: companion.checked_in_at,
      })) ?? [];

    setPeople([...guestPeople, ...companionPeople]);
  }

  async function handleTicket(ticketCode: string) {
    const cleanCode = ticketCode.trim();

    if (!cleanCode) {
      alert("Bitte Ticket-Code eingeben.");
      return;
    }

    const person = people.find((item) => item.ticket_code === cleanCode);

    if (!person) {
      setLastPerson(null);
      setMessage("Ticket nicht gefunden.");
      return;
    }

    await checkInPerson(person);
  }

  async function checkInPerson(person: Person) {
    if (person.checked_in) {
      setLastPerson(person);
      setMessage("Diese Person ist bereits eingecheckt.");
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
      alert(error.message);
      return;
    }

    const updatedPerson = {
      ...person,
      checked_in: true,
      checked_in_at: now,
    };

    setLastPerson(updatedPerson);
    setMessage("Check-In erfolgreich.");
    setManualCode("");
    setSearch("");

    await loadPeople();
  }

  useEffect(() => {
    loadPeople();

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        handleTicket(decodedText);
      },
      () => {}
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  const filteredPeople = people.filter((person) =>
    person.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10">
      <div className="mb-8">
        <p className="text-yellow-400 font-semibold mb-2">Einlass</p>
        <h1 className="text-4xl font-bold">Check-In</h1>
        <p className="text-zinc-400 mt-2">
          QR-Code scannen, Ticket-Code eingeben oder per Name suchen.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5">QR-Scanner</h2>

          <div className="bg-white rounded-xl p-4">
            <div id="qr-reader"></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-5">Manueller Check-In</h2>

            <input
              className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 w-full outline-none focus:border-yellow-400"
              placeholder="Ticket-Code einfügen..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />

            <button
              onClick={() => handleTicket(manualCode)}
              className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-xl transition w-full"
            >
              Mit Code einchecken
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-5">Namenssuche</h2>

            <input
              className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 w-full outline-none focus:border-yellow-400"
              placeholder="Name suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                {filteredPeople.map((person) => (
                  <div
                    key={person.id}
                    className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold">{person.name}</p>
                      <p className="text-sm text-zinc-400">{person.type}</p>
                    </div>

                    <button
                      onClick={() => checkInPerson(person)}
                      className={`px-4 py-2 rounded-xl font-bold ${
                        person.checked_in
                          ? "bg-zinc-700 text-zinc-300"
                          : "bg-yellow-400 text-black hover:bg-yellow-300"
                      }`}
                    >
                      {person.checked_in ? "Bereits drin" : "Einchecken"}
                    </button>
                  </div>
                ))}

                {filteredPeople.length === 0 && (
                  <p className="text-zinc-400">Keine Person gefunden.</p>
                )}
              </div>
            )}
          </div>

          {message && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-xl font-bold">{message}</p>

              {lastPerson && (
                <div className="mt-4">
                  <p className="text-3xl font-bold">{lastPerson.name}</p>
                  <p className="text-zinc-400">{lastPerson.type}</p>

                  {lastPerson.checked_in_at && (
                    <p className="text-zinc-400 mt-3">
                      Check-In Zeit:{" "}
                      {new Date(lastPerson.checked_in_at).toLocaleTimeString(
                        "de-CH",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}