"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useAppStore";
import { getHomeForRole } from "@/lib/roleAccess";

export function useRequireRole(...allowedRoles: Array<"DIRECTOR" | "TEACHER" | "PARENT" | "CHILD">) {
  const { state, loading } = useApp();
  const router = useRouter();
  const rolesKey = allowedRoles.join(",");

  useEffect(() => {
    if (loading) return;
    if (!state.user) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(state.user.role)) {
      router.replace(getHomeForRole(state.user.role));
    }
  }, [loading, rolesKey, router, state.user, allowedRoles]);
}
