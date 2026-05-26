"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadLocalPassbook,
  type LocalPassbookEntry,
} from "@/lib/localPassbook";

export function useLocalPassbook() {
  const [entries, setEntries] = useState<LocalPassbookEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setEntries(loadLocalPassbook());
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);

    function onUpdate() {
      refresh();
    }
    window.addEventListener("passbook-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("passbook-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  return { entries, hydrated, refresh };
}
