import { beforeAll, describe, expect, it } from "vitest";

import i18n from "@/i18n";

// The dashboard row passes a '--' placeholder into an interpolation that every other caller fills
// with a number. Interpolation must render it verbatim rather than dropping or mangling it.
describe("mode_ratio interpolation", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders a numeric percent", () => {
    expect(i18n.t("dashboard:strategies_list.mode_ratio", { percent: 10 })).toBe("Ratio: 10%");
  });

  it("renders the unknown placeholder verbatim", () => {
    expect(i18n.t("dashboard:strategies_list.mode_ratio", { percent: "--" })).toBe("Ratio: --%");
  });

  it("renders the placeholder in Chinese too", async () => {
    await i18n.changeLanguage("zh");
    expect(i18n.t("dashboard:strategies_list.mode_ratio", { percent: "--" })).toBe("账户比例: --%");
    await i18n.changeLanguage("en");
  });
});
