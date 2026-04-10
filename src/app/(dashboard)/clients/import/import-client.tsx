"use client";

import { useRef, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { Upload, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { importContacts, type ImportRow } from "../import-actions";

// ── Types ────────────────────────────────────────────────────

type ExistingClient = {
  id: string;
  email: string;
  name: string;
  company: string | null;
};

type ParsedRow = ImportRow & {
  _index: number;
  _duplicate: boolean; // email already exists
};

type Step = 1 | 2 | 3;

// ── CSV parser (handles quoted fields with embedded commas) ──

function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote inside a quoted field
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    fields.push(cur.trim());
    rows.push(fields);
  }
  return rows;
}

// Find the column index for a header (case-insensitive, partial match)
function findCol(headers: string[], ...candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) =>
      h.toLowerCase().includes(candidate.toLowerCase())
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseRows(raw: string, existingClients: ExistingClient[]): ParsedRow[] {
  const rows = parseCSV(raw);
  if (rows.length < 2) return [];

  // First row with content that looks like headers
  // HoneyBook export: first column is "#" (row number), skip it
  const headers = rows[0];

  const colFirst    = findCol(headers, "first name", "firstname");
  const colLast     = findCol(headers, "last name",  "lastname");
  const colEmail    = findCol(headers, "email");
  const colPhone    = findCol(headers, "phone");
  const colOrg      = findCol(headers, "organization", "company");
  const colNotes    = findCol(headers, "notes");

  const existingEmails = new Set(
    existingClients.map((c) => c.email.toLowerCase())
  );

  const parsed: ParsedRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const get = (idx: number) => (idx !== -1 ? (r[idx] ?? "") : "");

    const email     = get(colEmail).replace(/^["']|["']$/g, "");
    const firstName = get(colFirst).replace(/^["']|["']$/g, "");
    const lastName  = get(colLast).replace(/^["']|["']$/g, "");

    // Skip completely blank rows
    if (!firstName && !lastName && !email) continue;

    parsed.push({
      _index:     i,
      _duplicate: email ? existingEmails.has(email.toLowerCase()) : false,
      firstName,
      lastName,
      email,
      phone:        get(colPhone).replace(/^["']|["']$/g, ""),
      organization: get(colOrg).replace(/^["']|["']$/g, ""),
      notes:        get(colNotes).replace(/^["']|["']$/g, ""),
    });
  }

  return parsed;
}

// ── Step indicator ───────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Upload" },
    { n: 2, label: "Preview" },
    { n: 3, label: "Done" },
  ] as const;

  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map(({ n, label }, i) => {
        const done    = current > n;
        const active  = current === n;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done
                    ? "bg-fire/20 text-fire"
                    : active
                      ? "bg-gradient-to-br from-fire to-gold text-white shadow-lg shadow-fire/20"
                      : "bg-surface-3 text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  active ? "text-cream" : done ? "text-fire" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-16 mb-5 mx-1 transition-colors",
                  done ? "bg-fire/40" : "bg-surface-4"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export function ImportClient({
  existingClients,
}: {
  existingClients: ExistingClient[];
}) {
  const [step, setStep]             = useState<Step>(1);
  const [fileName, setFileName]     = useState("");
  const [rows, setRows]             = useState<ParsedRow[]>([]);
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);
  const [parseError, setParseError] = useState("");
  const [result, setResult]         = useState<{ imported: number; skipped: number } | null>(null);
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File processing ──────────────────────────────────────

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setParseError("Please upload a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseRows(text, existingClients);
      if (parsed.length === 0) {
        setParseError("No contacts found. Make sure the file has a header row and at least one data row.");
        return;
      }
      setParseError("");
      setFileName(file.name);
      setRows(parsed);
      // Default: select all non-duplicate rows
      setSelected(new Set(parsed.filter((r) => !r._duplicate).map((r) => r._index)));
      setStep(2);
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existingClients]
  );

  // ── Selection helpers ────────────────────────────────────

  function toggleRow(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(rows.map((r) => r._index)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  // ── Import ───────────────────────────────────────────────

  function handleImport() {
    const toImport = rows.filter((r) => selected.has(r._index));
    if (toImport.length === 0) return;

    setServerError("");
    startTransition(async () => {
      const res = await importContacts(toImport);
      if (res.error) {
        setServerError(res.error);
      } else {
        setResult(res);
        setStep(3);
      }
    });
  }

  const selectedCount = selected.size;

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-cream">
            Import contacts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CSV from HoneyBook or another CRM.
          </p>
        </div>
        <Link
          href="/clients"
          className="text-sm text-muted-foreground hover:text-cream transition-colors"
        >
          ← Back to clients
        </Link>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* ── Step 1: Upload ── */}
      {step === 1 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer",
            "min-h-[280px] px-8 py-12 transition-all duration-200",
            isDragOver
              ? "border-fire bg-fire/5 shadow-lg shadow-fire/10"
              : "border-surface-4 bg-surface-2 hover:border-fire/50 hover:bg-fire/[0.03]"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="sr-only"
            onChange={handleFileChange}
          />

          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full transition-colors",
              isDragOver ? "bg-fire/20" : "bg-surface-3"
            )}
          >
            <Upload
              className={cn(
                "h-7 w-7 transition-colors",
                isDragOver ? "text-fire" : "text-muted-foreground"
              )}
              strokeWidth={1.5}
            />
          </div>

          <div className="text-center">
            <p className="font-medium text-cream">
              Drop your CSV here, or{" "}
              <span className="text-fire underline underline-offset-2">browse</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Supports HoneyBook exports — First Name, Last Name, Email, Phone, Organization, Notes
            </p>
          </div>

          {parseError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {parseError}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Preview + map ── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center justify-between rounded-lg bg-surface-2 border border-surface-4 px-4 py-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                File: <span className="text-cream font-medium">{fileName}</span>
              </span>
              <span className="text-surface-4">|</span>
              <span className="text-muted-foreground">
                {rows.length} row{rows.length !== 1 ? "s" : ""} parsed
              </span>
              <span className="text-surface-4">|</span>
              <span className="font-medium text-cream">
                {selectedCount} selected for import
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-muted-foreground hover:text-cream transition-colors"
              >
                Select all
              </button>
              <span className="text-surface-4 text-xs">·</span>
              <button
                onClick={deselectAll}
                className="text-xs text-muted-foreground hover:text-cream transition-colors"
              >
                Deselect all
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-surface-4 overflow-hidden">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-surface-3 border-b border-surface-4">
                  <tr>
                    <th className="w-10 px-3 py-3 text-left">
                      <span className="sr-only">Include</span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notes</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-4">
                  {rows.map((row) => {
                    const isSelected = selected.has(row._index);
                    const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ") || "—";
                    return (
                      <tr
                        key={row._index}
                        onClick={() => toggleRow(row._index)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isSelected
                            ? "bg-surface-2 hover:bg-surface-3"
                            : "bg-surface-1 hover:bg-surface-2 opacity-50"
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(row._index)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-surface-4 bg-surface-3 accent-fire cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-2.5 font-medium text-cream whitespace-nowrap">
                          {fullName}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {row.email || <span className="text-surface-4">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {row.phone || <span className="text-surface-4">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {row.organization || <span className="text-surface-4">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground max-w-[160px] truncate">
                          {row.notes || <span className="text-surface-4">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {row._duplicate ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                              Already exists
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sage/10 px-2.5 py-0.5 text-xs font-medium text-sage">
                              New
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error */}
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => { setStep(1); setRows([]); setFileName(""); }}
              className="text-sm text-muted-foreground hover:text-cream transition-colors"
            >
              ← Choose a different file
            </button>
            <Button
              onClick={handleImport}
              disabled={selectedCount === 0 || isPending}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Importing…
                </>
              ) : (
                <>
                  Import {selectedCount} contact{selectedCount !== 1 ? "s" : ""}
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Success ── */}
      {step === 3 && result && (
        <div className="flex flex-col items-center justify-center gap-6 py-16 animate-fade-up">
          {/* Animated checkmark */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-sage/10 animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-sage/20">
              <CheckCircle2 className="h-9 w-9 text-sage" strokeWidth={1.5} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl font-semibold text-cream">
              Import complete
            </h2>
            <p className="text-muted-foreground">
              {result.imported} contact{result.imported !== 1 ? "s" : ""} imported successfully
              {result.skipped > 0 && (
                <>, {result.skipped} skipped</>
              )}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/clients">
              <Button>View clients</Button>
            </Link>
            <button
              onClick={() => {
                setStep(1);
                setRows([]);
                setFileName("");
                setResult(null);
                setSelected(new Set());
              }}
              className="text-sm text-muted-foreground hover:text-cream transition-colors"
            >
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
