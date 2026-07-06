"use client";

import { useCallback, useEffect, useState } from "react";
import type { MissionWithStatus } from "@/lib/missions";

export function useMissions(childId: string) {
  const [missions, setMissions] = useState<MissionWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!childId) return;
    try {
      const res = await fetch(`/api/children/${childId}/missions`);
      if (!res.ok) return;
      const data = await res.json();
      setMissions(data.missions ?? []);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const completeMission = useCallback(
    async (missionId: string) => {
      const res = await fetch(`/api/children/${childId}/missions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      const data = await res.json();
      if (res.status === 409) {
        return { alreadyDone: true as const };
      }
      if (!res.ok) {
        return { error: data.error ?? "미션 완료에 실패했습니다." };
      }
      await refresh();
      return { alreadyDone: false as const, record: data.record };
    },
    [childId, refresh],
  );

  return { missions, loading, refresh, completeMission };
}
