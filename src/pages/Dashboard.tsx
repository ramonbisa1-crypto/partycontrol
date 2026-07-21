import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import {
  EVENT_CONFIG,
  EVENT_START,
} from "../config/event";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastProvider";

type GuestCategory = "Normal" | "VIP" | "Helfer" | "Blacklist";

type Guest = {
  id: string;
  name: string;
  category: GuestCategory;
  checked_in: boolean;
  checked_in_at: string | null;
};

type Companion = {
  id: string;
  name: string;
  checked_in: boolean;
  checked_in_at: string | null;
};

type RecentCheckIn = {
  id: string;
  name: string;
  type: "Hauptgast" | "Begleitung";
  checked_in_at: string;
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  started: boolean;
  finished: boolean;
};

export default function Dashboard() {
  const { showToast } = useToast();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadDashboard(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const [guestResult, companionResult] = await Promise.all([
      supabase
        .from("guests")
        .select("id, name, category, checked_in, checked_in_at")
        .order("name", { ascending: true }),

      supabase
        .from("companions")
        .select("id, name, checked_in, checked_in_at")
        .order("name", { ascending: true }),
    ]);

    if (guestResult.error) {
      showToast({
        type: "error",
        title: "Dashboard konnte nicht geladen werden",
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

    setGuests((guestResult.data ?? []) as Guest[]);
    setCompanions((companionResult.data ?? []) as Companion[]);

    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadDashboard(true);

    const clockInterval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const channel = supabase
      .channel("professional-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guests",
        },
        () => {
          loadDashboard();
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
          loadDashboard();
        }
      )
      .subscribe();

    return () => {
      window.clearInterval(clockInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const statistics = useMemo(() => {
    const totalMainGuests = guests.length;
    const totalCompanions = companions.length;
    const totalPeople = totalMainGuests + totalCompanions;

    const checkedMainGuests = guests.filter(
      (guest) => guest.checked_in
    ).length;

    const checkedCompanions = companions.filter(
      (companion) => companion.checked_in
    ).length;

    const checkedTotal = checkedMainGuests + checkedCompanions;
    const openTotal = Math.max(totalPeople - checkedTotal, 0);

    const vipTotal = guests.filter(
      (guest) => guest.category === "VIP"
    ).length;

    const helperTotal = guests.filter(
      (guest) => guest.category === "Helfer"
    ).length;

    const blacklistTotal = guests.filter(
      (guest) => guest.category === "Blacklist"
    ).length;

    const percentage =
      totalPeople > 0
        ? Math.round((checkedTotal / totalPeople) * 100)
        : 0;

    return {
      totalMainGuests,
      totalCompanions,
      totalPeople,
      checkedMainGuests,
      checkedCompanions,
      checkedTotal,
      openTotal,
      vipTotal,
      helperTotal,
      blacklistTotal,
      percentage,
    };
  }, [guests, companions]);

  const recentCheckIns = useMemo<RecentCheckIn[]>(() => {
    const guestCheckIns: RecentCheckIn[] = guests
      .filter(
        (
          guest
        ): guest is Guest & {
          checked_in_at: string;
        } => guest.checked_in && Boolean(guest.checked_in_at)
      )
      .map((guest) => ({
        id: guest.id,
        name: guest.name,
        type: "Hauptgast",
        checked_in_at: guest.checked_in_at,
      }));

    const companionCheckIns: RecentCheckIn[] = companions
      .filter(
        (
          companion
        ): companion is Companion & {
          checked_in_at: string;
        } =>
          companion.checked_in &&
          Boolean(companion.checked_in_at)
      )
      .map((companion) => ({
        id: companion.id,
        name: companion.name,
        type: "Begleitung",
        checked_in_at: companion.checked_in_at,
      }));

    return [...guestCheckIns, ...companionCheckIns]
      .sort(
        (a, b) =>
          new Date(b.checked_in_at).getTime() -
          new Date(a.checked_in_at).getTime()
      )
      .slice(0, 8);
  }, [guests, companions]);

  const countdown = useMemo(() => {
    return calculateCountdown(currentTime, EVENT_START);
  }, [currentTime]);

  if (loading) {
    return (
      <LoadingState
        title="Dashboard wird geladen"
        description="Die aktuellen Eventdaten werden vorbereitet."
      />
    );
  }

  return (
    <div className="page-enter p-4 sm:p-6 lg:p-10">
      <PageHeader
        eyebrow="Live Event Control"
        title="Dashboard"
        description={`Alle wichtigen Kennzahlen und Check-ins für ${EVENT_CONFIG.name} am ${EVENT_CONFIG.dateLabel}.`}
        actions={
          <>
            <div className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                  Live verbunden
                </p>

                <p className="text-sm font-semibold text-zinc-300">
                  {formatClock(currentTime)}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              icon={<RefreshCcw size={18} />}
              loading={refreshing}
              onClick={() => loadDashboard()}
            >
              Aktualisieren
            </Button>
          </>
        }
      />

      <section className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card
          className="relative overflow-hidden"
          padding="large"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={20}
                    className="text-yellow-400"
                  />

                  <p className="font-bold text-yellow-400">
                    {EVENT_CONFIG.fullDateLabel}
                  </p>
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {EVENT_CONFIG.name}
                </h2>

                <p className="mt-3 max-w-xl leading-7 text-zinc-400">
                  {EVENT_CONFIG.location}
                </p>
              </div>

              <EventStatus countdown={countdown} />
            </div>

            {!countdown.finished && !countdown.started && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <CountdownUnit value={countdown.days} label="Tage" />
                <CountdownUnit value={countdown.hours} label="Stunden" />
                <CountdownUnit value={countdown.minutes} label="Minuten" />
                <CountdownUnit value={countdown.seconds} label="Sekunden" />
              </div>
            )}
          </div>
        </Card>

        <Card
          className="flex flex-col justify-between"
          padding="large"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
                <CheckCircle2 size={23} />
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-500">
                  Einlass-Fortschritt
                </p>

                <p className="text-4xl font-black tracking-tight">
                  {statistics.percentage}%
                </p>
              </div>
            </div>

            <div className="mt-7 h-4 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-700"
                style={{
                  width: `${statistics.percentage}%`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-zinc-400">
                {statistics.checkedTotal} eingecheckt
              </p>

              <p className="font-bold text-zinc-300">
                {statistics.totalPeople} total
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-zinc-800 bg-black/25 p-4">
            <p className="text-sm text-zinc-500">
              Noch offen
            </p>

            <p className="mt-1 text-3xl font-black">
              {statistics.openTotal}
            </p>
          </div>
        </Card>
      </section>

      <section className="mb-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard
          icon={<Users size={22} />}
          title="Personen total"
          value={statistics.totalPeople}
          description={`${statistics.totalMainGuests} Hauptgäste · ${statistics.totalCompanions} Begleitungen`}
          variant="neutral"
        />

        <MetricCard
          icon={<CheckCircle2 size={22} />}
          title="Eingecheckt"
          value={statistics.checkedTotal}
          description={`${statistics.checkedMainGuests} Hauptgäste · ${statistics.checkedCompanions} Begleitungen`}
          variant="success"
        />

        <MetricCard
          icon={<Crown size={22} />}
          title="VIP"
          value={statistics.vipTotal}
          description="VIP-Hauptgäste"
          variant="vip"
        />

        <MetricCard
          icon={<ShieldCheck size={22} />}
          title="Helfer"
          value={statistics.helperTotal}
          description="Erfasste Helfer"
          variant="info"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_0.75fr]">
        <Card padding="large">
          <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Clock3
                  className="text-yellow-400"
                  size={22}
                />

                <h2 className="text-xl font-black sm:text-2xl">
                  Letzte Check-ins
                </h2>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Wird auf allen Geräten automatisch aktualisiert.
              </p>
            </div>

            {lastUpdated && (
              <Badge variant="success">
                Aktualisiert {formatClock(lastUpdated)}
              </Badge>
            )}
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<Clock3 size={28} />}
                title="Noch keine Check-ins"
                description="Sobald die erste Person eingecheckt wird, erscheint sie hier."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {recentCheckIns.map((person, index) => (
                <RecentCheckInRow
                  key={`${person.type}-${person.id}`}
                  person={person}
                  position={index + 1}
                />
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card padding="large">
            <div className="flex items-center gap-3">
              <Sparkles
                size={22}
                className="text-yellow-400"
              />

              <div>
                <h2 className="text-xl font-black">
                  Eventstatus
                </h2>

                <p className="text-sm text-zinc-500">
                  Aktueller Systemzustand
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <StatusRow label="Datenbank" value="Online" status="success" />
              <StatusRow label="QR-Check-in" value="Bereit" status="success" />
              <StatusRow label="Realtime" value="Verbunden" status="success" />
              <StatusRow
                label="Party-Datum"
                value={EVENT_CONFIG.dateLabel}
                status="neutral"
              />
              <StatusRow
                label="Location"
                value={EVENT_CONFIG.locationName}
                status="neutral"
              />
            </div>
          </Card>

          <Card padding="large">
            <div className="flex items-center gap-3">
              <ShieldAlert
                size={22}
                className={
                  statistics.blacklistTotal > 0
                    ? "text-red-400"
                    : "text-zinc-500"
                }
              />

              <div>
                <h2 className="text-xl font-black">
                  Sicherheit
                </h2>

                <p className="text-sm text-zinc-500">
                  Blacklist-Überwachung
                </p>
              </div>
            </div>

            <div
              className={`mt-6 rounded-2xl border p-5 ${
                statistics.blacklistTotal > 0
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-green-500/20 bg-green-500/5"
              }`}
            >
              <p
                className={`text-4xl font-black ${
                  statistics.blacklistTotal > 0
                    ? "text-red-300"
                    : "text-green-300"
                }`}
              >
                {statistics.blacklistTotal}
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {statistics.blacklistTotal === 0
                  ? "Keine Personen auf der Blacklist."
                  : "Beim Einlass besonders beachten."}
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function EventStatus({
  countdown,
}: {
  countdown: Countdown;
}) {
  if (countdown.finished) {
    return <Badge variant="neutral">Event beendet</Badge>;
  }

  if (countdown.started) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4">
        <span className="h-3 w-3 animate-pulse rounded-full bg-green-400" />

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-green-400">
            Live
          </p>

          <p className="font-black text-green-200">
            Party läuft
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
        Countdown
      </p>

      <p className="mt-1 font-black text-yellow-200">
        Die Party beginnt bald
      </p>
    </div>
  );
}

function CountdownUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-center">
      <p className="text-3xl font-black tabular-nums sm:text-4xl">
        {String(value).padStart(2, "0")}
      </p>

      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  description,
  variant,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  description: string;
  variant: "neutral" | "success" | "vip" | "info";
}) {
  const iconStyles = {
    neutral: "bg-zinc-800 text-zinc-300",
    success: "bg-green-500/10 text-green-400",
    vip: "bg-yellow-400/10 text-yellow-400",
    info: "bg-blue-500/10 text-blue-400",
  };

  return (
    <Card hover padding="small">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyles[variant]}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm font-semibold text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-zinc-600 sm:text-sm">
        {description}
      </p>
    </Card>
  );
}

function RecentCheckInRow({
  person,
  position,
}: {
  person: RecentCheckIn;
  position: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-black/20 p-4 transition hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 font-black text-green-400">
        {position}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-black">
          {person.name}
        </p>

        <p className="mt-1 text-sm text-zinc-500">
          {person.type}
        </p>
      </div>

      <div className="text-right">
        <p className="font-bold tabular-nums text-zinc-300">
          {formatClock(new Date(person.checked_in_at))}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          Eingecheckt
        </p>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "success" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            status === "success"
              ? "bg-green-400"
              : "bg-zinc-500"
          }`}
        />

        <p className="text-right text-sm font-bold text-zinc-300">
          {value}
        </p>
      </div>
    </div>
  );
}

function calculateCountdown(
  currentDate: Date,
  eventDate: Date
): Countdown {
  const difference = eventDate.getTime() - currentDate.getTime();

  const eventEndDate = new Date(eventDate);
  eventEndDate.setHours(eventEndDate.getHours() + 12);

  if (currentDate.getTime() > eventEndDate.getTime()) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      started: false,
      finished: true,
    };
  }

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      started: true,
      finished: false,
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    started: false,
    finished: false,
  };
}

function formatClock(date: Date) {
  return date.toLocaleTimeString("de-CH", {
    timeZone: EVENT_CONFIG.timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}