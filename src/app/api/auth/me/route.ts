import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureDatabaseReady } from "@/lib/ensureDatabaseReady";

export async function GET() {
  await ensureDatabaseReady();
  const session = await getSession();
  // 비로그인은 정상 상태 — 401이 아닌 200 + user:null (데모 원터치 입장 전 초기화용)
  return NextResponse.json({ user: session });
}
