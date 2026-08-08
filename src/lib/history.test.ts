import { describe, expect, it } from "vitest";
import { clearSearchHistory, readSearchHistory, rememberSearch } from "./history";
import { analysisFixture } from "../test/analysisFixture";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

class ThrowingStorage extends MemoryStorage {
  override getItem(): string | null { throw new DOMException("blocked", "SecurityError"); }
  override removeItem(): void { throw new DOMException("blocked", "SecurityError"); }
  override setItem(): void { throw new DOMException("full", "QuotaExceededError"); }
}

describe("search history", () => {
  it("persists and restores an analysis", () => {
    const storage = new MemoryStorage();
    rememberSearch("https://youtu.be/_RvNczunfsQ", analysisFixture, storage);
    expect(readSearchHistory(storage)).toHaveLength(1);
    expect(readSearchHistory(storage)[0].result.video.videoId).toBe("_RvNczunfsQ");
  });

  it("replaces a previous search for the same video", () => {
    const storage = new MemoryStorage();
    rememberSearch("https://youtu.be/_RvNczunfsQ", analysisFixture, storage);
    rememberSearch("https://www.youtube.com/watch?v=_RvNczunfsQ", analysisFixture, storage);
    expect(readSearchHistory(storage)).toHaveLength(1);
  });

  it("ignores invalid persisted data and can clear history", () => {
    const storage = new MemoryStorage();
    storage.setItem("yt-signals:search-history:v1", "not-json");
    expect(readSearchHistory(storage)).toEqual([]);
    clearSearchHistory(storage);
    expect(storage.length).toBe(0);
  });

  it("does not break the app when localStorage is unavailable", () => {
    const storage = new ThrowingStorage();
    expect(readSearchHistory(storage)).toEqual([]);
    expect(() => rememberSearch("https://youtu.be/_RvNczunfsQ", analysisFixture, storage)).not.toThrow();
    expect(() => clearSearchHistory(storage)).not.toThrow();
  });

  it("rejects persisted entries with invalid dates", () => {
    const storage = new MemoryStorage();
    rememberSearch("https://youtu.be/_RvNczunfsQ", analysisFixture, storage);
    const key = storage.key(0)!;
    const persisted = JSON.parse(storage.getItem(key)!);
    persisted[0].searchedAt = "not-a-date";
    storage.setItem(key, JSON.stringify(persisted));
    expect(readSearchHistory(storage)).toEqual([]);
  });
});
