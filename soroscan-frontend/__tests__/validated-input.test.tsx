import React from "react"
import { act, render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ValidatedInput } from "@/components/terminal/ValidatedInput"
import { runValidators, isValidEmail, isValidUrl } from "@/lib/validators"
import "@testing-library/jest-dom"

describe("runValidators", () => {
  it("validates required fields", () => {
    expect(runValidators("", { required: true })).toBe("This field is required")
    expect(runValidators("  ", { required: true })).toBe("This field is required")
    expect(runValidators("ok", { required: true })).toBeNull()
  })

  it("validates email format", () => {
    expect(runValidators("bad", { email: true })).toMatch(/valid email/i)
    expect(runValidators("user@example.com", { email: true })).toBeNull()
    expect(isValidEmail("a@b.co")).toBe(true)
    expect(isValidEmail("nope")).toBe(false)
  })

  it("validates URL format", () => {
    expect(runValidators("not-a-url", { url: true })).toMatch(/valid url/i)
    expect(runValidators("https://example.com", { url: true })).toBeNull()
    expect(isValidUrl("http://localhost:3000/hook")).toBe(true)
    expect(isValidUrl("ftp://x")).toBe(false)
  })

  it("validates minLength and maxLength", () => {
    expect(runValidators("ab", { minLength: 3 })).toMatch(/at least 3/)
    expect(runValidators("abcd", { maxLength: 3 })).toMatch(/at most 3/)
    expect(
      runValidators("short", {
        minLength: { value: 8, message: "PASSWORD_MIN_8_CHARACTERS" },
      })
    ).toBe("PASSWORD_MIN_8_CHARACTERS")
  })

  it("supports custom required/email/url messages", () => {
    expect(runValidators("", { required: "NEED_VALUE" })).toBe("NEED_VALUE")
    expect(runValidators("x", { email: "BAD_EMAIL" })).toBe("BAD_EMAIL")
    expect(runValidators("x", { url: "Must be a valid https:// URL" })).toBe(
      "Must be a valid https:// URL"
    )
  })
})

describe("ValidatedInput", () => {
  it("renders label and hint", () => {
    render(
      <ValidatedInput
        id="email"
        label="USER_EMAIL"
        hint="Use your work email"
      />
    )
    expect(screen.getByLabelText("USER_EMAIL")).toBeInTheDocument()
    expect(screen.getByText("Use your work email")).toBeInTheDocument()
  })

  it("shows required validation error after blur", async () => {
    const user = userEvent.setup()
    render(
      <ValidatedInput id="req" label="Name" validators={{ required: true }} />
    )
    const input = screen.getByLabelText("Name")
    await user.click(input)
    await user.tab()
    expect(screen.getByRole("alert")).toHaveTextContent("This field is required")
    expect(input).toHaveAttribute("aria-invalid", "true")
  })

  it("shows email validation error", async () => {
    const user = userEvent.setup()
    render(
      <ValidatedInput
        id="email"
        label="Email"
        validators={{ required: true, email: true }}
      />
    )
    const input = screen.getByLabelText("Email")
    await user.type(input, "not-an-email")
    await user.tab()
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i)
  })

  it("shows success checkmark when valid", async () => {
    const user = userEvent.setup()
    render(
      <ValidatedInput
        id="email"
        label="Email"
        validators={{ required: true, email: true }}
      />
    )
    const input = screen.getByLabelText("Email")
    await user.type(input, "ops@soroscan.io")
    await user.tab()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.getByTestId("validated-input-success")).toBeInTheDocument()
  })

  it("hides hint when an error is shown", async () => {
    const user = userEvent.setup()
    render(
      <ValidatedInput
        id="url"
        label="URL"
        hint="https preferred"
        validators={{ required: true, url: true }}
      />
    )
    const input = screen.getByLabelText("URL")
    await user.type(input, "bad")
    await user.tab()
    expect(screen.queryByText("https preferred")).not.toBeInTheDocument()
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("exposes imperative validate() via ref", () => {
    const handle = React.createRef<React.ElementRef<typeof ValidatedInput>>()
    render(
      <ValidatedInput
        ref={handle}
        id="req"
        label="Required"
        validators={{ required: true }}
      />
    )
    act(() => {
      expect(handle.current?.validate()).toBe(false)
    })
    expect(screen.getByRole("alert")).toHaveTextContent("This field is required")
  })

  it("respects external error override", () => {
    render(
      <ValidatedInput
        id="ext"
        label="Field"
        error="SERVER_REJECTED"
        defaultValue="ok"
      />
    )
    // External error shows even before touch when provided as non-empty
    fireEvent.blur(screen.getByLabelText("Field"))
    expect(screen.getByRole("alert")).toHaveTextContent("SERVER_REJECTED")
  })

  it("validates minLength for passwords", async () => {
    const user = userEvent.setup()
    render(
      <ValidatedInput
        id="pw"
        label="Password"
        type="password"
        validators={{
          required: true,
          minLength: { value: 8, message: "PASSWORD_MIN_8_CHARACTERS" },
        }}
      />
    )
    const input = screen.getByLabelText("Password")
    await user.type(input, "short")
    await user.tab()
    expect(screen.getByRole("alert")).toHaveTextContent(
      "PASSWORD_MIN_8_CHARACTERS"
    )
  })
})
