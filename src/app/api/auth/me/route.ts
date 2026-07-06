import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  // 비로그인은 정상 상태 — 401이 아닌 200 + user:null
  return NextResponse.json({ user: session });
}
