import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSettingsAddAccountForm } from "./useSettingsAddAccountForm";

const params = {
  isLimitReached: () => false,
  otherCount: 0,
  t: ((key: string) => key) as never,
  turboflowCount: 0,
};

// useSettingsAccountActions calls handleCloseAddAccount when a create succeeds. It was consumed
// without ever being returned, so the success path threw `undefined is not a function` — and the
// project's typecheck script could not catch it (see the note in package.json).
describe("useSettingsAddAccountForm contract", () => {
  it("exposes the close handler its consumer calls", () => {
    const { result } = renderHook(() => useSettingsAddAccountForm(params));

    expect(typeof result.current.handleCloseAddAccount).toBe("function");
  });

  it("open and close actually toggle the dialog", () => {
    const { result } = renderHook(() => useSettingsAddAccountForm(params));

    act(() => result.current.handleOpenAddAccount());
    expect(result.current.addAccountDialogBaseProps.open).toBe(true);

    act(() => result.current.handleCloseAddAccount());
    expect(result.current.addAccountDialogBaseProps.open).toBe(false);
  });

  it("closing on success does not throw", () => {
    const { result } = renderHook(() => useSettingsAddAccountForm(params));

    act(() => result.current.handleOpenAddAccount());
    const onCreateSuccess = vi.fn(() => {
      result.current.resetNewAccount();
      result.current.handleCloseAddAccount();
    });

    act(() => onCreateSuccess());

    expect(onCreateSuccess).toHaveReturned();
    expect(result.current.addAccountDialogBaseProps.open).toBe(false);
  });
});
