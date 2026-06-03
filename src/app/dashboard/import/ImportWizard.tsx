"use client";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Field = "firstName" | "lastName" | "email" | "phoneE164" | "company";
const FIELDS: { key: Field; label: string }[] = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "phoneE164", label: "Phone" },
  { key: "company", label: "Company" },
];
type Mapping = Partial<Record<Field, string>>;
interface Preview { headers: string[]; sample: Record<string, unknown>[]; totalRows: number; mapping: Mapping }
interface Summary { created: number; duplicatesInFile: number; duplicatesExisting: number; invalid: { row: number; reason: string }[] }

const input: CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 };
const btn: CSSProperties = { padding: "9px 16px", background: "#2563eb", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" };

export function ImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [consentSource, setConsentSource] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [dry, setDry] = useState<Summary | null>(null);
  const [result, setResult] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function body(extra: Record<string, string> = {}) {
    const f = new FormData();
    if (file) f.append("file", file);
    f.append("mapping", JSON.stringify(mapping));
    f.append("consentSource", consentSource);
    f.append("smsConsent", String(smsConsent));
    f.append("emailConsent", String(emailConsent));
    for (const [k, v] of Object.entries(extra)) f.append(k, v);
    return f;
  }

  async function doPreview() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const f = new FormData();
      f.append("file", file);
      const res = await fetch("/api/leads/import/preview", { method: "POST", body: f });
      const j = await res.json();
      if (!res.ok) return setError(j.error ?? "Preview failed");
      setPreview(j);
      setMapping(j.mapping ?? {});
      setStep(2);
    } catch {
      setError("Upload error");
    } finally {
      setBusy(false);
    }
  }

  async function run(dryRun: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/import/commit", { method: "POST", body: body(dryRun ? { dryRun: "true" } : {}) });
      const j = await res.json();
      if (!res.ok) return setError(j.error ?? "Failed");
      if (dryRun) {
        setDry(j);
        setStep(3);
      } else {
        setResult(j);
        setStep(4);
        router.refresh();
      }
    } catch {
      setError("Request error");
    } finally {
      setBusy(false);
    }
  }

  const hasContactField = Boolean(mapping.phoneE164 || mapping.email);

  return (
    <div>
      <Steps step={step} />
      {error && <p style={{ color: "var(--rust)" }}>{error}</p>}

      {step === 1 && (
        <div>
          <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>Upload a CSV or XLSX of your old contacts.</p>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div style={{ marginTop: 16 }}>
            <button style={btn} disabled={!file || busy} onClick={doPreview}>{busy ? "Reading…" : "Next: map columns"}</button>
          </div>
        </div>
      )}

      {step === 2 && preview && (
        <div>
          <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>{preview.totalRows} rows found. Map your columns to Lazarus fields.</p>
          {FIELDS.map((f) => (
            <div key={f.key} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <label style={{ width: 110, fontWeight: 600, fontSize: 14 }}>{f.label}</label>
              <select style={{ ...input, flex: 1, minWidth: 180 }} value={mapping[f.key] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))}>
                <option value="">— none —</option>
                {preview.headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
          {!hasContactField && <p className="muted" style={{ fontSize: 13 }}>Map at least a phone or an email.</p>}
          <Nav back={() => setStep(1)} next={() => run(true)} busy={busy} nextLabel="Next: validate" disabled={!hasContactField} />
        </div>
      )}

      {step === 3 && dry && (
        <div>
          <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--app-surface-2)" }}>
            <strong>{dry.created}</strong> new leads will import · {dry.duplicatesInFile + dry.duplicatesExisting} duplicates skipped · {dry.invalid.length} invalid.
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Consent (required before any outreach)</p>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Consent source</label>
            <input style={input} value={consentSource} onChange={(e) => setConsentSource(e.target.value)} placeholder="e.g. Website form 2023, prior customer, trade-show opt-in" />
          </div>
          <label style={{ display: "block", fontSize: 14, marginBottom: 6 }}>
            <input type="checkbox" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} /> These contacts consented to SMS
          </label>
          <label style={{ display: "block", fontSize: 14, marginBottom: 12 }}>
            <input type="checkbox" checked={emailConsent} onChange={(e) => setEmailConsent(e.target.checked)} /> These contacts consented to email
          </label>
          <p className="muted" style={{ fontSize: 12 }}>Leads import with the consent you mark here; the send-time gate still blocks anyone without it.</p>
          <Nav back={() => setStep(2)} next={() => run(false)} busy={busy} nextLabel={`Import ${dry.created} leads`} disabled={!consentSource.trim()} />
        </div>
      )}

      {step === 4 && result && (
        <div>
          <div className="card" style={{ padding: 16, background: "var(--green-soft)", border: "1px solid rgba(70,201,138,.3)" }}>
            <strong>Imported {result.created} leads.</strong>
            <ul style={{ marginBottom: 0, color: "var(--ink-dim)" }}>
              <li>Duplicates in file: {result.duplicatesInFile}</li>
              <li>Already existed: {result.duplicatesExisting}</li>
              <li>Invalid: {result.invalid.length}</li>
            </ul>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn btn-gold" href="/dashboard/leads">View leads</a>
            <button
              style={{ ...btn, background: "#6b7280" }}
              onClick={() => {
                setStep(1);
                setFile(null);
                setPreview(null);
                setDry(null);
                setResult(null);
                setConsentSource("");
                setSmsConsent(false);
                setEmailConsent(false);
              }}
            >
              Import another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Steps({ step }: { step: number }) {
  const labels = ["Upload", "Map", "Consent", "Done"];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
      {labels.map((l, i) => (
        <span key={l} className="label" style={{ padding: "4px 10px", borderRadius: 999, background: i + 1 <= step ? "var(--gold-soft)" : "transparent", color: i + 1 <= step ? "var(--gold)" : "var(--ink-dim)" }}>
          {i + 1}. {l}
        </span>
      ))}
    </div>
  );
}

function Nav({ back, next, busy, nextLabel, disabled }: { back: () => void; next: () => void; busy: boolean; nextLabel: string; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <button style={{ padding: "9px 16px", background: "transparent", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer" }} onClick={back} disabled={busy}>← Back</button>
      <button style={{ padding: "9px 16px", background: disabled ? "#9ca3af" : "#2563eb", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" }} onClick={next} disabled={busy || disabled}>{busy ? "…" : nextLabel}</button>
    </div>
  );
}
