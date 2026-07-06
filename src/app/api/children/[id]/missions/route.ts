import { NextResponse } from "next/server";
import { requireChildAccess } from "@/lib/childAccess";
import { getTodayMissions } from "@/lib/passbookService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireChildAccess(id);
  if ("error" in access && access.error) return access.error;

  const data = await getTodayMissions(id);
  return NextResponse.json(data);
}
