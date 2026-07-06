import { describe, expect, it } from "vitest";
import {
  createClassRoom,
  listClassRooms,
  syncClassRoomsFromChildren,
  updateClassRoom,
} from "@/lib/classService";
import { prisma } from "@/lib/db";

describe("classService", () => {
  it("syncs class rooms from existing children", async () => {
    const child = await prisma.child.create({
      data: {
        name: "테스트원아",
        className: "테스트반",
        accountNumber: `TEST-${Date.now()}`,
        avatar: "🌻",
      },
    });

    await syncClassRoomsFromChildren(prisma);
    const classes = await listClassRooms(prisma);
    expect(classes.some((c) => c.name === "테스트반")).toBe(true);

    await prisma.child.delete({ where: { id: child.id } });
    await prisma.classRoom.deleteMany({ where: { name: "테스트반" } });
  });

  it("renames class room and updates children className", async () => {
    const room = await createClassRoom(prisma, `개나리반-${Date.now()}`);
    const child = await prisma.child.create({
      data: {
        name: "리네임테스트",
        className: room.name,
        accountNumber: `TEST-R-${Date.now()}`,
        avatar: "🐻",
      },
    });

    const updated = await updateClassRoom(prisma, room.id, `${room.name}-수정`);
    expect(updated.name).toBe(`${room.name}-수정`);

    const refreshed = await prisma.child.findUnique({ where: { id: child.id } });
    expect(refreshed?.className).toBe(`${room.name}-수정`);

    await prisma.child.delete({ where: { id: child.id } });
    await prisma.classRoom.delete({ where: { id: room.id } });
  });
});
