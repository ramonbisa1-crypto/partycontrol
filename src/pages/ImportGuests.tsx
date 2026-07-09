import { useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { supabase } from "../lib/supabase";

type CsvRow = {
  Hauptgast: string;
  Telefon?: string;
  Kategorie?: string;
  "Begleitung 1"?: string;
  "Begleitung 2"?: string;
  "Begleitung 3"?: string;
  "Begleitung 4"?: string;
  "Begleitung 5"?: string;
};

export default function ImportGuests() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setRows(result.data);
      },
    });
  }

  async function importGuests() {
    if (rows.length === 0) {
      alert("Bitte zuerst eine CSV-Datei auswählen.");
      return;
    }

    setImporting(true);

    for (const row of rows) {
      if (!row.Hauptgast?.trim()) continue;

      const companions = [
        row["Begleitung 1"],
        row["Begleitung 2"],
        row["Begleitung 3"],
        row["Begleitung 4"],
        row["Begleitung 5"],
      ]
        .map((item) => item?.trim())
        .filter((item): item is string => Boolean(item));

      const { data: guestData, error: guestError } = await supabase
        .from("guests")
        .insert({
          name: row.Hauptgast.trim(),
          phone: row.Telefon?.trim() || null,
          category: row.Kategorie?.trim() || "Normal",
          companions: companions.length,
          companion_names: companions,
        })
        .select()
        .single();

      if (guestError) {
        alert(guestError.message);
        setImporting(false);
        return;
      }

      if (companions.length > 0) {
        const companionRows = companions.map((name) => ({
          guest_id: guestData.id,
          name,
        }));

        const { error: companionError } = await supabase
          .from("companions")
          .insert(companionRows);

        if (companionError) {
          alert(companionError.message);
          setImporting(false);
          return;
        }
      }
    }

    setImporting(false);
    alert("Import abgeschlossen.");
    setRows([]);
  }

  return (
    <div className="p-10">
      <div className="mb-8">
        <p className="text-yellow-400 font-semibold mb-2">CSV-Import</p>
        <h1 className="text-4xl font-bold">Gäste importieren</h1>
        <p className="text-zinc-400 mt-2">
          Importiere Hauptgäste und Begleitungen direkt aus Excel/CSV.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <Upload className="text-yellow-400" />
          <h2 className="text-2xl font-bold">CSV-Datei auswählen</h2>
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 w-full"
        />

        <button
          onClick={importGuests}
          disabled={importing}
          className="mt-5 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-bold px-6 py-3 rounded-xl transition"
        >
          {importing ? "Import läuft..." : "Gäste importieren"}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">CSV-Format</h2>

        <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto text-sm text-zinc-300">
{`Hauptgast,Telefon,Kategorie,Begleitung 1,Begleitung 2,Begleitung 3,Begleitung 4,Begleitung 5
Ramon Bisa,0790000000,VIP,Luca Meier,Noah Keller,,,
Fabio Rossi,0780000000,Normal,Jan Müller,,,,
Marco Huber,0760000000,Helfer,,,,,`}
        </pre>

        {rows.length > 0 && (
          <p className="text-green-400 mt-5">
            {rows.length} Zeilen erkannt und bereit zum Import.
          </p>
        )}
      </div>
    </div>
  );
}