import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAnnouncementManagerState } from "./useAnnouncementManagerState";

// The editor loads a record asynchronously while the dialog is already open. Every transition that
// changes what the editor is for has to invalidate the pending load, or a late response writes the
// previous record into whatever the editor has become.
describe("useAnnouncementManagerState pending-edit invalidation", () => {
  it("invalidates a pending load when the editor resets to create", () => {
    const { result } = renderHook(() => useAnnouncementManagerState());

    // An edit of announcement A starts loading.
    let requestId = 0;
    act(() => {
      requestId = result.current.invalidatePendingEdit();
    });
    expect(result.current.editRequestRef.current).toBe(requestId);

    // The admin abandons it and clicks "Create Announcement" before the response lands.
    act(() => {
      result.current.openCreate();
    });

    // A's late response must now be ignored rather than filling the create form.
    expect(result.current.editRequestRef.current).not.toBe(requestId);
    expect(result.current.editingId).toBeNull();
  });

  it("invalidates the previous load when a different record is opened", () => {
    const { result } = renderHook(() => useAnnouncementManagerState());

    let first = 0;
    let second = 0;
    act(() => {
      first = result.current.invalidatePendingEdit();
      second = result.current.invalidatePendingEdit();
    });

    expect(second).not.toBe(first);
    expect(result.current.editRequestRef.current).toBe(second);
  });
});
