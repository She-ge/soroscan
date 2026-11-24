import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

const mockLogin = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn()
const mockSetTokens = jest.fn()
const mockHardNavigate = jest.fn()
const mockFetch = jest.fn()

jest.mock("@/lib/navigation", () => ({
  hardNavigate: (url: string) => mockHardNavigate(url),
}))

jest.mock("@apollo/client", () => ({
  gql: (strings: TemplateStringsArray) => strings.join(""),
  useMutation: () => [mockLogin],
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams("callbackUrl=/admin"),
}))

jest.mock("@/lib/auth", () => ({
  setTokens: (...args: unknown[]) => mockSetTokens(...args),
}))

import LoginPage from "@/app/login/page"

const env = process.env as Record<string, string | undefined>
const originalNodeEnv = env.NODE_ENV

function getFields() {
  return {
    email: screen.getByTestId("login-email"),
    password: screen.getByTestId("login-password"),
    submit: screen.getByTestId("login-submit"),
  }
}

describe("Admin Login page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv
  })

  it("renders the email and password inputs and the submit button", () => {
    render(<LoginPage />)
    const { email, password, submit } = getFields()

    expect(email).toHaveAttribute("type", "email")
    expect(password).toHaveAttribute("type", "password")
    expect(screen.getByLabelText("USER_EMAIL")).toBe(email)
    expect(screen.getByLabelText("ACCESS_PASSWORD")).toBe(password)
    expect(submit).toHaveTextContent("> SIGN_IN")
  })

  it("shows required errors and skips the mutation when submitted empty", async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(getFields().submit)

    expect(await screen.findByText("EMAIL_REQUIRED")).toBeInTheDocument()
    expect(screen.getByText("PASSWORD_REQUIRED")).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it("rejects a malformed email and a short password", async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    const { email, password, submit } = getFields()

    await user.type(email, "not-an-email")
    await user.type(password, "short")
    await user.click(submit)

    expect(await screen.findByText("INVALID_EMAIL_FORMAT")).toBeInTheDocument()
    expect(screen.getByText("PASSWORD_MIN_8_CHARACTERS")).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it("posts the entered credentials to the token endpoint and redirects on success", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access: "access-token", refresh: "refresh-token" }),
    })
    const user = userEvent.setup()
    render(<LoginPage />)
    const { email, password, submit } = getFields()

    await user.type(email, "operator@soroscan.io")
    await user.type(password, "correct-horse")
    await user.click(submit)

    await waitFor(() => expect(mockHardNavigate).toHaveBeenCalledWith("/admin"))
    const [url, init] = mockFetch.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/token\/$/)
    expect(JSON.parse(init.body)).toEqual({
      username: "operator@soroscan.io",
      password: "correct-horse",
    })
    expect(mockSetTokens).toHaveBeenCalledWith({
      access: "access-token",
      refresh: "refresh-token",
    })
  })

  it("displays an error message for invalid credentials", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    const user = userEvent.setup()
    render(<LoginPage />)
    const { email, password, submit } = getFields()

    await user.type(email, "operator@soroscan.io")
    await user.type(password, "wrong-password")
    await user.click(submit)

    expect(
      await screen.findByText("ERROR: INVALID_CREDENTIALS")
    ).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockSetTokens).not.toHaveBeenCalled()
    expect(mockHardNavigate).not.toHaveBeenCalled()
  })

  it("displays AUTHENTICATION_FAILED when the token endpoint fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    const user = userEvent.setup()
    render(<LoginPage />)
    const { email, password, submit } = getFields()

    await user.type(email, "operator@soroscan.io")
    await user.type(password, "wrong-password")
    await user.click(submit)

    expect(
      await screen.findByText("ERROR: AUTHENTICATION_FAILED")
    ).toBeInTheDocument()
    expect(mockHardNavigate).not.toHaveBeenCalled()
  })
})
