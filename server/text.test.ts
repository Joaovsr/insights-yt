import { describe, expect, it } from "vitest";
import { cleanYouTubeText } from "./text.js";

describe("cleanYouTubeText", () => {
  it("decodes common entities and removes YouTube markup", () => {
    expect(cleanYouTubeText("&quot;Focus&quot;<br><a href=\"https://example.com\">link</a> &amp; work"))
      .toBe('"Focus"\nlink & work');
  });
});
