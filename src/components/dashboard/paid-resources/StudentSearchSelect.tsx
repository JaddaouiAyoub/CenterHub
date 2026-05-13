"use client";

import { useState, useEffect, useRef } from "react";
import { getStudents } from "@/actions/students";
import { Input } from "@/components/ui/input";
import { Search, User, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentSearchSelectProps {
  onSelect: (studentId: string, studentName: string) => void;
  error?: string;
}

export function StudentSearchSelect({ onSelect, error }: StudentSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open && !selectedId) {
      setSearch("");
    }
  }, [open, selectedId]);

  useEffect(() => {
    if (!open) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await getStudents(search, 1, 20); // Limit to 20 for dropdown
        if (res.students) {
          setStudents(res.students);
        }
      } catch (err) {
        console.error("Failed to fetch students:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timer);
  }, [search, open]);

  const handleSelect = (student: any) => {
    setSelectedId(student.id);
    setSelectedName(student.name);
    setSearch(student.name);
    setOpen(false);
    onSelect(student.studentProfile.id, student.name);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher un étudiant par nom..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
            if (selectedId) setSelectedId(null);
          }}
          onFocus={() => setOpen(true)}
          className={cn(
            "pl-9 border-slate-200 focus:ring-blue-500",
            error && "border-red-500 focus:ring-red-500"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {students.length === 0 && !loading ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Aucun étudiant trouvé.
            </div>
          ) : (
            <div className="p-1">
              {students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelect(student)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-medium text-slate-700 dark:text-slate-200 truncate">
                      {student.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{student.email}</div>
                  </div>
                  {selectedId === student.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
