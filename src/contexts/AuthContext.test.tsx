import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { AuthProvider } from "./AuthContext";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
}));

vi.mock("@/api", () => ({
  authApi: {
    getProfile: mocks.getProfile,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
  },
}));

const user: User = {
  id: "7",
  username: "vertex-user",
  email: "user@example.com",
};

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider storage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mocks.getProfile.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("stores a session-only login outside localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.login(user, "session-token", false));

    expect(sessionStorage.getItem("auth_token")).toBe("session-token");
    expect(JSON.parse(sessionStorage.getItem("user_data") || "null")).toEqual(user);
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("user_data")).toBeNull();
  });

  it("stores a remembered login in localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.login(user, "persistent-token", true));

    expect(localStorage.getItem("auth_token")).toBe("persistent-token");
    expect(JSON.parse(localStorage.getItem("user_data") || "null")).toEqual(user);
    expect(sessionStorage.getItem("auth_token")).toBeNull();
    expect(sessionStorage.getItem("user_data")).toBeNull();
  });

  it("restores authentication from sessionStorage on reload", () => {
    sessionStorage.setItem("auth_token", "session-token");
    sessionStorage.setItem("user_data", JSON.stringify(user));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe("session-token");
    expect(result.current.user).toEqual(user);
  });

  it("updates the user in the active session storage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.login(user, "session-token", false));
    act(() => result.current.updateUser({ username: "updated-user" }));

    expect(JSON.parse(sessionStorage.getItem("user_data") || "null")).toEqual({
      ...user,
      username: "updated-user",
    });
    expect(localStorage.getItem("user_data")).toBeNull();
  });

  it("refreshes a restored session user in sessionStorage", async () => {
    sessionStorage.setItem("auth_token", "session-token");
    sessionStorage.setItem("user_data", JSON.stringify(user));
    mocks.getProfile.mockResolvedValue({
      id: 7,
      email: "user@example.com",
      full_name: "Fresh User",
      is_active: true,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.username).toBe("Fresh User"));
    expect(JSON.parse(sessionStorage.getItem("user_data") || "null")).toEqual(result.current.user);
    expect(localStorage.getItem("user_data")).toBeNull();
  });

  it("ignores profile validation that completes after the token is replaced", async () => {
    let resolveProfile!: (profile: {
      id: number;
      email: string;
      full_name: string;
      is_active: boolean;
      is_admin: boolean;
    }) => void;
    mocks.getProfile.mockReturnValue(new Promise((resolve) => {
      resolveProfile = resolve;
    }));
    localStorage.setItem("auth_token", "old-token");
    localStorage.setItem("user_data", JSON.stringify(user));
    const newUser = { ...user, id: "8", username: "new-user", email: "new@example.com" };
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(mocks.getProfile).toHaveBeenCalledWith("old-token"));
    act(() => result.current.login(newUser, "new-token", true));
    await act(async () => {
      resolveProfile({
        id: 7,
        email: "user@example.com",
        full_name: "Stale Admin",
        is_active: true,
        is_admin: true,
      });
    });

    expect(result.current.token).toBe("new-token");
    expect(result.current.user).toEqual(newUser);
    expect(JSON.parse(localStorage.getItem("user_data") || "null")).toEqual(newUser);
  });

  it("does not log out a newer session when stale profile validation returns 401", async () => {
    let rejectProfile!: (error: unknown) => void;
    mocks.getProfile.mockReturnValue(new Promise((_, reject) => {
      rejectProfile = reject;
    }));
    localStorage.setItem("auth_token", "old-token");
    localStorage.setItem("user_data", JSON.stringify(user));
    const newUser = { ...user, id: "8", username: "new-user", email: "new@example.com" };
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(mocks.getProfile).toHaveBeenCalledWith("old-token"));
    act(() => result.current.login(newUser, "new-token", true));
    await act(async () => {
      rejectProfile({ status: 401, message: "Unauthorized" });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe("new-token");
    expect(result.current.user).toEqual(newUser);
    expect(localStorage.getItem("auth_token")).toBe("new-token");
  });

  it("clears persistent and session authentication on logout", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    localStorage.setItem("auth_token", "persistent-token");
    localStorage.setItem("user_data", JSON.stringify(user));
    sessionStorage.setItem("auth_token", "session-token");
    sessionStorage.setItem("user_data", JSON.stringify(user));
    localStorage.setItem("panda_quant_user", "legacy-persistent-user");
    sessionStorage.setItem("panda_quant_user", "legacy-session-user");

    act(() => result.current.logout());

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("user_data")).toBeNull();
    expect(sessionStorage.getItem("auth_token")).toBeNull();
    expect(sessionStorage.getItem("user_data")).toBeNull();
    expect(localStorage.getItem("panda_quant_user")).toBeNull();
    expect(sessionStorage.getItem("panda_quant_user")).toBeNull();
  });
});
