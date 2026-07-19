import { describe, expect, it } from "vitest";
import { isSafePublicUrl } from "./safe-url";

describe("isSafePublicUrl", () => {
  it("allows public https and http URLs", () => {
    expect(isSafePublicUrl("https://www.bol.com/nl/p/watch/123")).toBe(true);
    expect(isSafePublicUrl("http://example.com/img.jpg")).toBe(true);
    expect(isSafePublicUrl("https://m.media-amazon.com/images/I/abc.jpg")).toBe(
      true,
    );
  });

  it("rejects non-http(s) schemes", () => {
    expect(isSafePublicUrl("ftp://example.com/x")).toBe(false);
    expect(isSafePublicUrl("file:///etc/passwd")).toBe(false);
    expect(isSafePublicUrl("data:image/png;base64,AAAA")).toBe(false);
    expect(isSafePublicUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isSafePublicUrl("not a url")).toBe(false);
    expect(isSafePublicUrl("")).toBe(false);
    expect(isSafePublicUrl("//example.com/x")).toBe(false);
  });

  it("rejects loopback and localhost", () => {
    expect(isSafePublicUrl("http://localhost/x")).toBe(false);
    expect(isSafePublicUrl("http://127.0.0.1/x")).toBe(false);
    expect(isSafePublicUrl("http://[::1]/x")).toBe(false);
    expect(isSafePublicUrl("http://0.0.0.0/x")).toBe(false);
  });

  it("rejects private RFC-1918 and link-local ranges", () => {
    expect(isSafePublicUrl("http://10.0.0.5/x")).toBe(false);
    expect(isSafePublicUrl("http://192.168.1.1/x")).toBe(false);
    expect(isSafePublicUrl("http://169.254.169.254/latest/meta-data")).toBe(
      false,
    );
    expect(isSafePublicUrl("http://172.16.0.1/x")).toBe(false);
    expect(isSafePublicUrl("http://172.31.255.255/x")).toBe(false);
  });

  it("allows 172 addresses outside the private block", () => {
    expect(isSafePublicUrl("http://172.15.0.1/x")).toBe(true);
    expect(isSafePublicUrl("http://172.32.0.1/x")).toBe(true);
  });

  it("rejects internal TLD suffixes", () => {
    expect(isSafePublicUrl("http://db.internal/x")).toBe(false);
    expect(isSafePublicUrl("http://printer.local/x")).toBe(false);
  });
});
