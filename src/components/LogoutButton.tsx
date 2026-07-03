"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useAppStore";

type LogoutButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export function LogoutButton({ className, children = "로그아웃" }: LogoutButtonProps) {
  const { logout } = useApp();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      {children}
    </button>
  );
}
