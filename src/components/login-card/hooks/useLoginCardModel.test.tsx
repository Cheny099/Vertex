import { act, cleanup, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLoginCardModel } from "./useLoginCardModel";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  login: vi.fn(),
  persistLogin: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/api", () => ({
  authApi: {
    getProfile: mocks.getProfile,
    login: mocks.login,
  },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ login: mocks.persistLogin }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function wrapper({ children }: PropsWithChildren) {
  return (
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      {children}
    </MemoryRouter>
  );
}

describe("useLoginCardModel persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mocks.login.mockResolvedValue({ access_token: "session-token", token_type: "bearer" });
    mocks.getProfile.mockResolvedValue({
      id: 7,
      email: "user@example.com",
      full_name: "Vertex User",
      is_active: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("delegates the remember-me choice to the auth provider", async () => {
    const { result } = renderHook(() => useLoginCardModel(), { wrapper });

    act(() => {
      result.current.setEmail("user@example.com");
      result.current.setPassword("secret12");
      result.current.setRememberMe(false);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mocks.persistLogin).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com", id: "7" }),
      "session-token",
      false,
    );
    expect(mocks.getProfile).toHaveBeenCalledWith("session-token");
  });

  it("does not persist authentication before the auth provider handles it", async () => {
    const { result } = renderHook(() => useLoginCardModel(), { wrapper });

    act(() => {
      result.current.setEmail("user@example.com");
      result.current.setPassword("secret12");
      result.current.setRememberMe(false);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(sessionStorage.getItem("auth_token")).toBeNull();
  });
});
