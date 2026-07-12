import { afterEach, describe, expect, it, vi } from "vitest";

import { authApi } from "./auth-account-user";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock("./core", () => ({
  API_BASE_URL: "/api/v1",
  request: mocks.request,
}));

vi.mock("../i18n", () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

describe("authApi.getProfile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses a newly issued token before authentication is persisted", async () => {
    mocks.request.mockResolvedValue({ id: 7, email: "user@example.com" });

    await authApi.getProfile("fresh-token");

    expect(mocks.request).toHaveBeenCalledWith("/auth/me", {
      headers: { Authorization: "Bearer fresh-token" },
    });
  });
});
