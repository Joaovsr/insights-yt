import { describe, expect, it } from "vitest";
import { extractVideoId } from "./youtube";

describe("extractVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=_RvNczunfsQ&list=WL&t=20", "_RvNczunfsQ"],
    ["https://youtu.be/_RvNczunfsQ?t=10", "_RvNczunfsQ"],
    ["https://youtube.com/shorts/_RvNczunfsQ", "_RvNczunfsQ"],
    ["https://youtube.com/embed/_RvNczunfsQ", "_RvNczunfsQ"],
    ["https://youtube.com/live/_RvNczunfsQ", "_RvNczunfsQ"],
  ])("extracts an id from %s", (input, expected) => {
    expect(extractVideoId(input)).toBe(expected);
  });

  it("rejects non-YouTube and malformed URLs", () => {
    expect(extractVideoId("https://example.com/watch?v=_RvNczunfsQ")).toBeNull();
    expect(extractVideoId("_RvNczunfsQ")).toBeNull();
    expect(extractVideoId("not a video")).toBeNull();
  });
});
