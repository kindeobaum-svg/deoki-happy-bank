import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getHomeForRole } from "@/lib/roleAccess";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login/director?from=/admin");
  }

  if (session.role !== "DIRECTOR") {
    redirect(getHomeForRole(session.role));
  }

  return children;
}
