import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import "@testing-library/jest-dom"

import {
  ToastProvider,
  showToast,
  useToast,
  type ToastType,
} from "../context/ToastContext"

function ToastTrigger({
  type = "success",
  title = "Test Title",
  message = "Test message",
}: {
  type?: ToastType
  title?: string
  message?: string
}) {
  const { showToast: show } = useToast()

  return (
    <button
      type="button"
      onClick={() => show(message, type, title)}
    >
      Show Toast
    </button>
  )
}

describe("Toast system", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })

    jest.useRealTimers()
  })

  it("renders a toast with an icon, title, and message", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole("button", {
      name: "Show Toast",
    }))

    const toast = screen.getByTestId("toast")

    expect(toast).toHaveAttribute(
      "data-toast-type",
      "success",
    )
    expect(
      screen.getByTestId("toast-icon-success"),
    ).toBeInTheDocument()
    expect(screen.getByText("Test Title")).toBeInTheDocument()
    expect(screen.getByText("Test message")).toBeInTheDocument()
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("places the toast container at the bottom-right by default", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    )

    const container = screen.getByTestId("toast-container")

    expect(container).toHaveAttribute(
      "data-position",
      "bottom-right",
    )
    expect(container).toHaveClass("bottom-4", "right-4")
  })

  it("supports an optional top-right position", () => {
    render(
      <ToastProvider position="top-right">
        <ToastTrigger />
      </ToastProvider>,
    )

    const container = screen.getByTestId("toast-container")

    expect(container).toHaveAttribute(
      "data-position",
      "top-right",
    )
    expect(container).toHaveClass("top-4", "right-4")
  })

  it("auto-dismisses after four seconds", () => {
    render(
      <ToastProvider duration={4000}>
        <ToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole("button", {
      name: "Show Toast",
    }))

    expect(screen.getByText("Test Title")).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(3999)
    })

    expect(screen.getByText("Test Title")).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(1)
    })

    expect(
      screen.queryByText("Test Title"),
    ).not.toBeInTheDocument()
  })

  it("supports a custom auto-dismiss duration", () => {
    render(
      <ToastProvider duration={1500}>
        <ToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole("button", {
      name: "Show Toast",
    }))

    act(() => {
      jest.advanceTimersByTime(1500)
    })

    expect(
      screen.queryByText("Test Title"),
    ).not.toBeInTheDocument()
  })

  it("keeps a toast visible when duration is zero", () => {
    render(
      <ToastProvider duration={0}>
        <ToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole("button", {
      name: "Show Toast",
    }))

    act(() => {
      jest.advanceTimersByTime(10000)
    })

    expect(screen.getByText("Test Title")).toBeInTheDocument()
  })

  it("dismisses a toast using its close button", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole("button", {
      name: "Show Toast",
    }))

    fireEvent.click(
      screen.getByRole("button", {
        name: "Dismiss Test Title notification",
      }),
    )

    expect(
      screen.queryByText("Test Title"),
    ).not.toBeInTheDocument()
  })

  it("stacks multiple toasts vertically with the newest first", () => {
    function MultipleToastTrigger() {
      const { showToast: show } = useToast()

      return (
        <button
          type="button"
          onClick={() => {
            show("First message", "info", "First title")
            show("Second message", "warning", "Second title")
          }}
        >
          Show Multiple
        </button>
      )
    }

    render(
      <ToastProvider>
        <MultipleToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show Multiple",
      }),
    )

    const container = screen.getByTestId("toast-container")
    const toasts = within(container).getAllByTestId("toast")

    expect(container).toHaveClass("flex-col", "gap-3")
    expect(toasts).toHaveLength(2)
    expect(toasts[0]).toHaveAttribute(
      "data-toast-type",
      "warning",
    )
    expect(
      within(toasts[0]).getByText("Second title"),
    ).toBeInTheDocument()
    expect(
      within(toasts[1]).getByText("First title"),
    ).toBeInTheDocument()
  })

  it.each([
    [
      "success",
      "status",
      "border-terminal-green",
      "toast-icon-success",
    ],
    [
      "error",
      "alert",
      "border-terminal-danger",
      "toast-icon-error",
    ],
    [
      "info",
      "status",
      "border-terminal-cyan",
      "toast-icon-info",
    ],
    [
      "warning",
      "status",
      "border-terminal-warning",
      "toast-icon-warning",
    ],
  ] as const)(
    "renders the %s variant with its colour and accessibility role",
    (type, role, expectedClass, iconTestId) => {
      render(
        <ToastProvider>
          <ToastTrigger
            type={type}
            title={`${type} title`}
            message={`${type} message`}
          />
        </ToastProvider>,
      )

      fireEvent.click(screen.getByRole("button", {
        name: "Show Toast",
      }))

      const toast = screen.getByTestId("toast")

      expect(toast).toHaveAttribute("data-toast-type", type)
      expect(toast).toHaveClass(expectedClass)
      expect(screen.getByRole(role)).toBeInTheDocument()
      expect(screen.getByTestId(iconTestId)).toBeInTheDocument()
    },
  )

  it("works with the global showToast helper", () => {
    render(
      <ToastProvider>
        <div>Application content</div>
      </ToastProvider>,
    )

    act(() => {
      showToast(
        "Global message",
        "warning",
        "Global title",
      )
    })

    expect(screen.getByText("Global title")).toBeInTheDocument()
    expect(screen.getByText("Global message")).toBeInTheDocument()
  })

  it("allows all toasts to be dismissed together", () => {
    function DismissAllTrigger() {
      const {
        showToast: show,
        dismissAllToasts,
      } = useToast()

      return (
        <>
          <button
            type="button"
            onClick={() => {
              show("Message one", "info", "Toast one")
              show("Message two", "success", "Toast two")
            }}
          >
            Add Toasts
          </button>

          <button type="button" onClick={dismissAllToasts}>
            Dismiss All
          </button>
        </>
      )
    }

    render(
      <ToastProvider>
        <DismissAllTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole("button", {
      name: "Add Toasts",
    }))

    expect(screen.getAllByTestId("toast")).toHaveLength(2)

    fireEvent.click(screen.getByRole("button", {
      name: "Dismiss All",
    }))

    expect(screen.queryAllByTestId("toast")).toHaveLength(0)
  })

  it("throws when useToast is used outside ToastProvider", () => {
    function InvalidConsumer() {
      useToast()
      return null
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      "useToast must be used within a ToastProvider",
    )
  })
})
