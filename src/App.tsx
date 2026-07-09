import { useEffect, useState } from "react";
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
  const [session, setSession] = useState<any>(null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar page={page} setPage={setPage} />

      <main className="flex-1 overflow-x-hidden">
        {page === "dashboard" && <Dashboard />}
        {page === "guests" && <Guests />}
        {page === "import" && <ImportGuests />}
        {page === "tickets" && <Tickets />}
        {page === "checkin" && <CheckIn />}

        {page === "music" && (
          <div className="p-10">
            <p className="text-yellow-400 font-semibold mb-2">Musik</p>
            <h1 className="text-4xl font-bold">Musikwünsche</h1>
            <p className="text-zinc-400 mt-2">Kommt später.</p>
          </div>
        )}

        {page === "photos" && (
          <div className="p-10">
            <p className="text-yellow-400 font-semibold mb-2">Galerie</p>
            <h1 className="text-4xl font-bold">Fotowand</h1>
            <p className="text-zinc-400 mt-2">Kommt später.</p>
          </div>
        )}

        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}

export default App;