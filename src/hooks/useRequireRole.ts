"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/hooks/useAppStore";
import { getHomeForRole, getLoginRedirectForPath } from "@/lib/roleAccess";

export function useRequireRole(...allowedRoles: Array<"DIRECTOR" | "TEACHER" | "PARENT" | "CHILD">) {
  const { state, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const rolesKey = allowedRoles.join(",");

  useEffect(() => {
    if (loading) return;
    if (!state.user) {
      const loginUrl = getLoginRedirectForPath(pathname, window.location.href);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      return;
    }
    if (!allowedRoles.includes(state.user.role)) {
      router.replace(getHomeForRole(state.user.role));
    }
  }, [loading, rolesKey, router, state.user, allowedRoles, pathname]);
}
