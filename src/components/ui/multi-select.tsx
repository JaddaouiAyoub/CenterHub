"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Option {
  id: string;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = "Sélectionner...",
  className,
}: MultiSelectProps) {
  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedCount = selectedIds.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex items-center w-full justify-between font-normal text-left px-3 h-11 border border-slate-200 rounded-md bg-transparent ${className}`}
      >
        {selectedCount === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <div className="flex items-center space-x-1 truncate max-w-[90%]">
             {selectedCount <= 2 ? (
               selectedIds.map(id => {
                 const opt = options.find(o => o.id === id);
                 return opt ? (
                   <Badge key={id} variant="secondary" className="mr-1 py-0 px-2 font-normal">
                     {opt.name}
                   </Badge>
                 ) : null;
               })
             ) : (
               <Badge variant="secondary" className="mr-1 py-0 px-2 font-normal">
                 {selectedCount} sélectionnés
               </Badge>
             )}
          </div>
        )}
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px] max-h-[300px] overflow-y-auto">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={selectedIds.includes(option.id)}
            onCheckedChange={() => toggleOption(option.id)}
            onSelect={(e) => e.preventDefault()} // Keeps dropdown open natively on selection
          >
            {option.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
