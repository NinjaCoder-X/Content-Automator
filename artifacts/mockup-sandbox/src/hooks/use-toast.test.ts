import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { reducer } from "./use-toast"

describe("toast reducer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe("ADD_TOAST", () => {
    it("adds a toast to an empty state", () => {
      const initialState = { toasts: [] }
      const toast = { id: "1", title: "Test Toast", open: true }

      const nextState = reducer(initialState, {
        type: "ADD_TOAST",
        toast,
      })

      expect(nextState.toasts).toHaveLength(1)
      expect(nextState.toasts[0]).toEqual(toast)
    })

    it("enforces TOAST_LIMIT and keeps only the latest toast", () => {
      const initialToast = { id: "1", title: "First Toast", open: true }
      const initialState = { toasts: [initialToast] }
      const newToast = { id: "2", title: "Second Toast", open: true }

      const nextState = reducer(initialState, {
        type: "ADD_TOAST",
        toast: newToast,
      })

      expect(nextState.toasts).toHaveLength(1)
      expect(nextState.toasts[0]).toEqual(newToast)
    })
  })

  describe("UPDATE_TOAST", () => {
    it("updates matching toast properties", () => {
      const toast = { id: "1", title: "Old Title", description: "Old Desc", open: true }
      const initialState = { toasts: [toast] }

      const nextState = reducer(initialState, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "Updated Title" },
      })

      expect(nextState.toasts).toHaveLength(1)
      expect(nextState.toasts[0]).toEqual({
        id: "1",
        title: "Updated Title",
        description: "Old Desc",
        open: true,
      })
    })

    it("does not modify toasts with different id", () => {
      const toast = { id: "1", title: "Existing Title", open: true }
      const initialState = { toasts: [toast] }

      const nextState = reducer(initialState, {
        type: "UPDATE_TOAST",
        toast: { id: "2", title: "Non-matching ID Title" },
      })

      expect(nextState.toasts).toHaveLength(1)
      expect(nextState.toasts[0]).toEqual(toast)
    })
  })

  describe("DISMISS_TOAST", () => {
    it("dismisses a specific toast by setting open to false", () => {
      const toast = { id: "1", title: "Active Toast", open: true }
      const initialState = { toasts: [toast] }

      const nextState = reducer(initialState, {
        type: "DISMISS_TOAST",
        toastId: "1",
      })

      expect(nextState.toasts).toHaveLength(1)
      expect(nextState.toasts[0].open).toBe(false)
    })

    it("dismisses all toasts when toastId is undefined", () => {
      const toast1 = { id: "1", title: "Toast 1", open: true }
      const toast2 = { id: "2", title: "Toast 2", open: true }
      const initialState = { toasts: [toast1, toast2] }

      const nextState = reducer(initialState, {
        type: "DISMISS_TOAST",
        toastId: undefined,
      })

      expect(nextState.toasts).toHaveLength(2)
      expect(nextState.toasts[0].open).toBe(false)
      expect(nextState.toasts[1].open).toBe(false)
    })

    it("does not dismiss non-matching toast when toastId is specified", () => {
      const toast1 = { id: "1", title: "Toast 1", open: true }
      const toast2 = { id: "2", title: "Toast 2", open: true }
      const initialState = { toasts: [toast1, toast2] }

      const nextState = reducer(initialState, {
        type: "DISMISS_TOAST",
        toastId: "1",
      })

      expect(nextState.toasts[0].open).toBe(false)
      expect(nextState.toasts[1].open).toBe(true)
    })
  })

  describe("REMOVE_TOAST", () => {
    it("removes a specific toast by id", () => {
      const toast1 = { id: "1", title: "Toast 1", open: false }
      const toast2 = { id: "2", title: "Toast 2", open: false }
      const initialState = { toasts: [toast1, toast2] }

      const nextState = reducer(initialState, {
        type: "REMOVE_TOAST",
        toastId: "1",
      })

      expect(nextState.toasts).toHaveLength(1)
      expect(nextState.toasts[0]).toEqual(toast2)
    })

    it("removes all toasts when toastId is undefined", () => {
      const toast1 = { id: "1", title: "Toast 1", open: false }
      const toast2 = { id: "2", title: "Toast 2", open: false }
      const initialState = { toasts: [toast1, toast2] }

      const nextState = reducer(initialState, {
        type: "REMOVE_TOAST",
        toastId: undefined,
      })

      expect(nextState.toasts).toEqual([])
    })

    it("does not remove anything if toastId is not found", () => {
      const toast1 = { id: "1", title: "Toast 1", open: false }
      const initialState = { toasts: [toast1] }

      const nextState = reducer(initialState, {
        type: "REMOVE_TOAST",
        toastId: "non-existent",
      })

      expect(nextState.toasts).toHaveLength(1)
      expect(nextState.toasts[0]).toEqual(toast1)
    })
  })
})
