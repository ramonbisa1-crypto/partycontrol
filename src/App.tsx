import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";

import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Guests from "./pages/Guests";
import ImportGuests from "./pages/ImportGuests";
import Tickets from "./pages/Tickets";
import CheckIn from "./pages/CheckIn";
import Music from "./pages/Music";
import Photos from "./pages/Photos";
import Settings from "./pages/Settings";
import DjMode from "./pages/DjMode";

import PublicHome from "./pages/PublicHome";
import PublicMusic from "./pages/PublicMusic";
import PublicPhotos from "./pages/PublicPhotos";

type PublicView =
  | "home"
  | "music"
  | "photos"
  | null;

function getView() {
  const searchParameters =
    new URLSearchParams(
      window.location.search
    );

  return searchParameters.get(
    "view"
  );
}

function getPublicView(): PublicView {
  const view =
    getView();

  if (
    view === "home" ||
    view === "music" ||
    view === "photos"
  ) {
    return view;
  }

  return null;
}

function App() {
  const currentView =
    getView();

  const publicView =
    getPublicView();

  const isDjMode =
    currentView === "dj";

  const [session, setSession] =
    useState<Session | null>(
      null
    );

  const [loading, setLoading] =
    useState(
      publicView === null
    );

  const [page, setPage] =
    useState("dashboard");

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  useEffect(() => {
    if (
      publicView !== null
    ) {
      return;
    }

    let componentMounted =
      true;

    async function loadSession() {
      const {
        data,
        error,
      } =
        await supabase.auth.getSession();

      if (
        !componentMounted
      ) {
        return;
      }

      if (error) {
        console.error(
          "Session konnte nicht geladen werden:",
          error.message
        );
      }

      setSession(
        data.session
      );

      setLoading(false);
    }

    loadSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          currentSession
        ) => {
          if (
            !componentMounted
          ) {
            return;
          }

          setSession(
            currentSession
          );

          setLoading(false);
        }
      );

    return () => {
      componentMounted =
        false;

      subscription.unsubscribe();
    };
  }, [publicView]);

  function changePage(
    newPage: string
  ) {
    setPage(newPage);
    setSidebarOpen(false);
  }

  /*
   * Öffentliche Seiten
   */
  if (
    publicView === "home"
  ) {
    return <PublicHome />;
  }

  if (
    publicView === "music"
  ) {
    return <PublicMusic />;
  }

  if (
    publicView === "photos"
  ) {
    return <PublicPhotos />;
  }

  /*
   * Geschützte Seiten
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-yellow-400" />

          <p className="mt-4 text-zinc-400">
            PartyControl wird geladen...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  /*
   * DJ-Modus
   */
  if (isDjMode) {
    return <DjMode />;
  }

  /*
   * Admin-Bereich
   */
  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Menü schliessen"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <Sidebar
        page={page}
        setPage={
          changePage
        }
        isOpen={
          sidebarOpen
        }
        closeSidebar={() =>
          setSidebarOpen(false)
        }
        collapsed={
          sidebarCollapsed
        }
        toggleCollapsed={() =>
          setSidebarCollapsed(
            (
              currentValue
            ) =>
              !currentValue
          )
        }
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-zinc-900 bg-black/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-white transition hover:bg-zinc-900"
            aria-label="Menü öffnen"
          >
            <Menu
              size={22}
            />
          </button>

          <div>
            <p className="font-black tracking-tight">
              PartyControl
            </p>

            <p className="text-xs text-zinc-500">
              Event Management
            </p>
          </div>
        </header>

        {page ===
          "dashboard" && (
          <Dashboard />
        )}

        {page ===
          "guests" && (
          <Guests />
        )}

        {page ===
          "import" && (
          <ImportGuests />
        )}

        {page ===
          "tickets" && (
          <Tickets />
        )}

        {page ===
          "checkin" && (
          <CheckIn />
        )}

        {page ===
          "music" && (
          <Music />
        )}

        {page ===
          "photos" && (
          <Photos />
        )}

        {page ===
          "settings" && (
          <Settings />
        )}
      </main>
    </div>
  );
}

export default App;