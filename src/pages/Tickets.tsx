import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  RefreshCcw,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { toPng } from "html-to-image";

import { supabase } from "../lib/supabase";

type GuestTicket = {
  id: string;
  name: string;
  ticket_code: string;
  checked_in: boolean;
};

type CompanionTicket = {
  id: string;
  guest_id: string;
  name: string;
  ticket_code: string;
  checked_in: boolean;
};

type TicketGroup = {
  guest: GuestTicket;
  companions: CompanionTicket[];
};

type TicketCardProps = {
  id: string;
  name: string;
  type: "Hauptgast" | "Begleitung";
  ticketCode: string;
  checkedIn: boolean;
  onDownload: () => void;
};

export default function Tickets() {
  const [groups, setGroups] = useState<TicketGroup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadTickets() {
    setLoading(true);
    setErrorMessage("");

    const [guestResult, companionResult] = await Promise.all([
      supabase
        .from("guests")
        .select("id, name, ticket_code, checked_in")
        .order("name", { ascending: true }),

      supabase
        .from("companions")
        .select("id, guest_id, name, ticket_code, checked_in")
        .order("name", { ascending: true }),
    ]);

    if (guestResult.error) {
      setErrorMessage(guestResult.error.message);
      setLoading(false);
      return;
    }

    if (companionResult.error) {
      setErrorMessage(companionResult.error.message);
      setLoading(false);
      return;
    }

    const guests: GuestTicket[] = guestResult.data ?? [];
    const companions: CompanionTicket[] = companionResult.data ?? [];

    const ticketGroups = guests.map((guest) => ({
      guest,
      companions: companions.filter(
        (companion) => companion.guest_id === guest.id
      ),
    }));

    setGroups(ticketGroups);
    setLoading(false);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredGroups = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) {
      return groups;
    }

    return groups.filter((group) => {
      const guestMatches = group.guest.name
        .toLowerCase()
        .includes(cleanSearch);

      const companionMatches = group.companions.some((companion) =>
        companion.name.toLowerCase().includes(cleanSearch)
      );

      return guestMatches || companionMatches;
    });
  }, [groups, search]);

  async function downloadTicket(elementId: string, name: string) {
    const element = document.getElementById(elementId);

    if (!element) {
      alert("Ticket konnte nicht gefunden werden.");
      return;
    }

    try {
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${createSafeFilename(name)}-ticket.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler";

      alert(`Ticket konnte nicht gespeichert werden: ${message}`);
    }
  }

  function printGroup(guestId: string) {
    setExpandedGuestId(guestId);

    window.setTimeout(() => {
      window.print();
    }, 150);
  }

  const totalTickets = groups.reduce(
    (sum, group) => sum + 1 + group.companions.length,
    0
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-yellow-400" />

          <p className="mt-4 text-zinc-400">
            Tickets werden geladen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="no-print mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 font-semibold text-yellow-400">
            Ticket-Verteilung
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Tickets
          </h1>

          <p className="mt-2 text-zinc-400">
            Hauptgäste und Begleitungen sind als Gruppen organisiert.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none transition focus:border-yellow-400 sm:w-80"
            placeholder="Gast oder Begleitung suchen..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button
            type="button"
            onClick={loadTickets}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 font-bold transition hover:bg-zinc-900"
          >
            <RefreshCcw size={18} />
            Aktualisieren
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="no-print mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          Tickets konnten nicht geladen werden: {errorMessage}
        </div>
      )}

      <div className="no-print mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Users size={21} />}
          title="Hauptgäste"
          value={groups.length}
        />

        <SummaryCard
          icon={<TicketIcon size={21} />}
          title="Tickets total"
          value={totalTickets}
        />

        <SummaryCard
          icon={<Users size={21} />}
          title="Begleitungen"
          value={Math.max(totalTickets - groups.length, 0)}
        />
      </div>

      <div className="space-y-4">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGuestId === group.guest.id;
          const groupTicketCount = group.companions.length + 1;

          return (
            <section
              key={group.guest.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-950"
            >
              <div className="no-print flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGuestId(
                      isExpanded ? null : group.guest.id
                    )
                  }
                  className="flex flex-1 items-center gap-4 text-left"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                    <Users size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-black">
                      {group.guest.name}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {groupTicketCount} Ticket
                      {groupTicketCount !== 1 ? "s" : ""} ·{" "}
                      {group.companions.length} Begleitung
                      {group.companions.length !== 1 ? "en" : ""}
                    </p>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronDown className="shrink-0 text-zinc-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => printGroup(group.guest.id)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold transition hover:bg-zinc-800"
                >
                  <Printer size={18} />
                  Gruppe drucken
                </button>
              </div>

              {isExpanded && (
                <div className="ticket-print-grid grid grid-cols-1 gap-6 border-t border-zinc-800 p-5 md:grid-cols-2 xl:grid-cols-3">
                  <TicketCard
                    id={`ticket-guest-${group.guest.id}`}
                    name={group.guest.name}
                    type="Hauptgast"
                    ticketCode={group.guest.ticket_code}
                    checkedIn={group.guest.checked_in}
                    onDownload={() =>
                      downloadTicket(
                        `ticket-guest-${group.guest.id}`,
                        group.guest.name
                      )
                    }
                  />

                  {group.companions.map((companion) => (
                    <TicketCard
                      key={companion.id}
                      id={`ticket-companion-${companion.id}`}
                      name={companion.name}
                      type="Begleitung"
                      ticketCode={companion.ticket_code}
                      checkedIn={companion.checked_in}
                      onDownload={() =>
                        downloadTicket(
                          `ticket-companion-${companion.id}`,
                          companion.name
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="rounded-3xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
            Keine passenden Tickets gefunden.
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({
  id,
  name,
  type,
  ticketCode,
  checkedIn,
  onDownload,
}: TicketCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="ticket-wrapper">
      <div
        id={id}
        ref={cardRef}
        className="ticket-card overflow-hidden rounded-3xl border border-zinc-200 bg-white text-center shadow-2xl"
      >
        <div className="bg-[#09090b] px-5 py-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-400">
            Birthday Party
          </p>

          <p className="mt-2 text-sm text-zinc-400">
            PartyControl · Oktober
          </p>
        </div>

        <div className="p-6">
          <h2
            className="text-2xl font-black leading-tight"
            style={{ color: "#09090b" }}
          >
            {name}
          </h2>

          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: "#71717a" }}
          >
            {type}
          </p>

          <div className="mt-5 flex justify-center">
            <QRCodeCanvas
              value={ticketCode}
              size={210}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <div className="mt-5 rounded-2xl bg-zinc-100 p-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#71717a" }}
            >
              Ticket-Code
            </p>

            <p
              className="mt-1 break-all font-mono text-xs"
              style={{ color: "#27272a" }}
            >
              {ticketCode}
            </p>
          </div>

          <div
            className={`no-print mt-5 rounded-full px-4 py-2 text-sm font-bold ${
              checkedIn
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {checkedIn ? "Bereits eingecheckt" : "Noch offen"}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDownload}
        className="no-print mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black transition hover:bg-yellow-300"
      >
        <Download size={18} />
        Als PNG speichern
      </button>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="text-yellow-400">{icon}</div>

      <p className="mt-4 text-sm text-zinc-500">{title}</p>

      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function createSafeFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}