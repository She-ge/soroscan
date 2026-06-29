import { renderHook, act } from "@testing-library/react"
import { useLocalStorageState } from "../lib/hooks/useLocalStorageState"

describe("useLocalStorageState Hook", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("should initialize with default value if localStorage is empty", () => {
    const { result } = renderHook(() => 
      useLocalStorageState("test-key", "default-value")
    )
    expect(result.current[0]).toBe("default-value")
  })

  it("should initialize with value from localStorage if present", () => {
    localStorage.setItem("test-key", JSON.stringify("stored-value"))
    const { result } = renderHook(() => 
      useLocalStorageState("test-key", "default-value")
    )
    expect(result.current[0]).toBe("stored-value")
  })

  it("should update value in localStorage when state changes", () => {
    const { result } = renderHook(() => 
      useLocalStorageState("test-key", "initial-value")
    )

    act(() => {
      result.current[1]("new-value")
    })

    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"))
    expect(result.current[0]).toBe("new-value")
  })

  it("should handle numeric values correctly", () => {
    const { result } = renderHook(() => 
      useLocalStorageState("numeric-key", 100)
    )

    expect(result.current[0]).toBe(100)

    act(() => {
      result.current[1](200)
    })

    expect(result.current[0]).toBe(200)
    expect(localStorage.getItem("numeric-key")).toBe(JSON.stringify(200))
  })
})
