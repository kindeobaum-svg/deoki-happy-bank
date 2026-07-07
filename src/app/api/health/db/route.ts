import { NextResponse } from "next/server";
import { getDatabaseMode, prisma } from "@/lib/db";
import { bootstrapTursoIfNeeded } from "@/lib/bootstrapTurso";
import { ensureClassRoomSchema } from "@/lib/ensureClassRoomSchema";
import { getTursoConfig, isTursoEnvDeclared, isValidTursoJwt, type TursoConfig } from "@/lib/tursoConfig";

async function probeTursoHttp(turso: TursoConfig) {
  const host = new URL(turso.url).host;
  const url = `https://${host}/v2/pipeline`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${turso.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt: { sql: "SELECT 1" } }, { type: "close" }],
    }),
  });
  const body = await res.text();
  return { httpStatus: res.status, bodyPreview: body.slice(0, 120) };
}

function getAuthSource(): "TURSO_*" | "DATABASE_URL" | "none" {
  const directUrl = (process.env.TURSO_DATABASE_URL ?? "").trim();
  const directToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (directUrl.startsWith("libsql:") && directToken) return "TURSO_*";

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (databaseUrl.startsWith("libsql:") && databaseUrl.includes("authToken=")) return "DATABASE_URL";

  return "none";
}

/** 운영 DB 연결 상태 확인 (비밀값 미노출) */
export async function GET() {
  const mode = getDatabaseMode();
  const turso = getTursoConfig();
  const authSource = getAuthSource();
  const tursoDeclared = isTursoEnvDeclared();

  if (tursoDeclared && !turso) {
    const directToken = process.env.TURSO_AUTH_TOKEN?.trim() ?? "";
    const tokenLooksLikeUrl = directToken.startsWith("libsql:");
    return NextResponse.json(
      {
        ok: false,
        mode,
        tursoConfigured: true,
        tursoHost: (process.env.TURSO_DATABASE_URL ?? "").includes("://")
          ? new URL(process.env.TURSO_DATABASE_URL!.replace(/^libsql:/, "https:")).host
          : null,
        authSource,
        tokenConfigured: Boolean(directToken),
        tokenFormat: tokenLooksLikeUrl ? "libsql_url_in_token_field" : "invalid",
        error: tokenLooksLikeUrl
          ? "TURSO_AUTH_TOKEN에 libsql:// URL이 들어가 있습니다. Turso JWT(eyJ로 시작)만 넣어야 합니다."
          : "Turso JWT가 없습니다. TURSO_AUTH_TOKEN 또는 DATABASE_URL?authToken= 에 유효한 토큰을 설정하세요.",
        hint: "turso db tokens create deoki-happy-bank → JWT를 TURSO_AUTH_TOKEN에 설정 후 Redeploy",
      },
      { status: 503 },
    );
  }

  if (turso && !isValidTursoJwt(turso.authToken)) {
    return NextResponse.json(
      {
        ok: false,
        mode,
        tursoConfigured: true,
        tursoHost: new URL(turso.url).host,
        authSource,
        tokenConfigured: true,
        tokenFormat: "invalid",
        error:
          "TURSO_AUTH_TOKEN 형식 오류: JWT(eyJ로 시작)가 아닙니다. libsql:// URL이 토큰 칸에 들어가 있지 않은지 확인하세요.",
        hint: "Turso CLI: turso db tokens create <db-name> → 발급된 JWT를 TURSO_AUTH_TOKEN에 설정",
      },
      { status: 503 },
    );
  }

  try {
    await bootstrapTursoIfNeeded();
    if (mode !== "turso") {
      await ensureClassRoomSchema();
    }

    const [classRoomCount, childCount, inviteCount] = await Promise.all([
      prisma.classRoom.count(),
      prisma.child.count(),
      prisma.inviteCode.count(),
    ]);

    return NextResponse.json({
      ok: true,
      mode,
      tursoConfigured: tursoDeclared || turso !== null,
      tursoHost: turso ? new URL(turso.url).host : null,
      authSource,
      counts: {
        classRoom: classRoomCount,
        child: childCount,
        inviteCode: inviteCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DB query failed";
    let tursoProbe: { httpStatus: number; bodyPreview: string } | undefined;
    if (turso) {
      try {
        tursoProbe = await probeTursoHttp(turso);
      } catch {
        tursoProbe = undefined;
      }
    }
    const hint =
      tursoProbe?.httpStatus === 401 || message.includes("401")
        ? "TURSO_AUTH_TOKEN이 만료되었거나 잘못되었습니다. Turso에서 새 토큰 발급 후 Vercel env 업데이트 + Redeploy"
        : tursoProbe?.httpStatus === 400 || message.includes("400")
          ? "TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN이 동일 DB를 가리키는지 확인하세요"
          : undefined;

    return NextResponse.json(
      {
        ok: false,
        mode,
        tursoConfigured: tursoDeclared || turso !== null,
        tursoHost: turso ? new URL(turso.url).host : null,
        authSource,
        tokenConfigured: Boolean(turso?.authToken),
        tursoProbe,
        error: message,
        hint,
      },
      { status: 503 },
    );
  }
}
