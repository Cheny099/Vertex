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
    mocks.request.mockResolvedValue({
      id: 7, email: "user@example.com", is_active: true,
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    });

    await authApi.getProfile("fresh-token");

    expect(mocks.request).toHaveBeenCalledWith("/auth/me", {
      headers: { Authorization: "Bearer fresh-token" },
    });
  });

  it("forwards cancellation through password, OTP and profile requests", async () => {
    const { signal } = new AbortController();
    mocks.request.mockResolvedValue({ access_token: "token", token_type: "bearer" });
    await authApi.login({ username: "user@example.com", password: "password" }, signal);
    expect(mocks.request).toHaveBeenLastCalledWith("/auth/login", expect.objectContaining({ signal }));
    await authApi.loginWithCode({ email: "user@example.com", password: "password", code: "1234" }, signal);
    expect(mocks.request).toHaveBeenLastCalledWith("/auth/login-with-code", expect.objectContaining({ signal }));
    mocks.request.mockResolvedValue({ id: 7, email: "user@example.com", is_active: true, created_at: "", updated_at: "" });
    await authApi.getProfile("token", signal);
    expect(mocks.request).toHaveBeenLastCalledWith("/auth/me", { signal, headers: { Authorization: "Bearer token" } });
  });
});
