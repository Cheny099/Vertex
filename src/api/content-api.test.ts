import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { announcementApi, legalApi } from "./content-api";

vi.mock("../i18n", () => ({
  default: {
    exists: vi.fn(() => false),
    t: vi.fn((key: string) => key),
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

// The backend types every `lang` query param as Literal["zh", "en"]; a regional tag is a 422.
describe("content API language normalisation", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const requestedUrl = () => String(fetchMock.mock.calls[0][0]);

  it.each([
    ["zh-CN", "zh"],
    ["zh-TW", "zh"],
    ["zh", "zh"],
    ["en-US", "en"],
    ["en", "en"],
  ])("sends %s as lang=%s for legal docs", async (detected, expected) => {
    await legalApi.getPublicDoc("auto_trade_notice", detected);

    expect(requestedUrl()).toContain(`lang=${expected}`);
    expect(requestedUrl()).toMatch(/lang=(zh|en)(&|$)/);
  });

  it("normalises the announcement endpoints too", async () => {
    await announcementApi.list("zh-CN", 20);
    expect(requestedUrl()).toContain("lang=zh");
    expect(requestedUrl()).toContain("limit=20");
  });

  it("treats an unknown tag as English rather than passing it through", async () => {
    await announcementApi.getPopup("fr-FR");

    expect(requestedUrl()).toContain("lang=en");
    expect(requestedUrl()).not.toContain("fr");
  });
});
