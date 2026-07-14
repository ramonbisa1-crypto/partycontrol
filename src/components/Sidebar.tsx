import type { ReactNode } from "react";

import {
  FileUp,
  Image,
  LayoutDashboard,
  Music,
  QrCode,
  Settings,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

type SidebarProps = {
  page: string;
  setPage: (page: string) => void;
};

type MenuButtonProps = {
  name: string;
  label: string;
  icon: ReactNode;
  setPage: (page: string) => void;
  itemClass: (name: string) => string;
};

export default function Sidebar({ page, setPage }: SidebarProps) {
  function itemClass(name: string) {
    return `flex items-center gap-3 w-full p-3 rounded-xl transition ${
      page === name
        ? "bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-400/20"
        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
    }`;
  }

  return (
    <aside className="w-72 min-h-screen bg-black border-r border-zinc-900 p-5 flex flex-col">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 text-black rounded-2xl p-3">
            <Sparkles size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight">
              PartyControl
            </h1>

            <p className="text-xs text-zinc-500">
              Event Management v2
            </p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        <MenuButton
          name="dashboard"
          label="Dashboard"
          icon={<LayoutDashboard size={20} />}
          setPage={setPage}
          itemClass={itemClass}
        />

        <MenuButton
          name="guests"
          label="Gäste"
          icon={<Users size={20} />}
          setPage={setPage}
          itemClass={itemClass}
        />

        <MenuButton
          name="import"
          label="CSV Import"
          icon={<FileUp size={20} />}
          setPage={setPage}
          itemClass={itemClass}
        />

        <MenuButton
          name="tickets"
          label="Tickets"
          icon={<Ticket size={20} />}
          setPage={setPage}
          itemClass={itemClass}
        />

        <MenuButton
          name="checkin"
          label="Check-In"
          icon={<QrCode size={20} />}
          setPage={setPage}
          itemClass={itemClass}
        />

        <MenuButton
          name="music"
          label="Musik"
          icon={<Music size={20} />}
          setPage={setPage}
          itemClass={itemClass}
        />

        <MenuButton
          name="photos"
          label="Fotos"
          icon={<Image size={20} />}
          setPage={setPage}
          itemClass={itemClass}
        />
      </nav>

      <div className="mt-auto">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 mb-4">
          <p className="text-sm font-bold">
            Geburtstags Party 🎉
          </p>

          <p className="text-xs text-zinc-500 mt-1">
            Oktober · ca. 300 Gäste
          </p>
        </div>

        <MenuButton
          name="settings"
          label="Einstellungen"
          icon={<Settings size={20} />}
          setPage={setPage}
          itemClass={itemClass}
        />
      </div>
    </aside>
  );
}

function MenuButton({
  name,
  label,
  icon,
  setPage,
  itemClass,
}: MenuButtonProps) {
  return (
    <button
      type="button"
      className={itemClass(name)}
      onClick={() => setPage(name)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}