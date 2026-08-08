import { describe, expect, it } from "vitest";
import { extractVideoId, parseVideoRequest } from "./youtube.js";

describe("extractVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=_RvNczunfsQ&list=WL&t=20", "_RvNczunfsQ"],
    ["https://youtu.be/_RvNczunfsQ?t=10", "_RvNczunfsQ"],
    ["https://youtube.com/shorts/_RvNczunfsQ", "_RvNczunfsQ"],
    ["https://youtube.com/embed/_RvNczunfsQ", "_RvNczunfsQ"],
  ])("extracts an id from %s", (input, expected) => {
    expect(extractVideoId(input)).toBe(expected);
  });

  it("rejects non-YouTube and malformed URLs", () => {
    expect(extractVideoId("https://example.com/watch?v=_RvNczunfsQ")).toBeNull();
    expect(extractVideoId("_RvNczunfsQ")).toBeNull();
    expect(extractVideoId("not a video")).toBeNull();
  });
});

describe("parseVideoRequest", () => {
  it("accepts one or two distinct videos", () => {
    expect(parseVideoRequest({ urls: ["https://youtu.be/_RvNczunfsQ", "https://youtu.be/dQw4w9WgXcQ"] })).toEqual([
      "_RvNczunfsQ",
      "dQw4w9WgXcQ",
    ]);
  });

  it("rejects duplicated videos", () => {
    expect(() => parseVideoRequest({ urls: ["https://youtu.be/_RvNczunfsQ", "https://youtube.com/watch?v=_RvNczunfsQ"] })).toThrow(
      "Use vídeos diferentes",
    );
  });
});
