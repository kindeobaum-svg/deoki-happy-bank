"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

type ParentHomeResponse = {
  linked?: boolean;
  homePath?: string;
  parentSession?: { childId: string; childName: string };
  error?: string;
};

/** DB parent↔child 연결 조회 후 학부모 홈 경로 반환 (초대코드 미사용) */
export async function fetchParentHomePath(): Promise<{
  homePath: string | null;
  childId: string | null;
  error?: string;
}> {
  const res = await fetch("/api/auth/parent-home", { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as ParentHomeResponse;

  if (!res.ok || !data.linked || !data.homePath) {
    return {
      homePath: null,
      childId: null,
      error: data.error ?? "연결된 원아 정보를 찾을 수 없습니다.",
    };
  }

  return {
    homePath: data.homePath,
    childId: data.parentSession?.childId ?? null,
  };
}

export function useParentHomeRedirect() {
  const router = useRouter();

  return useCallback(async () => {
    const { homePath } = await fetchParentHomePath();
    if (homePath) {
      router.replace(homePath);
      router.refresh();
      return true;
    }
    return false;
  }, [router]);
}

export async function redirectToParentHome(router: {
  replace: (path: string) => void;
  refresh: () => void;
}): Promise<{ ok: boolean; error?: string }> {
  const { homePath, error } = await fetchParentHomePath();
  if (!homePath) {
    return { ok: false, error };
  }
  router.replace(homePath);
  router.refresh();
  return { ok: true };
}
