import { NextResponse } from "next/server";
import { requireChildAccess } from "@/lib/childAccess";
import { completeMissionForChild } from "@/lib/passbookService";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; missionId: string }> },
) {
  const { id, missionId } = await params;
  const access = await requireChildAccess(id);
  if ("error" in access && access.error) return access.error;

  const result = await completeMissionForChild(id, missionId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
