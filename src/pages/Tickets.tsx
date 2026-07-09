import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, RefreshCcw } from "lucide-react";
import { supabase } from "../lib/supabase";

type Ticket = {
  id: string;
  name: string;
  type: "Hauptgast" | "Begleitung";
  ticket_code: string;
  checked_in: boolean;
};

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");

  async function loadTickets() {
    const { data: guests, error: guestError } = await supabase
      .from("guests")
      .select("id, name, ticket_code, checked_in")
      .order("name", { ascending: true });

    if (guestError) {
      alert(guestError.message);
      return;
    }

    const { data: companions, error: companionError } = await supabase
      .from("companions")
      .select("id, name, ticket_code, checked_in")
      .order("name", { ascending: true });

    if (companionError) {
      alert(companionError.message);
      return;
    }

    const guestTickets: Ticket[] =
      guests?.map((guest) => ({
        id: guest.id,
        name: guest.name,
        type: "Hauptgast",
        ticket_code: guest.ticket_code,
        checked_in: guest.checked_in,
      })) ?? [];

    const companionTickets: Ticket[] =
      companions?.map((companion) => ({
        id: companion.id,
        name: companion.name,
        type: "Begleitung",
        ticket_code: companion.ticket_code,
        checked_in: companion.checked_in,
      })) ?? [];

    setTickets([...guestTickets, ...companionTickets]);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) =>
    ticket.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-8 print:hidden">
        <div>
          <p className="text-yellow-400 font-semibold mb-2">QR-System</p>
          <h1 className="text-4xl font-bold">Tickets</h1>
          <p className="text-zinc-400 mt-2">
            Jeder Hauptgast und jede Begleitung hat einen eigenen QR-Code.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 w-full md:w-80 outline-none focus:border-yellow-400"
            placeholder="Ticket suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={loadTickets}
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} />
            Aktualisieren
          </button>

          <button
            onClick={() => window.print()}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            Drucken
          </button>
        </div>
      </div>

      <div className="mb-6 text-zinc-400 print:hidden">
        {filteredTickets.length} Tickets angezeigt
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 ticket-print-grid">        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white rounded-2xl p-6 text-center shadow-xl border border-zinc-200 ticket-card"          >
            <div className="mb-5">
              <h2
                className="text-2xl font-bold"
                style={{ color: "#09090b" }}
              >
                {ticket.name}
              </h2>

              <p
                className="text-sm mt-1"
                style={{ color: "#52525b" }}
              >
                {ticket.type}
              </p>
            </div>

            <div className="flex justify-center bg-white rounded-xl p-3">
              <QRCodeCanvas value={ticket.ticket_code} size={190} />
            </div>

            <div className="mt-5 bg-zinc-100 rounded-xl p-3">
              <p className="text-xs mb-1" style={{ color: "#71717a" }}>
                Ticket-Code
              </p>

              <p
                className="text-sm font-mono break-all"
                style={{ color: "#27272a" }}
              >
                {ticket.ticket_code}
              </p>
            </div>

            <div
              className={`mt-5 rounded-full px-4 py-2 text-sm font-bold print:hidden ${
                ticket.checked_in
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {ticket.checked_in ? "Bereits eingecheckt" : "Noch offen"}
            </div>

            <p className="hidden print:block mt-4 text-sm" style={{ color: "#52525b" }}>
              PartyControl · Oktober
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}