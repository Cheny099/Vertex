import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { request } from "./core";

vi.mock("../i18n", () => ({
  default: {
    exists: vi.fn(() => false),
    t: vi.fn((key: string) => key),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("request authentication cleanup", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("clears persistent and session authentication after a 401 response", async () => {
    localStorage.setItem("auth_token", "persistent-token");
    localStorage.setItem("user_data", "persistent-user");
    sessionStorage.setItem("auth_token", "session-token");
    sessionStorage.setItem("user_data", "session-user");
    localStorage.setItem("panda_quant_user", "legacy-persistent-user");
    sessionStorage.setItem("panda_quant_user", "legacy-session-user");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(request("/protected")).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("user_data")).toBeNull();
    expect(sessionStorage.getItem("auth_token")).toBeNull();
    expect(sessionStorage.getItem("user_data")).toBeNull();
    expect(localStorage.getItem("panda_quant_user")).toBeNull();
    expect(sessionStorage.getItem("panda_quant_user")).toBeNull();
  });

  it("does not clear a newer session when an older request receives 401", async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchResponse = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const unauthorizedListener = vi.fn();
    localStorage.setItem("auth_token", "old-token");
    localStorage.setItem("user_data", "old-user");
    window.history.replaceState({}, "", "/dashboard");
    window.addEventListener("panda-auth-unauthorized", unauthorizedListener);
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(fetchResponse));

    const pendingRequest = request("/protected");
    localStorage.setItem("auth_token", "new-token");
    localStorage.setItem("user_data", "new-user");
    resolveFetch(new Response(null, { status: 401 }));

    await expect(pendingRequest).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem("auth_token")).toBe("new-token");
    expect(localStorage.getItem("user_data")).toBe("new-user");
    expect(unauthorizedListener).not.toHaveBeenCalled();
    window.removeEventListener("panda-auth-unauthorized", unauthorizedListener);
  });
});
