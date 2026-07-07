import { describe, expect, it, vi } from "vitest";
import type { Child, PrismaClient } from "@prisma/client";
import { findChildRecord } from "@/lib/childLookup";

function mockPrisma(children: Child[]) {
  return {
    child: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        children.find((c) => c.id === where.id) ?? null,
      ),
      findFirst: vi.fn(
        async ({
          where,
          orderBy,
        }: {
          where: {
            OR?: Array<{ accountNumber: string }>;
            name?: string;
            className?: string;
          };
          orderBy?: { id: string };
        }) => {
          if (where.OR) {
            const codes = where.OR.map((o) => o.accountNumber);
            return children.find((c) => codes.includes(c.accountNumber)) ?? null;
          }
          if (where.name && where.className) {
            const matches = children.filter(
              (c) => c.name === where.name && c.className === where.className,
            );
            if (orderBy?.id === "desc") {
              return matches.at(-1) ?? null;
            }
            return matches[0] ?? null;
          }
          return null;
        },
      ),
      findMany: vi.fn(async () => children),
    },
  } as unknown as PrismaClient;
}

const sampleChildren: Child[] = [
  {
    id: "child-1",
    name: "김하늘",
    className: "햇살반",
    accountNumber: "DK-CHILD-000001",
    points: 0,
    totalSaved: 0,
    avatar: "🌟",
  },
  {
    id: "child-2",
    name: "테스트아이",
    className: "햇살반",
    accountNumber: "DK-CHILD-000099",
    points: 0,
    totalSaved: 0,
    avatar: "🌈",
  },
];

describe("findChildRecord", () => {
  it("finds child by id", async () => {
    const prisma = mockPrisma(sampleChildren);
    const found = await findChildRecord(prisma, { childId: "child-1" });
    expect(found?.id).toBe("child-1");
  });

  it("finds child by accountNumber when id is wrong", async () => {
    const prisma = mockPrisma(sampleChildren);
    const found = await findChildRecord(prisma, {
      childId: "wrong-id",
      accountNumber: "DK-CHILD-000099",
    });
    expect(found?.id).toBe("child-2");
  });

  it("finds child by name and className", async () => {
    const prisma = mockPrisma(sampleChildren);
    const found = await findChildRecord(prisma, {
      name: "테스트아이",
      className: "햇살반",
    });
    expect(found?.accountNumber).toBe("DK-CHILD-000099");
  });
});
