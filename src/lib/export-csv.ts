/**
 * Utility for client-side CSV and Excel exports.
 */

import ExcelJS from "exceljs";

export interface CsvColumn<T = unknown> {
  label: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCell(value: string | number | null | undefined, delimiter: string): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(delimiter) || str.includes('"') || /[\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function serializeCSV<T>(
  data: T[],
  columns: CsvColumn<T>[],
  delimiter = ";",
): string {
  const header = columns.map((column) => escapeCell(column.label, delimiter)).join(delimiter);
  const rows = data.map((row) =>
    columns.map((column) => escapeCell(column.value(row), delimiter)).join(delimiter),
  );
  return "\uFEFF" + [header, ...rows].join("\r\n");
}

function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV<T>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string,
): void {
  if (typeof window === "undefined") return;

  const csvContent = serializeCSV(data, columns);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export async function exportToExcel<T>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string,
): Promise<void> {
  if (typeof window === "undefined") return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Center Management";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Données");
  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
      xSplit: 0,
      topLeftCell: "A2",
    },
  ];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1 + data.length, column: columns.length },
  };

  const headerRow = worksheet.addRow(columns.map((column) => column.label));
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF166534" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  data.forEach((row) => {
    worksheet.addRow(columns.map((column) => column.value(row) ?? ""));
  });

  worksheet.columns = columns.map((column, index) => ({
    key: String(index),
    width: getColumnWidth(
      [column.label, ...data.map((row) => String(column.value(row) ?? ""))],
    ),
  }));

  worksheet.getRow(1).eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FFBBF7D0" } },
      left: { style: "thin", color: { argb: "FFBBF7D0" } },
      bottom: { style: "thin", color: { argb: "FFBBF7D0" } },
      right: { style: "thin", color: { argb: "FFBBF7D0" } },
    };
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

function getColumnWidth(values: string[]): number {
  const longest = values.reduce((max, value) => Math.max(max, value.length), 0);
  return Math.min(Math.max(longest + 2, 12), 60);
}

/** Returns a filename with today's date appended, e.g. "etudiants_2026-04-21.csv" */
export function csvFilename(base: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `${base}_${today}.csv`;
}

/** Returns a filename with today's date appended, e.g. "etudiants_2026-04-21.xlsx" */
export function excelFilename(base: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `${base}_${today}.xlsx`;
}
