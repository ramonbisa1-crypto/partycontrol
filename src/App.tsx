import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Guests from "./pages/Guests";
import Tickets from "./pages/Tickets";
import CheckIn from "./pages/CheckIn";
import ImportGuests from "./pages/ImportGuests";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function changePage(newPage: string) {
    setPage(newPage);
    setSidebarOpen(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-yellow-400 rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 mt-4">
            PartyControl wird geladen...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Menü schliessen"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        page={page}
        setPage={changePage}
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        toggleCollapsed={() =>
          setSidebarCollapsed((currentValue) => !currentValue)
        }
      />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-zinc-900 bg-black/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-white hover:bg-zinc-900"
            aria-label="Menü öffnen"
          >
            <Menu size={22} />
          </button>

          <div>
            <p className="font-black tracking-tight">PartyControl</p>
            <p className="text-xs text-zinc-500">Event Management</p>
          </div>
        </header>

        {page === "dashboard" && <Dashboard />}
        {page === "guests" && <Guests />}
        {page === "import" && <ImportGuests />}
        {page === "tickets" && <Tickets />}
        {page === "checkin" && <CheckIn />}

        {page === "music" && (
          <div className="p-5 sm:p-8 lg:p-10">
            <p className="text-yellow-400 font-semibold mb-2">Musik</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Musikwünsche
            </h1>
            <p className="text-zinc-400 mt-2">
              Diese Funktion erstellen wir später.
            </p>
          </div>
        )}

        {page === "photos" && (
          <div className="p-5 sm:p-8 lg:p-10">
            <p className="text-yellow-400 font-semibold mb-2">Galerie</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Fotowand
            </h1>
            <p className="text-zinc-400 mt-2">
              Diese Funktion erstellen wir später.
            </p>
          </div>
        )}

        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}

export default App;