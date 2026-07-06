import { NextResponse } from "next/server";
import { requireChildAccess } from "@/lib/childAccess";
import {
  completeDiaryDepositForChild,
  isDiaryDepositDone,
} from "@/lib/passbookService";
import { DIARY_SAVE_AMOUNT, DIARY_SAVE_ITEM } from "@/lib/diaryPassbook";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireChildAccess(id);
  if ("error" in access && access.error) return access.error;

  const reportDate = new URL(request.url).searchParams.get("reportDate");
  if (!reportDate) {
    return NextResponse.json({ error: "reportDate가 필요합니다." }, { status: 400 });
  }

  const done = await isDiaryDepositDone(id, reportDate);
  return NextResponse.json({ done });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireChildAccess(id);
  if ("error" in access && access.error) return access.error;

  const body = await request.json();
  const reportDate = String(body.reportDate ?? "").trim();
  if (!reportDate) {
    return NextResponse.json({ error: "reportDate가 필요합니다." }, { status: 400 });
  }

  const result = await completeDiaryDepositForChild(
    id,
    reportDate,
    DIARY_SAVE_AMOUNT,
    DIARY_SAVE_ITEM,
  );
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
