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

  it("releases the loading flag when the pending load is abandoned", () => {
    const { result } = renderHook(() => useAnnouncementManagerState());

    // An edit is in flight: the dialog shows its spinner overlay.
    act(() => {
      result.current.invalidatePendingEdit();
      result.current.setIsLoadingDetail(true);
    });
    expect(result.current.isLoadingDetail).toBe(true);

    // Switching to create abandons that load. Its response will skip its own cleanup because the
    // id no longer matches, so the flag must be released here or the create form stays covered by
    // the spinner and silently refuses to submit.
    act(() => {
      result.current.openCreate();
    });

    expect(result.current.isLoadingDetail).toBe(false);
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
