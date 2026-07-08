import { NextResponse } from "next/server";
import { getDatabaseMode, prisma } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/ensureDatabaseReady";
import { ensureClassRoomSchema } from "@/lib/ensureClassRoomSchema";
import {
  ensureTursoConfigResolved,
  getTursoConfig,
  isTursoEnvDeclared,
  isValidTursoJwt,
  type TursoConfig,
} from "@/lib/tursoConfig";

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
  if (isTursoEnvDeclared()) {
    await ensureTursoConfigResolved();
  }

  const mode = getDatabaseMode();
  const turso = getTursoConfig();
  const authSource = getAuthSource();
  const tursoDeclared = isTursoEnvDeclared();

  if (tursoDeclared && !turso) {
    const { rawDbUrl, rawAuth } = (() => {
      let db = (process.env.TURSO_DATABASE_URL ?? "").trim();
      let auth = (process.env.TURSO_AUTH_TOKEN ?? "").trim();
      if (db.startsWith("eyJ") && auth.startsWith("libsql:")) [db, auth] = [auth, db];
      return { rawDbUrl: db, rawAuth: auth };
    })();
    const tokenLooksLikeUrl = rawAuth.startsWith("libsql:");
    const urlHasEmbeddedToken = rawDbUrl.includes("authToken=");
    const tursoEnvKeys = Object.keys(process.env).filter((k) => /turso|libsql/i.test(k));

    if (mode === "vercel-sqlite") {
      try {
        await ensureClassRoomSchema();
        const [classRoomCount, childCount, inviteCount] = await Promise.all([
          prisma.classRoom.count(),
          prisma.child.count(),
          prisma.inviteCode.count(),
        ]);
        return NextResponse.json({
          ok: true,
          mode,
          tursoConfigured: false,
          fallback: "demo.db",
          tursoHost: rawDbUrl.includes("://")
            ? new URL(rawDbUrl.replace(/^libsql:/, "https:").split("?")[0]!).host
            : null,
          authSource,
          tokenFormat: tokenLooksLikeUrl ? "libsql_url_in_token_field" : "invalid",
          tursoEnvKeys,
          counts: { classRoom: classRoomCount, child: childCount, inviteCode: inviteCount },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "DB query failed";
        return NextResponse.json(
          {
            ok: false,
            mode,
            tursoConfigured: false,
            fallback: "demo.db",
            tursoEnvKeys,
            error: message,
          },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      {
        ok: false,
        mode,
        tursoConfigured: true,
        tursoHost: rawDbUrl.includes("://")
          ? new URL(rawDbUrl.replace(/^libsql:/, "https:").split("?")[0]!).host
          : null,
        authSource,
        tokenConfigured: Boolean(rawAuth),
        tokenFormat: tokenLooksLikeUrl ? "libsql_url_in_token_field" : "invalid",
        tursoEnvKeys,
        error: urlHasEmbeddedToken
          ? "Turso JWT를 TURSO_DATABASE_URL에서 추출하지 못했습니다."
          : tokenLooksLikeUrl
            ? "TURSO_AUTH_TOKEN에 libsql URL만 있고 JWT를 찾을 수 없습니다."
            : "Turso JWT가 없습니다.",
        hint: "코드가 모든 Turso/libsql env를 스캔합니다. JWT가 다른 변수명에 있으면 자동 인식됩니다.",
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
    await ensureDatabaseReady();
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
