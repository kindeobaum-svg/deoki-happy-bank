import { describe, expect, it } from "vitest";
import {
  canCreateInvite,
  compactInviteCode,
  formatInviteCode,
  inviteCodesMatch,
  normalizeInviteCodeInput,
} from "@/lib/inviteCodeUtils";
import { mergeClassesWithChildren } from "@/lib/teacherClasses";

describe("normalizeInviteCodeInput", () => {
  it("trims, uppercases, and removes spaces", () => {
    expect(normalizeInviteCodeInput(" dk-child-000006 ")).toBe("DK-CHILD-000006");
    expect(normalizeInviteCodeInput("dk child 000006")).toBe("DKCHILD000006");
    expect(inviteCodesMatch("DK-CHILD-000006", "dk child 000006")).toBe(true);
  });

  it("keeps hyphens for DK-CHILD format", () => {
    expect(normalizeInviteCodeInput("DK-CHILD-000006")).toBe("DK-CHILD-000006");
  });
});

describe("inviteCodesMatch", () => {
  it("matches codes regardless of case, spaces, and hyphens", () => {
    expect(inviteCodesMatch("DK-CHILD-000006", "dk child 000006")).toBe(true);
    expect(inviteCodesMatch("DK-CHILD-000006", "DKCHILD000006")).toBe(true);
    expect(inviteCodesMatch("DK-CHILD-000006", "DK-CHILD-000007")).toBe(false);
  });
});

describe("formatInviteCode", () => {
  it("returns normalized display code", () => {
    expect(formatInviteCode(" dk-child-000006 ")).toBe("DK-CHILD-000006");
  });
});

describe("compactInviteCode", () => {
  it("removes hyphens for lookup", () => {
    expect(compactInviteCode("DK-CHILD-000006")).toBe("DKCHILD000006");
  });
});

describe("canCreateInvite", () => {
  it("allows director to invite teachers and parents", () => {
    expect(canCreateInvite("DIRECTOR", "TEACHER")).toBe(true);
    expect(canCreateInvite("DIRECTOR", "PARENT")).toBe(true);
  });

  it("allows teacher to invite parents only", () => {
    expect(canCreateInvite("TEACHER", "PARENT")).toBe(true);
    expect(canCreateInvite("TEACHER", "TEACHER")).toBe(false);
  });
});

describe("mergeClassesWithChildren", () => {
  it("includes class names from children not in local storage", () => {
    const merged = mergeClassesWithChildren(
      [{ id: "cls-1", name: "햇살반" }],
      ["무지개반", "햇살반"],
    );
    expect(merged.map((c) => c.name).sort()).toEqual(["무지개반", "햇살반"]);
  });
});
