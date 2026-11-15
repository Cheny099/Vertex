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

describe('announcement shared links', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('falls back once on a language-scoped 404', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Announcement not found' }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 7, title: 'Original', lang: 'zh', content_md: 'Text' })));
    vi.stubGlobal('fetch', fetchMock);
    await expect(announcementApi.get(7, 'en-US')).resolves.toMatchObject({ title: 'Original', lang: 'zh' });
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      '/api/v1/public/announcements/7?lang=en', '/api/v1/public/announcements/7?lang=zh',
    ]);
  });
  it.each([403, 500, 503])('does not hide a %s failure with a language retry', async status => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Failed' }), { status }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(announcementApi.get(7, 'zh')).rejects.toMatchObject({ status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('returns a genuine 404 after both languages miss, without retrying indefinitely', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response('{}', { status: 404 })));
    vi.stubGlobal('fetch', fetchMock);
    await expect(announcementApi.get(7, 'zh')).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
