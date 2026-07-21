import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Users,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastProvider";

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

type ImportPreview = {
  guestName: string;
  phone: string;
  category: string;
  companions: string[];
};

export default function ImportGuests() {
  const { showToast } = useToast();

  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          showToast({
            type: "error",
            title: "CSV konnte nicht gelesen werden",
            message: result.errors[0]?.message ?? "Unbekannter Fehler",
          });

          setRows([]);
          return;
        }

        setRows(result.data);

        showToast({
          type: "success",
          title: "CSV-Datei geladen",
          message: `${result.data.length} Zeilen wurden erkannt.`,
        });
      },
    });
  }

  const previewRows = useMemo<ImportPreview[]>(() => {
    return rows
      .filter((row) => row.Hauptgast?.trim())
      .map((row) => {
        const companions = [
          row["Begleitung 1"],
          row["Begleitung 2"],
          row["Begleitung 3"],
          row["Begleitung 4"],
          row["Begleitung 5"],
        ]
          .map((item) => item?.trim())
          .filter((item): item is string => Boolean(item));

        return {
          guestName: row.Hauptgast.trim(),
          phone: row.Telefon?.trim() || "",
          category: row.Kategorie?.trim() || "Normal",
          companions,
        };
      });
  }, [rows]);

  const totalCompanions = previewRows.reduce(
    (sum, row) => sum + row.companions.length,
    0
  );

  async function importGuests() {
    if (previewRows.length === 0) {
      showToast({
        type: "warning",
        title: "Keine Daten vorhanden",
        message: "Bitte wähle zuerst eine gültige CSV-Datei aus.",
      });

      return;
    }

    setImporting(true);

    try {
      for (const row of previewRows) {
        const { data: guestData, error: guestError } = await supabase
          .from("guests")
          .insert({
            name: row.guestName,
            phone: row.phone || null,
            category: row.category || "Normal",
            companions: row.companions.length,
            companion_names: row.companions,
          })
          .select()
          .single();

        if (guestError) {
          throw new Error(guestError.message);
        }

        if (row.companions.length > 0) {
          const companionRows = row.companions.map((name) => ({
            guest_id: guestData.id,
            name,
          }));

          const { error: companionError } = await supabase
            .from("companions")
            .insert(companionRows);

          if (companionError) {
            throw new Error(companionError.message);
          }
        }
      }

      showToast({
        type: "success",
        title: "Import abgeschlossen",
        message: `${previewRows.length} Hauptgäste und ${totalCompanions} Begleitungen wurden importiert.`,
      });

      setRows([]);
      setFileName("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler";

      showToast({
        type: "error",
        title: "Import fehlgeschlagen",
        message,
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="page-enter p-4 sm:p-6 lg:p-10">
      <PageHeader
        eyebrow="CSV-Import"
        title="Gäste importieren"
        description="Importiere mehrere Hauptgäste und Begleitungen direkt aus einer CSV-Datei."
      />

      <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Hauptgäste"
          value={previewRows.length}
          icon={<Users size={21} />}
        />

        <SummaryCard
          title="Begleitungen"
          value={totalCompanions}
          icon={<Users size={21} />}
        />

        <SummaryCard
          title="Personen total"
          value={previewRows.length + totalCompanions}
          icon={<FileSpreadsheet size={21} />}
        />
      </section>

      <Card className="mb-7" padding="large">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
            <Upload size={23} />
          </div>

          <div>
            <h2 className="text-xl font-black sm:text-2xl">
              CSV-Datei auswählen
            </h2>

            <p className="text-sm text-zinc-500">
              Die Datei wird zuerst geprüft und als Vorschau angezeigt.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-black/20 px-6 py-8 text-center transition hover:border-yellow-400 hover:bg-yellow-400/5">
            <Upload size={30} className="text-yellow-400" />

            <p className="mt-4 font-black">
              CSV-Datei auswählen
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Klicke hier und wähle deine exportierte CSV-Datei aus.
            </p>

            {fileName && (
              <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-300">
                {fileName}
              </div>
            )}

            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            icon={<CheckCircle2 size={19} />}
            loading={importing}
            disabled={previewRows.length === 0}
            onClick={importGuests}
          >
            Gäste importieren
          </Button>
        </div>
      </Card>

      <Card padding="large">
        <div className="flex items-center gap-3">
          <FileSpreadsheet
            className="text-yellow-400"
            size={22}
          />

          <div>
            <h2 className="text-xl font-black sm:text-2xl">
              Import-Vorschau
            </h2>

            <p className="text-sm text-zinc-500">
              Prüfe die Daten vor dem Import.
            </p>
          </div>
        </div>

        {previewRows.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<FileSpreadsheet size={28} />}
              title="Keine CSV-Datei geladen"
              description="Wähle oben eine Datei aus, um eine Vorschau zu sehen."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-zinc-800 bg-black/20">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-zinc-600">
                  <th className="px-4 py-3">Hauptgast</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Kategorie</th>
                  <th className="px-4 py-3">Begleitungen</th>
                </tr>
              </thead>

              <tbody>
                {previewRows.map((row, index) => (
                  <tr
                    key={`${row.guestName}-${index}`}
                    className="border-b border-zinc-900"
                  >
                    <td className="px-4 py-4 font-bold">
                      {row.guestName}
                    </td>

                    <td className="px-4 py-4 text-zinc-400">
                      {row.phone || "-"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                        {row.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-zinc-400">
                      {row.companions.length === 0
                        ? "Keine"
                        : row.companions.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card hover padding="small">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
        {icon}
      </div>

      <p className="mt-4 text-sm font-semibold text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black">
        {value}
      </p>
    </Card>
  );
}