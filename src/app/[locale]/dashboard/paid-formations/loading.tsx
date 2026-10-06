import { Loader2 } from "lucide-react";

export default function PaidFormationsLoading() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
      <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
      <span>Chargement des formations…</span>
    </div>
  );
}
