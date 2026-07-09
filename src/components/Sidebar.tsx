import {
  LayoutDashboard,
  Users,
  Ticket,
  QrCode,
  FileUp,
  Music,
  Image,
  Settings,
  Sparkles,
} from "lucide-react";

type SidebarProps = {
  page: string;
  setPage: (page: string) => void;
};

export default function Sidebar({ page, setPage }: SidebarProps) {
  const itemClass = (name: string) =>
    `flex items-center gap-3 w-full p-3 rounded-xl transition ${
      page === name
        ? "bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-400/20"
        : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
    }`;

  return (
    <aside className="w-72 min-h-screen bg-zinc-950 border-r border-zinc-800 p-5 flex flex-col">

      {/* Logo */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 text-black rounded-xl p-2">
            <Sparkles size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              PartyControl
            </h1>

            <p className="text-xs text-zinc-500">
              Event Management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">

        <button
          className={itemClass("dashboard")}
          onClick={() => setPage("dashboard")}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </button>

        <button
          className={itemClass("guests")}
          onClick={() => setPage("guests")}
        >
          <Users size={20} />
          Gäste
        </button>

        <button
          className={itemClass("import")}
          onClick={() => setPage("import")}
        >
          <FileUp size={20} />
          CSV Import
        </button>

        <button
          className={itemClass("tickets")}
          onClick={() => setPage("tickets")}
        >
          <Ticket size={20} />
          Tickets
        </button>

        <button
          className={itemClass("checkin")}
          onClick={() => setPage("checkin")}
        >
          <QrCode size={20} />
          Check-In
        </button>

        <button
          className={itemClass("music")}
          onClick={() => setPage("music")}
        >
          <Music size={20} />
          Musik
        </button>

        <button
          className={itemClass("photos")}
          onClick={() => setPage("photos")}
        >
          <Image size={20} />
          Fotos
        </button>

      </nav>

      {/* Unten */}
      <div className="mt-auto">

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
          <p className="font-semibold text-white">
            Geburtstag Oktober 🎉
          </p>

          <p className="text-sm text-zinc-500 mt-1">
            PartyControl v1.0
          </p>
        </div>

        <button
          className={itemClass("settings")}
          onClick={() => setPage("settings")}
        >
          <Settings size={20} />
          Einstellungen
        </button>

      </div>

    </aside>
  );
}