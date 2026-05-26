import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "VAPID key not configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const endpoint = String(body.endpoint ?? "");
  const p256dh = String(body.keys?.p256dh ?? "");
  const auth = String(body.keys?.auth ?? "");

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId: session.id, endpoint } },
    create: { userId: session.id, endpoint, p256dh, auth },
    update: { p256dh, auth },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const endpoint = String(body.endpoint ?? "");

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.id, endpoint },
    });
  } else {
    await prisma.pushSubscription.deleteMany({ where: { userId: session.id } });
  }

  return NextResponse.json({ ok: true });
}
