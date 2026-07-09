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
    const { data: guests } = await supabase
      .from("guests")
      .select("id, name, ticket_code, checked_in")
      .order("name", { ascending: true });

    const { data: companions } = await supabase
      .from("companions")
      .select("id, name, ticket_code, checked_in")
      .order("name", { ascending: true });

    const guestTickets =
      guests?.map((guest) => ({
        id: guest.id,
        name: guest.name,
        type: "Hauptgast" as const,
        ticket_code: guest.ticket_code,
        checked_in: guest.checked_in,
      })) ?? [];

    const companionTickets =
      companions?.map((companion) => ({
        id: companion.id,
        name: companion.name,
        type: "Begleitung" as const,
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
      <div className="no-print flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-8">
        <div>
          <p className="text-yellow-400 font-semibold mb-2">QR-System</p>
          <h1 className="text-4xl font-black tracking-tight">Tickets</h1>
          <p className="text-zinc-400 mt-2">
            Hauptgäste und Begleitungen haben je einen eigenen QR-Code.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 w-full md:w-80 outline-none focus:border-yellow-400"
            placeholder="Ticket suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={loadTickets}
            className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
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

      <div className="no-print mb-6 text-zinc-400">
        {filteredTickets.length} Tickets angezeigt
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 ticket-print-grid">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="ticket-card bg-white rounded-3xl p-6 text-center shadow-2xl border border-zinc-200"
          >
            <p style={{ color: "#ca8a04" }} className="text-xs font-black tracking-[0.25em] uppercase mb-3">
              Birthday Party
            </p>

            <h2
              className="text-2xl font-black leading-tight"
              style={{ color: "#09090b" }}
            >
              {ticket.name}
            </h2>

            <p className="text-sm mt-1 mb-5" style={{ color: "#52525b" }}>
              {ticket.type}
            </p>

            <div className="flex justify-center bg-white rounded-xl p-3">
              <QRCodeCanvas value={ticket.ticket_code} size={190} />
            </div>

            <div className="mt-5 bg-zinc-100 rounded-2xl p-3">
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
              className={`no-print mt-5 rounded-full px-4 py-2 text-sm font-bold ${
                ticket.checked_in
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {ticket.checked_in ? "Bereits eingecheckt" : "Noch offen"}
            </div>

            <p className="mt-5 text-xs" style={{ color: "#71717a" }}>
              PartyControl · Oktober
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}