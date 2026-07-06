import { describe, expect, it } from "vitest";
import { copyTextToClipboard } from "@/lib/clipboard";

describe("copyTextToClipboard", () => {
  it("returns false for empty text", async () => {
    await expect(copyTextToClipboard("")).resolves.toBe(false);
  });
});
