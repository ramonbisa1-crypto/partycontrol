import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Crown,
  RefreshCcw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Guest = {
  id: string;
  name: string;
  category: string;
  checked_in: boolean;
  checked_in_at: string | null;
};

type Companion = {
  id: string;
  name: string;
  checked_in: boolean;
  checked_in_at: string | null;
};

type RecentPerson = {
  id: string;
  name: string;
  type: "Hauptgast" | "Begleitung";
  checked_in_at: string;
};

export default function Dashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData(showLoading = false) {
    if (showLoading) {
      setLoading(true);
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
      setErrorMessage(guestResult.error.message);
      setLoading(false);
      return;
    }

    if (companionResult.error) {
      setErrorMessage(companionResult.error.message);
      setLoading(false);
      return;
    }

    setGuests(guestResult.data ?? []);
    setCompanions(companionResult.data ?? []);
    setErrorMessage("");
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    loadData(true);

    const channel = supabase
      .channel("partycontrol-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guests",
        },
        () => {
          loadData();
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
          loadData();
        }
      )
      .subscribe();

    return () => {
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
      totalPeople > 0 ? Math.round((checkedTotal / totalPeople) * 100) : 0;

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

  const recentCheckIns = useMemo<RecentPerson[]>(() => {
    const guestCheckIns: RecentPerson[] = guests
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

    const companionCheckIns: RecentPerson[] = companions
      .filter(
        (
          companion
        ): companion is Companion & {
          checked_in_at: string;
        } => companion.checked_in && Boolean(companion.checked_in_at)
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

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-yellow-400" />

          <p className="mt-4 text-zinc-400">
            Dashboard wird geladen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />

            <p className="font-semibold text-green-400">
              Live verbunden
            </p>
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 text-zinc-400">
            Live-Übersicht über Gäste und Check-Ins.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {lastUpdated && (
            <p className="text-sm text-zinc-500">
              Aktualisiert um{" "}
              {lastUpdated.toLocaleTimeString("de-CH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}

          <button
            type="button"
            onClick={() => loadData(true)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            <RefreshCcw size={18} />
            Aktualisieren
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          Daten konnten nicht geladen werden: {errorMessage}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users size={22} />}
          title="Personen total"
          value={statistics.totalPeople}
          description={`${statistics.totalMainGuests} Hauptgäste · ${statistics.totalCompanions} Begleitungen`}
        />

        <StatCard
          icon={<CheckCircle2 size={22} />}
          title="Eingecheckt"
          value={statistics.checkedTotal}
          description={`${statistics.percentage}% angekommen`}
        />

        <StatCard
          icon={<Clock3 size={22} />}
          title="Noch offen"
          value={statistics.openTotal}
          description="Noch nicht eingecheckt"
        />

        <StatCard
          icon={<Crown size={22} />}
          title="VIP"
          value={statistics.vipTotal}
          description="Erfasste VIP-Hauptgäste"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  Einlass-Fortschritt
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Anteil der bereits eingecheckten Personen.
                </p>
              </div>

              <p className="text-4xl font-black text-yellow-400">
                {statistics.percentage}%
              </p>
            </div>

            <div className="mt-6 h-5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-700"
                style={{
                  width: `${statistics.percentage}%`,
                }}
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-400 sm:flex-row sm:justify-between">
              <p>
                {statistics.checkedTotal} von {statistics.totalPeople} Personen
              </p>

              <p>{statistics.openTotal} Personen noch offen</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DetailCard
              icon={<UserRound size={20} />}
              title="Hauptgäste drin"
              value={statistics.checkedMainGuests}
            />

            <DetailCard
              icon={<Users size={20} />}
              title="Begleitungen drin"
              value={statistics.checkedCompanions}
            />

            <DetailCard
              icon={<ShieldCheck size={20} />}
              title="Helfer"
              value={statistics.helperTotal}
            />
          </section>

          {statistics.blacklistTotal > 0 && (
            <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
              <p className="font-bold text-red-300">
                Achtung: {statistics.blacklistTotal} Einträge sind als Blacklist
                markiert.
              </p>
            </section>
          )}
        </div>

        <section className="h-fit rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 2xl:sticky 2xl:top-6">
          <div className="flex items-center gap-3">
            <Clock3 className="text-yellow-400" size={22} />

            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Letzte Check-Ins
              </h2>

              <p className="text-sm text-zinc-500">
                Wird auf allen Geräten live aktualisiert.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recentCheckIns.map((person, index) => (
              <div
                key={`${person.type}-${person.id}`}
                className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 font-bold text-green-400">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{person.name}</p>

                  <p className="text-sm text-zinc-500">
                    {person.type}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-zinc-300">
                  {new Date(person.checked_in_at).toLocaleTimeString("de-CH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}

            {recentCheckIns.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-7 text-center text-zinc-500">
                Noch keine Check-Ins vorhanden.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
        {icon}
      </div>

      <p className="mt-5 text-sm font-semibold text-zinc-400">
        {title}
      </p>

      <p className="mt-1 text-4xl font-black tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function DetailCard({
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