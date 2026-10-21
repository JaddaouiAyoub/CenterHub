"use client";

import { useCallback, useEffect, useState } from "react";

/** État déplié/replié des dossiers, mémorisé par formation dans le navigateur. */
export function useExpandedFolders(formationId: string, folderIds: string[]) {
  const storageKey = `paid-formation:${formationId}:expanded`;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // Lecture après montage pour éviter une différence entre le rendu serveur et client.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setExpanded(new Set(JSON.parse(saved) as string[]));
    } catch {
      // Stockage indisponible : on garde l'état par défaut.
    }
  }, [storageKey]);

  const update = useCallback((next: Set<string>) => {
    setExpanded(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {
      // Stockage indisponible : l'état reste en mémoire.
    }
  }, [storageKey]);

  const toggle = useCallback((id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update(next);
  }, [expanded, update]);

  return {
    isExpanded: (id: string) => expanded.has(id),
    toggle,
    expandAll: () => update(new Set(folderIds)),
    collapseAll: () => update(new Set()),
  };
}
