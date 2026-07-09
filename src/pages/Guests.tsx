import { useEffect, useState } from "react";
import { Edit, Save, Trash2, UserPlus, Users, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type Guest = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  category: string;
  companions: number;
  companion_names: string[] | null;
  checked_in: boolean;
  created_at: string;
};

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Normal");
  const [companionNames, setCompanionNames] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCategory, setEditCategory] = useState("Normal");

  async function loadGuests() {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setGuests(data ?? []);
  }

  async function addGuest() {
    if (!name.trim()) {
      alert("Bitte Name eingeben.");
      return;
    }

    const companionList = companionNames
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const { data: guestData, error: guestError } = await supabase
      .from("guests")
      .insert({
        name,
        phone,
        category,
        companions: companionList.length,
        companion_names: companionList,
      })
      .select()
      .single();

    if (guestError) {
      alert(guestError.message);
      return;
    }

    if (companionList.length > 0) {
      const companionsToInsert = companionList.map((companionName) => ({
        guest_id: guestData.id,
        name: companionName,
      }));

      const { error: companionError } = await supabase
        .from("companions")
        .insert(companionsToInsert);

      if (companionError) {
        alert(companionError.message);
        return;
      }
    }

    setName("");
    setPhone("");
    setCategory("Normal");
    setCompanionNames("");
    loadGuests();
  }

  function startEdit(guest: Guest) {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditPhone(guest.phone ?? "");
    setEditCategory(guest.category);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
    setEditCategory("Normal");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) {
      alert("Bitte Name eingeben.");
      return;
    }

    const { error } = await supabase
      .from("guests")
      .update({
        name: editName,
        phone: editPhone,
        category: editCategory,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    cancelEdit();
    loadGuests();
  }

  async function deleteGuest(id: string) {
    const confirmDelete = confirm("Diesen Gast wirklich löschen?");

    if (!confirmDelete) return;

    const { error } = await supabase.from("guests").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadGuests();
  }

  useEffect(() => {
    loadGuests();
  }, []);

  const filteredGuests = guests.filter((guest) =>
    guest.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalGuests = guests.length;

  const totalCompanions = guests.reduce((sum, guest) => {
    return sum + (guest.companion_names?.length ?? 0);
  }, 0);

  const totalPeople = totalGuests + totalCompanions;

  return (
    <div className="p-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
        <div>
          <p className="text-yellow-400 font-semibold mb-2">Gästeverwaltung</p>
          <h1 className="text-4xl font-bold">Gäste</h1>
          <p className="text-zinc-400 mt-2">
            Hauptgäste und Begleitungen verwalten.
          </p>
        </div>

        <input
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 w-full md:w-80 outline-none focus:border-yellow-400"
          placeholder="Gast suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard title="Hauptgäste" value={totalGuests} />
        <StatCard title="Begleitungen" value={totalCompanions} />
        <StatCard title="Personen total" value={totalPeople} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <UserPlus className="text-yellow-400" />
          <h2 className="text-2xl font-bold">Gast hinzufügen</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-yellow-400"
            placeholder="Name Hauptgast"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-yellow-400"
            placeholder="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <select
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-yellow-400"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Normal</option>
            <option>VIP</option>
            <option>Helfer</option>
            <option>Blacklist</option>
          </select>

          <input
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
            value={
              companionNames
                .split("\n")
                .filter((item) => item.trim().length > 0).length
            }
            readOnly
            placeholder="Anzahl Begleitung"
          />

          <textarea
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 md:col-span-4 min-h-28 outline-none focus:border-yellow-400"
            placeholder={
              "Begleitung eintragen, ein Name pro Zeile\nz.B.\nLuca Meier\nNoah Keller"
            }
            value={companionNames}
            onChange={(e) => setCompanionNames(e.target.value)}
          />
        </div>

        <button
          onClick={addGuest}
          className="mt-5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-xl transition"
        >
          Gast speichern
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
          <Users className="text-yellow-400" />
          <h2 className="text-xl font-bold">Gästeliste</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="bg-zinc-950 text-zinc-400">
              <tr>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Telefon</th>
                <th className="text-left p-4">Kategorie</th>
                <th className="text-left p-4">Begleitung</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Aktion</th>
              </tr>
            </thead>

            <tbody>
              {filteredGuests.map((guest) => {
                const isEditing = editingId === guest.id;

                return (
                  <tr
                    key={guest.id}
                    className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                  >
                    <td className="p-4 font-semibold">
                      {isEditing ? (
                        <input
                          className="bg-zinc-800 border border-zinc-700 rounded-xl p-2 outline-none focus:border-yellow-400"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        guest.name
                      )}
                    </td>

                    <td className="p-4 text-zinc-300">
                      {isEditing ? (
                        <input
                          className="bg-zinc-800 border border-zinc-700 rounded-xl p-2 outline-none focus:border-yellow-400"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                        />
                      ) : (
                        guest.phone || "-"
                      )}
                    </td>

                    <td className="p-4">
                      {isEditing ? (
                        <select
                          className="bg-zinc-800 border border-zinc-700 rounded-xl p-2 outline-none focus:border-yellow-400"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                        >
                          <option>Normal</option>
                          <option>VIP</option>
                          <option>Helfer</option>
                          <option>Blacklist</option>
                        </select>
                      ) : (
                        <span className="bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-sm">
                          {guest.category}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <p className="font-semibold">
                        +{guest.companion_names?.length ?? 0}
                      </p>

                      <div className="text-sm text-zinc-400 mt-1">
                        {guest.companion_names?.map((companion) => (
                          <div key={companion}>{companion}</div>
                        ))}
                      </div>
                    </td>

                    <td className="p-4">
                      {guest.checked_in ? (
                        <span className="bg-green-500/10 text-green-400 rounded-full px-3 py-1 text-sm font-semibold">
                          Drin
                        </span>
                      ) : (
                        <span className="bg-yellow-500/10 text-yellow-400 rounded-full px-3 py-1 text-sm font-semibold">
                          Offen
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => saveEdit(guest.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Save />
                          </button>

                          <button
                            onClick={cancelEdit}
                            className="text-zinc-400 hover:text-zinc-300"
                          >
                            <X />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => startEdit(guest)}
                            className="text-yellow-400 hover:text-yellow-300"
                          >
                            <Edit />
                          </button>

                          <button
                            onClick={() => deleteGuest(guest.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredGuests.length === 0 && (
                <tr>
                  <td className="p-6 text-zinc-400" colSpan={6}>
                    Keine Gäste gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <p className="text-zinc-400">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
}