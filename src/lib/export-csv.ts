/**
 * Utility for client-side CSV export with UTF-8 BOM (Excel compatible).
 */

export interface CsvColumn<T = any> {
  label: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if the value contains a comma, double-quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV<T>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  if (typeof window === "undefined") return;

  const header = columns.map((col) => escapeCell(col.label)).join(",");
  const rows = data.map((row) =>
    columns.map((col) => escapeCell(col.value(row))).join(",")
  );

  // UTF-8 BOM ensures Excel opens the file with correct encoding
  const BOM = "\uFEFF";
  const csvContent = BOM + [header, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Returns a filename with today's date appended, e.g. "etudiants_2026-04-21.csv" */
export function csvFilename(base: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `${base}_${today}.csv`;
}
