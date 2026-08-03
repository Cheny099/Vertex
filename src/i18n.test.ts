import { beforeEach, describe, expect, it } from "vitest";

// Guards the language-detection config: a bad option here throws inside i18n.init(), which runs at
// module scope in main.tsx and would leave the whole app rendering nothing.
describe("i18n language detection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initialises without throwing and exposes a supported language", async () => {
    const { default: i18n } = await import("./i18n");

    expect(i18n.isInitialized).toBe(true);
    expect(["en", "zh"]).toContain(i18n.language);
  });

  it("collapses a regional tag to its base language", async () => {
    const { default: i18n } = await import("./i18n");

    await i18n.changeLanguage("zh-CN");
    expect(i18n.resolvedLanguage).toBe("zh");
    expect(i18n.t("common:error")).toBe("错误");
  });

  it("resolves the keys that were previously missing", async () => {
    const { default: i18n } = await import("./i18n");

    for (const lng of ["en", "zh"]) {
      await i18n.changeLanguage(lng);
      for (const key of ["common:error_load_failed", "common:error_operation_failed", "common:required"]) {
        expect(i18n.exists(key), `${key} missing in ${lng}`).toBe(true);
        expect(i18n.t(key)).not.toBe(key);
      }
    }
  });
});
