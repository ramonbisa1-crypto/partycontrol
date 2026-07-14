import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Edit3,
  Phone,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastProvider";

type GuestCategory = "Normal" | "VIP" | "Helfer" | "Blacklist";

type Guest = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  category: GuestCategory;
  companions: number;
  companion_names: string[] | null;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
};

type CategoryFilter = "Alle" | GuestCategory;
type StatusFilter = "Alle" | "Offen" | "Eingecheckt";

type EditState = {
  id: string;
  name: string;
  phone: string;
  category: GuestCategory;
};

export default function Guests() {
  const { showToast } = useToast();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGuest, setSavingGuest] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingGuest, setDeletingGuest] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("Alle");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("Alle");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] =
    useState<GuestCategory>("Normal");
  const [companionNames, setCompanionNames] = useState("");

  const [editState, setEditState] = useState<EditState | null>(
    null
  );

  const [guestToDelete, setGuestToDelete] =
    useState<Guest | null>(null);

  async function loadGuests(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showToast({
        type: "error",
        title: "Gäste konnten nicht geladen werden",
        message: error.message,
      });

      setLoading(false);
      return;
    }

    setGuests((data ?? []) as Guest[]);
    setLoading(false);
  }

  useEffect(() => {
    loadGuests(true);

    const channel = supabase
      .channel("guests-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guests",
        },
        () => {
          loadGuests();
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
          loadGuests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const companionList = useMemo(() => {
    return companionNames
      .split("\n")
      .map((companionName) => companionName.trim())
      .filter(Boolean);
  }, [companionNames]);

  async function addGuest() {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      showToast({
        type: "warning",
        title: "Name fehlt",
        message: "Bitte gib den Namen des Hauptgastes ein.",
      });

      return;
    }

    setSavingGuest(true);

    const { data: guestData, error: guestError } =
      await supabase
        .from("guests")
        .insert({
          name: cleanName,
          phone: cleanPhone || null,
          category,
          companions: companionList.length,
          companion_names: companionList,
        })
        .select()
        .single();

    if (guestError) {
      showToast({
        type: "error",
        title: "Gast konnte nicht gespeichert werden",
        message: guestError.message,
      });

      setSavingGuest(false);
      return;
    }

    if (companionList.length > 0) {
      const companionsToInsert = companionList.map(
        (companionName) => ({
          guest_id: guestData.id,
          name: companionName,
        })
      );

      const { error: companionError } = await supabase
        .from("companions")
        .insert(companionsToInsert);

      if (companionError) {
        await supabase
          .from("guests")
          .delete()
          .eq("id", guestData.id);

        showToast({
          type: "error",
          title: "Begleitungen konnten nicht gespeichert werden",
          message: companionError.message,
        });

        setSavingGuest(false);
        return;
      }
    }

    setName("");
    setPhone("");
    setCategory("Normal");
    setCompanionNames("");
    setSavingGuest(false);

    showToast({
      type: "success",
      title: "Gast gespeichert",
      message:
        companionList.length > 0
          ? `${cleanName} und ${companionList.length} Begleitung(en) wurden erstellt.`
          : `${cleanName} wurde erfolgreich erstellt.`,
    });

    await loadGuests();
  }

  function startEditing(guest: Guest) {
    setEditState({
      id: guest.id,
      name: guest.name,
      phone: guest.phone ?? "",
      category: guest.category,
    });
  }

  function cancelEditing() {
    setEditState(null);
  }

  async function saveEdit() {
    if (!editState) {
      return;
    }

    const cleanName = editState.name.trim();
    const cleanPhone = editState.phone.trim();

    if (!cleanName) {
      showToast({
        type: "warning",
        title: "Name fehlt",
        message: "Der Name darf nicht leer sein.",
      });

      return;
    }

    setSavingEdit(true);

    const { error } = await supabase
      .from("guests")
      .update({
        name: cleanName,
        phone: cleanPhone || null,
        category: editState.category,
      })
      .eq("id", editState.id);

    if (error) {
      showToast({
        type: "error",
        title: "Änderungen konnten nicht gespeichert werden",
        message: error.message,
      });

      setSavingEdit(false);
      return;
    }

    showToast({
      type: "success",
      title: "Gast aktualisiert",
      message: `Die Änderungen für ${cleanName} wurden gespeichert.`,
    });

    setEditState(null);
    setSavingEdit(false);
    await loadGuests();
  }

  async function deleteGuest() {
    if (!guestToDelete) {
      return;
    }

    setDeletingGuest(true);

    const { error } = await supabase
      .from("guests")
      .delete()
      .eq("id", guestToDelete.id);

    if (error) {
      showToast({
        type: "error",
        title: "Gast konnte nicht gelöscht werden",
        message: error.message,
      });

      setDeletingGuest(false);
      return;
    }

    showToast({
      type: "success",
      title: "Gast gelöscht",
      message: `${guestToDelete.name} und die zugehörigen Begleitungen wurden entfernt.`,
    });

    setGuestToDelete(null);
    setDeletingGuest(false);
    await loadGuests();
  }

  const filteredGuests = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return guests.filter((guest) => {
      const companionMatches =
        guest.companion_names?.some((companionName) =>
          companionName.toLowerCase().includes(cleanSearch)
        ) ?? false;

      const matchesSearch =
        !cleanSearch ||
        guest.name.toLowerCase().includes(cleanSearch) ||
        guest.phone?.toLowerCase().includes(cleanSearch) ||
        companionMatches;

      const matchesCategory =
        categoryFilter === "Alle" ||
        guest.category === categoryFilter;

      const matchesStatus =
        statusFilter === "Alle" ||
        (statusFilter === "Eingecheckt" && guest.checked_in) ||
        (statusFilter === "Offen" && !guest.checked_in);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [guests, search, categoryFilter, statusFilter]);

  const statistics = useMemo(() => {
    const mainGuests = guests.length;

    const companions = guests.reduce(
      (total, guest) =>
        total + (guest.companion_names?.length ?? 0),
      0
    );

    const totalPeople = mainGuests + companions;

    const checkedIn = guests.filter(
      (guest) => guest.checked_in
    ).length;

    const vip = guests.filter(
      (guest) => guest.category === "VIP"
    ).length;

    const helpers = guests.filter(
      (guest) => guest.category === "Helfer"
    ).length;

    const blacklist = guests.filter(
      (guest) => guest.category === "Blacklist"
    ).length;

    return {
      mainGuests,
      companions,
      totalPeople,
      checkedIn,
      vip,
      helpers,
      blacklist,
    };
  }, [guests]);

  if (loading) {
    return (
      <LoadingState
        title="Gäste werden geladen"
        description="Die aktuelle Gästeliste wird vorbereitet."
      />
    );
  }

  return (
    <div className="page-enter p-4 sm:p-6 lg:p-10">
      <PageHeader
        eyebrow="Gästeverwaltung"
        title="Gäste"
        description="Verwalte Hauptgäste, Begleitungen, Kategorien und Check-in-Status."
      />

      <section className="mb-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatisticCard
          icon={<UserRound size={22} />}
          title="Hauptgäste"
          value={statistics.mainGuests}
          description={`${statistics.companions} Begleitungen`}
        />

        <StatisticCard
          icon={<Users size={22} />}
          title="Personen total"
          value={statistics.totalPeople}
          description="Hauptgäste und Begleitungen"
        />

        <StatisticCard
          icon={<Crown size={22} />}
          title="VIP"
          value={statistics.vip}
          description={`${statistics.helpers} Helfer`}
        />

        <StatisticCard
          icon={<ShieldCheck size={22} />}
          title="Eingecheckt"
          value={statistics.checkedIn}
          description={
            statistics.blacklist > 0
              ? `${statistics.blacklist} Blacklist`
              : "Keine Blacklist-Einträge"
          }
        />
      </section>

      <Card className="mb-7" padding="large">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
            <Plus size={23} />
          </div>

          <div>
            <h2 className="text-xl font-black sm:text-2xl">
              Gast hinzufügen
            </h2>

            <p className="text-sm text-zinc-500">
              Begleitungen erhalten automatisch eigene Tickets.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="app-label" htmlFor="new-guest-name">
              Name des Hauptgastes
            </label>

            <input
              id="new-guest-name"
              className="app-input"
              placeholder="z.B. Ramon Bisa"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
            />
          </div>

          <div>
            <label className="app-label" htmlFor="new-guest-phone">
              Telefonnummer
            </label>

            <input
              id="new-guest-phone"
              className="app-input"
              placeholder="z.B. 079 000 00 00"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={40}
            />
          </div>

          <div>
            <label
              className="app-label"
              htmlFor="new-guest-category"
            >
              Kategorie
            </label>

            <select
              id="new-guest-category"
              className="app-input"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value as GuestCategory
                )
              }
            >
              <option value="Normal">Normal</option>
              <option value="VIP">VIP</option>
              <option value="Helfer">Helfer</option>
              <option value="Blacklist">Blacklist</option>
            </select>
          </div>

          <div>
            <label className="app-label">
              Anzahl Begleitungen
            </label>

            <div className="app-input flex items-center text-zinc-300">
              {companionList.length}
            </div>
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <label
              className="app-label"
              htmlFor="new-companions"
            >
              Begleitungen
            </label>

            <textarea
              id="new-companions"
              className="app-input min-h-32 resize-y"
              placeholder={
                "Ein Name pro Zeile\nz.B.\nLuca Meier\nNoah Keller"
              }
              value={companionNames}
              onChange={(event) =>
                setCompanionNames(event.target.value)
              }
              maxLength={2000}
            />

            <p className="mt-2 text-xs text-zinc-600">
              Jede Zeile wird als eigene Begleitperson mit
              individuellem QR-Code gespeichert.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            icon={<Plus size={19} />}
            loading={savingGuest}
            onClick={addGuest}
          >
            Gast speichern
          </Button>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-zinc-800 p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Users className="text-yellow-400" size={22} />

                <h2 className="text-xl font-black sm:text-2xl">
                  Gästeliste
                </h2>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                {filteredGuests.length} von {guests.length} Gästen
                angezeigt
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-3 xl:col-span-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                  size={18}
                />

                <input
                  className="app-input pl-11 xl:w-80"
                  placeholder="Name, Telefon oder Begleitung..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <select
                className="app-input"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as CategoryFilter
                  )
                }
              >
                <option value="Alle">Alle Kategorien</option>
                <option value="Normal">Normal</option>
                <option value="VIP">VIP</option>
                <option value="Helfer">Helfer</option>
                <option value="Blacklist">Blacklist</option>
              </select>

              <select
                className="app-input"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as StatusFilter
                  )
                }
              >
                <option value="Alle">Alle Status</option>
                <option value="Offen">Offen</option>
                <option value="Eingecheckt">Eingecheckt</option>
              </select>
            </div>
          </div>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="p-5 sm:p-7">
            <EmptyState
              icon={<Search size={27} />}
              title="Keine Gäste gefunden"
              description="Passe die Suche oder die ausgewählten Filter an."
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px]">
                <thead className="border-b border-zinc-800 bg-black/20">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-zinc-600">
                    <th className="px-6 py-4">Gast</th>
                    <th className="px-6 py-4">Kategorie</th>
                    <th className="px-6 py-4">Begleitungen</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">
                      Aktionen
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGuests.map((guest) => (
                    <GuestTableRow
                      key={guest.id}
                      guest={guest}
                      editState={editState}
                      savingEdit={savingEdit}
                      onEditChange={setEditState}
                      onStartEdit={() => startEditing(guest)}
                      onCancelEdit={cancelEditing}
                      onSaveEdit={saveEdit}
                      onDelete={() => setGuestToDelete(guest)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
              {filteredGuests.map((guest) => (
                <GuestMobileCard
                  key={guest.id}
                  guest={guest}
                  editState={editState}
                  savingEdit={savingEdit}
                  onEditChange={setEditState}
                  onStartEdit={() => startEditing(guest)}
                  onCancelEdit={cancelEditing}
                  onSaveEdit={saveEdit}
                  onDelete={() => setGuestToDelete(guest)}
                />
              ))}
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={guestToDelete !== null}
        title="Gast löschen?"
        description={
          guestToDelete
            ? `${guestToDelete.name} und alle zugehörigen Begleitungen und Tickets werden dauerhaft gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden.`
            : ""
        }
        confirmLabel="Gast löschen"
        dangerous
        loading={deletingGuest}
        onConfirm={deleteGuest}
        onCancel={() => {
          if (!deletingGuest) {
            setGuestToDelete(null);
          }
        }}
      />
    </div>
  );
}

function StatisticCard({
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
    <Card hover padding="small">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
        {icon}
      </div>

      <p className="mt-4 text-sm font-semibold text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-600 sm:text-sm">
        {description}
      </p>
    </Card>
  );
}

function GuestTableRow({
  guest,
  editState,
  savingEdit,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  guest: Guest;
  editState: EditState | null;
  savingEdit: boolean;
  onEditChange: (value: EditState) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  const isEditing = editState?.id === guest.id;

  return (
    <tr className="border-b border-zinc-900 transition hover:bg-white/[0.018]">
      <td className="px-6 py-5">
        {isEditing && editState ? (
          <div className="space-y-3">
            <input
              className="app-input"
              value={editState.name}
              onChange={(event) =>
                onEditChange({
                  ...editState,
                  name: event.target.value,
                })
              }
            />

            <input
              className="app-input"
              value={editState.phone}
              placeholder="Telefonnummer"
              onChange={(event) =>
                onEditChange({
                  ...editState,
                  phone: event.target.value,
                })
              }
            />
          </div>
        ) : (
          <GuestIdentity guest={guest} />
        )}
      </td>

      <td className="px-6 py-5">
        {isEditing && editState ? (
          <select
            className="app-input"
            value={editState.category}
            onChange={(event) =>
              onEditChange({
                ...editState,
                category: event.target.value as GuestCategory,
              })
            }
          >
            <option value="Normal">Normal</option>
            <option value="VIP">VIP</option>
            <option value="Helfer">Helfer</option>
            <option value="Blacklist">Blacklist</option>
          </select>
        ) : (
          <CategoryBadge category={guest.category} />
        )}
      </td>

      <td className="px-6 py-5">
        <CompanionOverview guest={guest} />
      </td>

      <td className="px-6 py-5">
        <StatusBadge checkedIn={guest.checked_in} />
      </td>

      <td className="px-6 py-5">
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button
                size="small"
                variant="success"
                icon={<Save size={17} />}
                loading={savingEdit}
                onClick={onSaveEdit}
              >
                Speichern
              </Button>

              <Button
                size="small"
                variant="secondary"
                icon={<X size={17} />}
                disabled={savingEdit}
                onClick={onCancelEdit}
              >
                Abbrechen
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small"
                variant="secondary"
                icon={<Edit3 size={17} />}
                onClick={onStartEdit}
              >
                Bearbeiten
              </Button>

              <Button
                size="small"
                variant="danger"
                icon={<Trash2 size={17} />}
                onClick={onDelete}
              >
                Löschen
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function GuestMobileCard({
  guest,
  editState,
  savingEdit,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  guest: Guest;
  editState: EditState | null;
  savingEdit: boolean;
  onEditChange: (value: EditState) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  const isEditing = editState?.id === guest.id;

  return (
    <Card padding="small">
      {isEditing && editState ? (
        <div className="space-y-4">
          <div>
            <label className="app-label">Name</label>

            <input
              className="app-input"
              value={editState.name}
              onChange={(event) =>
                onEditChange({
                  ...editState,
                  name: event.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="app-label">Telefon</label>

            <input
              className="app-input"
              value={editState.phone}
              onChange={(event) =>
                onEditChange({
                  ...editState,
                  phone: event.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="app-label">Kategorie</label>

            <select
              className="app-input"
              value={editState.category}
              onChange={(event) =>
                onEditChange({
                  ...editState,
                  category:
                    event.target.value as GuestCategory,
                })
              }
            >
              <option value="Normal">Normal</option>
              <option value="VIP">VIP</option>
              <option value="Helfer">Helfer</option>
              <option value="Blacklist">Blacklist</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="success"
              icon={<Save size={18} />}
              loading={savingEdit}
              onClick={onSaveEdit}
            >
              Speichern
            </Button>

            <Button
              variant="secondary"
              icon={<X size={18} />}
              disabled={savingEdit}
              onClick={onCancelEdit}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4">
            <Avatar name={guest.name} category={guest.category} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black">
                {guest.name}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <CategoryBadge category={guest.category} />
                <StatusBadge checkedIn={guest.checked_in} />
              </div>

              {guest.phone && (
                <p className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                  <Phone size={15} />
                  {guest.phone}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-zinc-800 pt-4">
            <CompanionOverview guest={guest} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              icon={<Edit3 size={18} />}
              onClick={onStartEdit}
            >
              Bearbeiten
            </Button>

            <Button
              variant="danger"
              icon={<Trash2 size={18} />}
              onClick={onDelete}
            >
              Löschen
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function GuestIdentity({ guest }: { guest: Guest }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar name={guest.name} category={guest.category} />

      <div className="min-w-0">
        <p className="truncate font-black">{guest.name}</p>

        {guest.phone ? (
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
            <Phone size={14} />
            {guest.phone}
          </p>
        ) : (
          <p className="mt-1 text-sm text-zinc-600">
            Keine Telefonnummer
          </p>
        )}
      </div>
    </div>
  );
}

function Avatar({
  name,
  category,
}: {
  name: string;
  category: GuestCategory;
}) {
  const initials = getInitials(name);

  const styles: Record<GuestCategory, string> = {
    Normal: "bg-zinc-800 text-zinc-300",
    VIP: "bg-yellow-400 text-black shadow-lg shadow-yellow-400/15",
    Helfer: "bg-blue-500/15 text-blue-300",
    Blacklist: "bg-red-500/15 text-red-300",
  };

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black ${styles[category]}`}
    >
      {initials}
    </div>
  );
}

function CategoryBadge({
  category,
}: {
  category: GuestCategory;
}) {
  if (category === "VIP") {
    return (
      <Badge variant="vip">
        <Crown size={13} className="mr-1" />
        VIP
      </Badge>
    );
  }

  if (category === "Helfer") {
    return (
      <Badge variant="info">
        <ShieldCheck size={13} className="mr-1" />
        Helfer
      </Badge>
    );
  }

  if (category === "Blacklist") {
    return (
      <Badge variant="danger">
        <ShieldAlert size={13} className="mr-1" />
        Blacklist
      </Badge>
    );
  }

  return <Badge variant="neutral">Normal</Badge>;
}

function StatusBadge({
  checkedIn,
}: {
  checkedIn: boolean;
}) {
  return checkedIn ? (
    <Badge variant="success">
      <span className="mr-2 h-2 w-2 rounded-full bg-green-400" />
      Eingecheckt
    </Badge>
  ) : (
    <Badge variant="warning">
      <span className="mr-2 h-2 w-2 rounded-full bg-yellow-400" />
      Offen
    </Badge>
  );
}

function CompanionOverview({ guest }: { guest: Guest }) {
  const companionNames = guest.companion_names ?? [];

  if (companionNames.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        Keine Begleitungen
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm font-bold text-zinc-300">
        {companionNames.length} Begleitung
        {companionNames.length !== 1 ? "en" : ""}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {companionNames.slice(0, 3).map((companionName) => (
          <span
            key={companionName}
            className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400"
          >
            {companionName}
          </span>
        ))}

        {companionNames.length > 3 && (
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-400">
            +{companionNames.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}