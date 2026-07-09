import { supabase } from "../lib/supabase";

export default function Settings() {
  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="p-10">
      <div className="mb-8">
        <p className="text-yellow-400 font-semibold mb-2">System</p>
        <h1 className="text-4xl font-bold">Einstellungen</h1>
        <p className="text-zinc-400 mt-2">
          Verwaltung der PartyControl-App.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-xl">
        <h2 className="text-2xl font-bold mb-4">Account</h2>

        <p className="text-zinc-400 mb-6">
          Melde dich ab, wenn du fertig bist oder das Gerät wechselst.
        </p>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-400 text-white font-bold px-6 py-3 rounded-xl transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}