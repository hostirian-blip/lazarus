"use client";
import { useState } from "react";

type IngestSummary = {
  file: string;
  totalRows: number;
  created: number;
  duplicatesInFile: number;
  duplicatesExisting: number;
  invalid: { row: number; reason: string }[];
};

export function ImportForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IngestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/leads/ingest", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? `Upload failed (${res.status})`);
      else setResult(json as IngestSummary);
    } catch {
      setError("Network error during upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 24 }}>
      <input type="file" name="file" accept=".csv,.xlsx,.xls" required />
      <button type="submit" disabled={busy} style={{ marginLeft: 12 }}>
        {busy ? "Importing…" : "Import"}
      </button>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <strong>
            Imported {result.created} lead{result.created === 1 ? "" : "s"}
          </strong>{" "}
          from {result.totalRows} row{result.totalRows === 1 ? "" : "s"}.
          <ul style={{ color: "#555", marginBottom: 0 }}>
            <li>Duplicates in file: {result.duplicatesInFile}</li>
            <li>Already existed: {result.duplicatesExisting}</li>
            <li>Invalid: {result.invalid?.length ?? 0}</li>
          </ul>
        </div>
      )}
    </form>
  );
}
