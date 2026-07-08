import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/lib/ensureDatabaseReady";
import { prisma } from "@/lib/db";
import { findValidInvite, formatInviteCode } from "@/lib/inviteCode";

export async function POST(request: Request) {
  await ensureDatabaseReady();
  const body = await request.json();
  const code = String(body.code ?? "");

  const result = await findValidInvite(prisma, code);
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
  }

  const { invite } = result;

  return NextResponse.json({
    valid: true,
    targetRole: invite.targetRole,
    formattedCode: formatInviteCode(invite.code),
    child: invite.child
      ? {
          id: invite.child.id,
          name: invite.child.name,
          className: invite.child.className,
        }
      : null,
  });
}
