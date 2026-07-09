import { useEffect, useState } from "react";
import { CheckCircle, Clock, Crown, Users } from "lucide-react";
import { supabase } from "../lib/supabase";

type Guest = {
  id: string;
  category: string;
  companion_names: string[] | null;
  checked_in: boolean;
};

type Companion = {
  id: string;
  checked_in: boolean;
};

export default function Dashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);

  async function loadData() {
    const { data: guestsData } = await supabase
      .from("guests")
      .select("id, category, companion_names, checked_in");

    const { data: companionsData } = await supabase
      .from("companions")
      .select("id, checked_in");

    setGuests(guestsData ?? []);
    setCompanions(companionsData ?? []);
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, []);

  const totalMainGuests = guests.length;
  const totalCompanions = companions.length;
  const totalPeople = totalMainGuests + totalCompanions;

  const checkedMainGuests = guests.filter((guest) => guest.checked_in).length;
  const checkedCompanions = companions.filter((companion) => companion.checked_in).length;
  const checkedTotal = checkedMainGuests + checkedCompanions;

  const openTotal = totalPeople - checkedTotal;
  const vipTotal = guests.filter((guest) => guest.category === "VIP").length;
  const helperTotal = guests.filter((guest) => guest.category === "Helfer").length;

  return (
    <div className="p-10">
      <div className="mb-8">
        <p className="text-yellow-400 font-semibold mb-2">Live Übersicht</p>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-zinc-400 mt-2">
          Aktuelle Zahlen für Einlass und Gästeverwaltung.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <StatCard icon={<Users />} title="Personen total" value={totalPeople} />
        <StatCard icon={<CheckCircle />} title="Eingecheckt" value={checkedTotal} />
        <StatCard icon={<Clock />} title="Noch offen" value={openTotal} />
        <StatCard icon={<Crown />} title="VIP" value={vipTotal} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5">Einlass Fortschritt</h2>

          <div className="w-full bg-zinc-800 rounded-full h-5 overflow-hidden">
            <div
              className="bg-yellow-400 h-5 rounded-full"
              style={{
                width: totalPeople > 0 ? `${(checkedTotal / totalPeople) * 100}%` : "0%",
              }}
            />
          </div>

          <p className="text-zinc-400 mt-4">
            {checkedTotal} von {totalPeople} Personen eingecheckt
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5">Details</h2>

          <div className="space-y-3 text-zinc-300">
            <p>Hauptgäste: {totalMainGuests}</p>
            <p>Begleitungen: {totalCompanions}</p>
            <p>Helfer: {helperTotal}</p>
            <p>Eingecheckte Hauptgäste: {checkedMainGuests}</p>
            <p>Eingecheckte Begleitungen: {checkedCompanions}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="text-yellow-400 mb-4">{icon}</div>
      <p className="text-zinc-400">{title}</p>
      <h2 className="text-4xl font-bold mt-2">{value}</h2>
    </div>
  );
}