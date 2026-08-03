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

describe("401 handling on unauthenticated endpoints", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("keeps an existing session when a sign-in attempt is rejected", async () => {
    localStorage.setItem("auth_token", "still-valid-token");
    localStorage.setItem("user_data", "still-valid-user");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(request("/auth/login-with-code", { method: "POST" })).rejects.toMatchObject({
      status: 401,
    });

    // Wrong credentials must not sign the current user out.
    expect(localStorage.getItem("auth_token")).toBe("still-valid-token");
    expect(localStorage.getItem("user_data")).toBe("still-valid-user");
  });

  it("still clears the session when an authenticated endpoint returns 401", async () => {
    localStorage.setItem("auth_token", "expired-token");
    localStorage.setItem("user_data", "expired-user");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(request("/accounts/")).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("user_data")).toBeNull();
  });
});

describe("request error message formatting", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const respondWith = (body: unknown, status: number) =>
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

  it("renders a FastAPI validation array as readable text without echoing the submitted value", async () => {
    respondWith(
      {
        detail: [
          {
            type: "value_error",
            loc: ["body", "password"],
            msg: "value is not a valid password",
            input: "super-secret-value",
          },
        ],
      },
      422
    );

    const error = await request("/auth/register").catch((e: Error) => e);

    expect((error as Error).message).toBe("password: value is not a valid password");
    // The `input` field echoes what the user typed - it must never reach a toast.
    expect((error as Error).message).not.toContain("super-secret-value");
  });

  it("joins multiple validation errors", async () => {
    respondWith(
      {
        detail: [
          { loc: ["body", "email"], msg: "invalid email" },
          { loc: ["body", "age"], msg: "must be positive" },
        ],
      },
      422
    );

    const error = await request("/auth/register").catch((e: Error) => e);

    expect((error as Error).message).toBe("email: invalid email; age: must be positive");
  });

  it("still unwraps an object-shaped detail", async () => {
    respondWith({ detail: { code: "LEGAL_ACCEPTANCE_REQUIRED", message: "sign first" } }, 400);

    const error = await request("/subscriptions").catch((e: Error) => e);

    expect((error as Error).message).toBe("sign first");
    expect(error).toMatchObject({ code: "LEGAL_ACCEPTANCE_REQUIRED" });
  });
});
