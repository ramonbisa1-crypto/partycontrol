import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  RefreshCcw,
  Search,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";

import { supabase } from "../lib/supabase";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastProvider";
import { EVENT_CONFIG } from "../config/event";

type GuestTicket = {
  id: string;
  name: string;
  category: "Normal" | "VIP" | "Helfer" | "Blacklist";
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
  category?: GuestTicket["category"];
  ticketCode: string;
  checkedIn: boolean;
  onDownload: () => void;
};

export default function Tickets() {
  const { showToast } = useToast();

  const [groups, setGroups] = useState<TicketGroup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGuestId, setExpandedGuestId] =
    useState<string | null>(null);

  async function loadTickets(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const [guestResult, companionResult] = await Promise.all([
      supabase
        .from("guests")
        .select(
          "id, name, category, ticket_code, checked_in"
        )
        .order("name", { ascending: true }),

      supabase
        .from("companions")
        .select(
          "id, guest_id, name, ticket_code, checked_in"
        )
        .order("name", { ascending: true }),
    ]);

    if (guestResult.error) {
      showToast({
        type: "error",
        title: "Tickets konnten nicht geladen werden",
        message: guestResult.error.message,
      });

      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (companionResult.error) {
      showToast({
        type: "error",
        title: "Begleitungen konnten nicht geladen werden",
        message: companionResult.error.message,
      });

      setLoading(false);
      setRefreshing(false);
      return;
    }

    const guests = (guestResult.data ?? []) as GuestTicket[];
    const companions =
      (companionResult.data ?? []) as CompanionTicket[];

    const ticketGroups = guests.map((guest) => ({
      guest,
      companions: companions.filter(
        (companion) => companion.guest_id === guest.id
      ),
    }));

    setGroups(ticketGroups);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadTickets(true);

    const channel = supabase
      .channel("professional-tickets-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guests",
        },
        () => {
          loadTickets();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "companions",
        },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredGroups = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) {
      return groups;
    }

    return groups.filter((group) => {
      const guestMatches =
        group.guest.name.toLowerCase().includes(cleanSearch);

      const companionMatches = group.companions.some(
        (companion) =>
          companion.name.toLowerCase().includes(cleanSearch)
      );

      return guestMatches || companionMatches;
    });
  }, [groups, search]);

  const statistics = useMemo(() => {
    const mainGuests = groups.length;

    const companions = groups.reduce(
      (total, group) => total + group.companions.length,
      0
    );

    const total = mainGuests + companions;

    const used = groups.reduce((total, group) => {
      const guestUsed = group.guest.checked_in ? 1 : 0;

      const companionUsed = group.companions.filter(
        (companion) => companion.checked_in
      ).length;

      return total + guestUsed + companionUsed;
    }, 0);

    return {
      mainGuests,
      companions,
      total,
      used,
      open: Math.max(total - used, 0),
    };
  }, [groups]);

  async function downloadTicket(
    elementId: string,
    personName: string
  ) {
    const element = document.getElementById(elementId);

    if (!element) {
      showToast({
        type: "error",
        title: "Ticket nicht gefunden",
        message:
          "Das Ticket konnte nicht für den Export vorbereitet werden.",
      });

      return;
    }

    try {
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${createSafeFilename(
        personName
      )}-party-ticket.png`;
      link.href = dataUrl;
      link.click();

      showToast({
        type: "success",
        title: "Ticket gespeichert",
        message: `Das Ticket für ${personName} wurde als PNG erstellt.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler";

      showToast({
        type: "error",
        title: "PNG-Export fehlgeschlagen",
        message,
      });
    }
  }

  function printGroup(guestId: string) {
    setExpandedGuestId(guestId);

    window.setTimeout(() => {
      window.print();
    }, 180);
  }

  if (loading) {
    return (
      <LoadingState
        title="Tickets werden geladen"
        description="Die Ticketgruppen werden vorbereitet."
      />
    );
  }

  return (
    <div className="page-enter p-4 sm:p-6 lg:p-10">
      <PageHeader
        eyebrow="Ticket-Verteilung"
        title="Tickets"
        description="Verwalte QR-Tickets für Hauptgäste und Begleitungen, exportiere einzelne Tickets oder drucke ganze Gruppen."
        actions={
          <Button
            variant="secondary"
            icon={<RefreshCcw size={18} />}
            loading={refreshing}
            onClick={() => loadTickets()}
          >
            Aktualisieren
          </Button>
        }
      />

      <section className="no-print mb-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard
          title="Hauptgäste"
          value={statistics.mainGuests}
          icon={<Users size={21} />}
        />

        <SummaryCard
          title="Begleitungen"
          value={statistics.companions}
          icon={<Users size={21} />}
        />

        <SummaryCard
          title="Tickets total"
          value={statistics.total}
          icon={<TicketIcon size={21} />}
        />

        <SummaryCard
          title="Noch offen"
          value={statistics.open}
          icon={<TicketIcon size={21} />}
        />
      </section>

      <Card className="no-print mb-6" padding="small">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
            size={18}
          />

          <input
            className="app-input pl-11"
            placeholder="Hauptgast oder Begleitung suchen..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      </Card>

      {filteredGroups.length === 0 ? (
        <EmptyState
          icon={<TicketIcon size={29} />}
          title="Keine Tickets gefunden"
          description="Passe die Suche an oder erfasse zuerst neue Gäste."
        />
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const isExpanded =
              expandedGuestId === group.guest.id;

            const ticketCount =
              group.companions.length + 1;

            const checkedInCount =
              (group.guest.checked_in ? 1 : 0) +
              group.companions.filter(
                (companion) => companion.checked_in
              ).length;

            return (
              <Card
                key={group.guest.id}
                padding="none"
                className="overflow-hidden"
              >
                <div className="no-print flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGuestId(
                        isExpanded
                          ? null
                          : group.guest.id
                      )
                    }
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                      <Users size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-black">
                          {group.guest.name}
                        </p>

                        <CategoryBadge
                          category={group.guest.category}
                        />
                      </div>

                      <p className="mt-1 text-sm text-zinc-500">
                        {ticketCount} Ticket
                        {ticketCount !== 1 ? "s" : ""} ·{" "}
                        {group.companions.length} Begleitung
                        {group.companions.length !== 1
                          ? "en"
                          : ""}
                      </p>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="font-bold text-zinc-300">
                        {checkedInCount} / {ticketCount}
                      </p>

                      <p className="text-xs text-zinc-600">
                        verwendet
                      </p>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronDown className="shrink-0 text-zinc-500" />
                    )}
                  </button>

                  <Button
                    variant="secondary"
                    icon={<Printer size={18} />}
                    onClick={() =>
                      printGroup(group.guest.id)
                    }
                  >
                    Gruppe drucken
                  </Button>
                </div>

                {isExpanded && (
                  <div className="ticket-print-grid grid grid-cols-1 gap-6 border-t border-zinc-800 p-5 md:grid-cols-2 2xl:grid-cols-3">
                    <TicketCard
                      id={`ticket-guest-${group.guest.id}`}
                      name={group.guest.name}
                      type="Hauptgast"
                      category={group.guest.category}
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TicketCard({
  id,
  name,
  type,
  category,
  ticketCode,
  checkedIn,
  onDownload,
}: TicketCardProps) {
  const shortCode = createShortTicketCode(ticketCode);

  return (
    <div className="ticket-wrapper">
      <div
        id={id}
        className="ticket-card overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white text-center shadow-2xl"
      >
        <div className="relative overflow-hidden bg-[#09090b] px-6 py-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-yellow-400/10 blur-2xl" />

          <div className="relative">
           <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-400">
          {EVENT_CONFIG.name}
          </p>

          <p className="mt-2 text-sm text-zinc-400">
          {EVENT_CONFIG.dateLabel}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
          {EVENT_CONFIG.locationName}
          </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <TicketTypeBadge type={type} />

            {category && category !== "Normal" && (
              <TicketCategoryBadge
                category={category}
              />
            )}
          </div>

          <h2
            className="mt-4 text-2xl font-black leading-tight"
            style={{ color: "#09090b" }}
          >
            {name}
          </h2>

          <div className="mt-6 flex justify-center">
            <div className="rounded-2xl border border-zinc-200 bg-white p-3">
              <QRCodeCanvas
                value={ticketCode}
                size={210}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-100 p-4">
            <p
              className="text-xs font-bold uppercase tracking-[0.16em]"
              style={{ color: "#71717a" }}
            >
              Ticket-Code
            </p>

            <p
              className="mt-2 font-mono text-lg font-black tracking-wider"
              style={{ color: "#18181b" }}
            >
              {shortCode}
            </p>

            <p
              className="mt-2 break-all font-mono text-[10px]"
              style={{ color: "#a1a1aa" }}
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
            {checkedIn
              ? "Bereits eingecheckt"
              : "Noch offen"}
          </div>

          <p
            className="mt-5 text-xs"
            style={{ color: "#a1a1aa" }}
          >
            Dieses Ticket ist persönlich und nur einmal gültig.
          </p>
        </div>
      </div>

      <Button
        className="no-print mt-3"
        fullWidth
        icon={<Download size={18} />}
        onClick={onDownload}
      >
        Als PNG speichern
      </Button>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card hover padding="small">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
        {icon}
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

function CategoryBadge({
  category,
}: {
  category: GuestTicket["category"];
}) {
  if (category === "VIP") {
    return <Badge variant="vip">VIP</Badge>;
  }

  if (category === "Helfer") {
    return <Badge variant="info">Helfer</Badge>;
  }

  if (category === "Blacklist") {
    return <Badge variant="danger">Blacklist</Badge>;
  }

  return <Badge variant="neutral">Normal</Badge>;
}

function TicketTypeBadge({
  type,
}: {
  type: TicketCardProps["type"];
}) {
  return (
    <span
      className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-bold"
      style={{ color: "#52525b" }}
    >
      {type}
    </span>
  );
}

function TicketCategoryBadge({
  category,
}: {
  category: GuestTicket["category"];
}) {
  const styles: Record<
    GuestTicket["category"],
    {
      background: string;
      color: string;
      label: string;
    }
  > = {
    Normal: {
      background: "#f4f4f5",
      color: "#52525b",
      label: "Normal",
    },

    VIP: {
      background: "#fef9c3",
      color: "#a16207",
      label: "VIP",
    },

    Helfer: {
      background: "#dbeafe",
      color: "#1d4ed8",
      label: "Helfer",
    },

    Blacklist: {
      background: "#fee2e2",
      color: "#b91c1c",
      label: "Blacklist",
    },
  };

  const style = styles[category];

  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-bold"
      style={{
        backgroundColor: style.background,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  );
}

function createShortTicketCode(ticketCode: string) {
  return `PC-${ticketCode
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase()}`;
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