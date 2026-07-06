import type { ClassRoom, PrismaClient } from "@prisma/client";

export type ClassRoomDto = {
  id: string;
  name: string;
};

export function toClassRoomDto(room: ClassRoom): ClassRoomDto {
  return { id: room.id, name: room.name };
}

/** DB 원아 반 이름 중 ClassRoom에 없는 항목을 자동 등록 */
export async function syncClassRoomsFromChildren(prisma: PrismaClient): Promise<void> {
  const children = await prisma.child.findMany({
    select: { className: true },
    distinct: ["className"],
  });

  const names = [...new Set(children.map((c) => c.className.trim()).filter(Boolean))];
  if (names.length === 0) return;

  const existing = await prisma.classRoom.findMany({
    where: { name: { in: names } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((c) => c.name));

  const missing = names.filter((name) => !existingNames.has(name));
  if (missing.length === 0) return;

  await prisma.classRoom.createMany({
    data: missing.map((name) => ({ name })),
  });
}

export async function listClassRooms(prisma: PrismaClient): Promise<ClassRoomDto[]> {
  await syncClassRoomsFromChildren(prisma);
  const rooms = await prisma.classRoom.findMany({ orderBy: { name: "asc" } });
  return rooms.map(toClassRoomDto);
}

export async function createClassRoom(prisma: PrismaClient, name: string): Promise<ClassRoomDto> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("반 이름을 입력해 주세요.");
  }

  const existing = await prisma.classRoom.findUnique({ where: { name: trimmed } });
  if (existing) {
    throw new Error("이미 등록된 반 이름입니다.");
  }

  const room = await prisma.classRoom.create({ data: { name: trimmed } });
  return toClassRoomDto(room);
}

export async function updateClassRoom(
  prisma: PrismaClient,
  id: string,
  name: string,
): Promise<ClassRoomDto> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("반 이름을 입력해 주세요.");
  }

  const current = await prisma.classRoom.findUnique({ where: { id } });
  if (!current) {
    throw new Error("반을 찾을 수 없습니다.");
  }

  if (current.name === trimmed) {
    return toClassRoomDto(current);
  }

  const duplicate = await prisma.classRoom.findFirst({
    where: { name: trimmed, id: { not: id } },
  });
  if (duplicate) {
    throw new Error("이미 등록된 반 이름입니다.");
  }

  const room = await prisma.$transaction(async (tx) => {
    const updated = await tx.classRoom.update({
      where: { id },
      data: { name: trimmed },
    });
    await tx.child.updateMany({
      where: { className: current.name },
      data: { className: trimmed },
    });
    return updated;
  });

  return toClassRoomDto(room);
}

export async function deleteClassRoom(prisma: PrismaClient, id: string): Promise<void> {
  const room = await prisma.classRoom.findUnique({ where: { id } });
  if (!room) {
    throw new Error("반을 찾을 수 없습니다.");
  }

  const childCount = await prisma.child.count({ where: { className: room.name } });
  if (childCount > 0) {
    throw new Error("원아가 있는 반은 삭제할 수 없습니다.");
  }

  await prisma.classRoom.delete({ where: { id } });
}

/** 원아 등록 시 반 이름이 ClassRoom에 없으면 자동 생성 */
export async function ensureClassRoomForChild(prisma: PrismaClient, className: string): Promise<void> {
  const trimmed = className.trim();
  if (!trimmed) return;

  await prisma.classRoom.upsert({
    where: { name: trimmed },
    create: { name: trimmed },
    update: {},
  });
}
