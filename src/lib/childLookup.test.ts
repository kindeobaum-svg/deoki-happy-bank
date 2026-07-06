import { describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { findChildRecord } from "@/lib/childLookup";

const prisma = new PrismaClient({
  datasources: { db: { url: "file:./prisma/test-invite.db" } },
});

describe("findChildRecord", () => {
  it("finds child by id", async () => {
    const child = await prisma.child.findFirst();
    expect(child).toBeTruthy();
    const found = await findChildRecord(prisma, { childId: child!.id });
    expect(found?.id).toBe(child!.id);
  });

  it("finds child by accountNumber when id is wrong", async () => {
    const child = await prisma.child.findFirst({ where: { accountNumber: "DK-CHILD-000099" } });
    expect(child).toBeTruthy();
    const found = await findChildRecord(prisma, {
      childId: "wrong-id",
      accountNumber: child!.accountNumber,
    });
    expect(found?.id).toBe(child!.id);
  });

  it("finds child by name and className", async () => {
    const found = await findChildRecord(prisma, {
      name: "테스트아이",
      className: "햇살반",
    });
    expect(found?.accountNumber).toBe("DK-CHILD-000099");
  });
});
