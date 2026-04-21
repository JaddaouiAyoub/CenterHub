"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, csvFilename, CsvColumn } from "@/lib/export-csv";

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
  label = "Exporter CSV",
  className,
  disabled,
}: CsvExportButtonProps<T>) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!data || data.length === 0) return;
    setExporting(true);
    try {
      exportToCSV(data, columns, csvFilename(filename));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || exporting || !data || data.length === 0}
      className={
        className ??
        "border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
      }
    >
      {exporting ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 inline-block" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
