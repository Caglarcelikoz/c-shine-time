import { beforeAll, describe, expect, it } from "vitest";

// r2.ts reads R2_PUBLIC_URL at module load, so set it before importing.
const PUBLIC_URL = "https://img.example.com";

let needsRehost: (url: string) => boolean;

beforeAll(async () => {
  process.env.R2_PUBLIC_URL = PUBLIC_URL;
  ({ needsRehost } = await import("./rehost"));
});

describe("needsRehost", () => {
  it("flags external public image URLs for re-hosting", () => {
    expect(needsRehost("https://m.media-amazon.com/images/I/abc.jpg")).toBe(
      true,
    );
    expect(needsRehost("https://media.s-bol.com/x/watch.jpg")).toBe(true);
  });

  it("leaves URLs already served from our public bucket untouched", () => {
    expect(needsRehost(`${PUBLIC_URL}/watch-images/u1/abc.jpg`)).toBe(false);
  });

  it("does not flag non-public or malformed URLs (caller rejects those)", () => {
    expect(needsRehost("http://localhost/x.jpg")).toBe(false);
    expect(needsRehost("http://192.168.0.1/x.jpg")).toBe(false);
    expect(needsRehost("data:image/png;base64,AAAA")).toBe(false);
    expect(needsRehost("not a url")).toBe(false);
  });
});
