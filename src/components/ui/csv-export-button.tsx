"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportToCSV,
  exportToExcel,
  csvFilename,
  excelFilename,
  type CsvColumn,
} from "@/lib/export-csv";

interface CsvExportButtonProps<T> {
  data: T[];
  columns: CsvColumn<T>[];
  filename: string;
  label?: string;
  /** Optional className override */
  className?: string;
  disabled?: boolean;
}

export function CsvExportButton<T>({
  data,
  columns,
  filename,
  label = "Exporter",
  className,
  disabled,
}: CsvExportButtonProps<T>) {
  const [exporting, setExporting] = useState(false);
  const isEmpty = !data || data.length === 0;

  const handleExport = async (format: "csv" | "xlsx") => {
    if (isEmpty) return;
    setExporting(true);
    try {
      if (format === "csv") {
        exportToCSV(data, columns, csvFilename(filename));
        return;
      }
      await exportToExcel(data, columns, excelFilename(filename));
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        suppressHydrationWarning
        type="button"
        aria-label={label}
        disabled={disabled || exporting || isEmpty}
        className={
          (className ??
            "border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors") +
          " inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium outline-none disabled:pointer-events-none disabled:opacity-50"
        }
      >
        {exporting ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-1">
        <DropdownMenuItem
          onClick={() => void handleExport("csv")}
          className="cursor-pointer gap-2"
        >
          <FileText className="h-4 w-4" />
          Exporter CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void handleExport("xlsx")}
          className="cursor-pointer gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exporter Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
