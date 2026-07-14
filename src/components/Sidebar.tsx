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
  X,
} from "lucide-react";

type SidebarProps = {
  page: string;
  setPage: (page: string) => void;
  isOpen: boolean;
  closeSidebar: () => void;
};

type MenuButtonProps = {
  name: string;
  label: string;
  icon: ReactNode;
  setPage: (page: string) => void;
  itemClass: (name: string) => string;
};

export default function Sidebar({
  page,
  setPage,
  isOpen,
  closeSidebar,
}: SidebarProps) {
  function itemClass(name: string) {
    return `flex items-center gap-3 w-full p-3 rounded-xl transition ${
      page === name
        ? "bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-400/20"
        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
    }`;
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-900 bg-black p-5 transition-transform duration-300 lg:static lg:z-auto lg:min-h-screen lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-10 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-yellow-400 p-3 text-black">
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

        <button
          type="button"
          onClick={closeSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-white lg:hidden"
          aria-label="Menü schliessen"
        >
          <X size={20} />
        </button>
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
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm font-bold">
            Geburtstags Party 🎉
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Oktober · ca. 300 Gäste
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            System online
          </div>
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