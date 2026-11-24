import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { OrgLogoUpload } from "@/components/ui/OrgLogoUpload"

const mockOnSave = jest.fn()

class MockImage {
  naturalWidth = 200
  naturalHeight = 200
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private _src = ""
  get src() { return this._src }
  set src(v: string) { this._src = v; setTimeout(() => this.onload?.(), 0) }
}

const mockDrawImage = jest.fn()
const mockToDataURL = jest.fn(() => "data:image/png;base64,CROPPED")

beforeAll(() => {
  // @ts-expect-error mock
  global.Image = MockImage
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage: mockDrawImage })) as unknown as typeof HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.toDataURL = mockToDataURL
})

beforeEach(() => { mockOnSave.mockClear(); mockDrawImage.mockClear(); mockToDataURL.mockClear() })

function makeFile(name = "logo.png", type = "image/png", size = 100) {
  return new File([new Uint8Array(size)], name, { type })
}

function mockFileReader(result: string) {
  const fr = { readAsDataURL: jest.fn(), onload: null as unknown, result }
  jest.spyOn(global, "FileReader").mockImplementation(() => fr as unknown as FileReader)
  return fr
}

describe("OrgLogoUpload", () => {
  it("renders the upload heading", () => {
    render(<OrgLogoUpload onSave={mockOnSave} />)
    expect(screen.getByText("[ORG_LOGO]")).toBeInTheDocument()
  })

  it("renders UPLOAD_LOGO button by default", () => {
    render(<OrgLogoUpload onSave={mockOnSave} />)
    expect(screen.getByRole("button", { name: "UPLOAD_LOGO" })).toBeInTheDocument()
  })

  it("renders CHANGE_LOGO when currentLogoUrl is provided", () => {
    render(<OrgLogoUpload onSave={mockOnSave} currentLogoUrl="https://example.com/logo.png" />)
    expect(screen.getByRole("button", { name: "CHANGE_LOGO" })).toBeInTheDocument()
  })

  it("shows current logo preview when currentLogoUrl is provided", () => {
    render(<OrgLogoUpload onSave={mockOnSave} currentLogoUrl="https://example.com/logo.png" />)
    const img = screen.getByTestId("logo-preview") as HTMLImageElement
    expect(img.src).toContain("example.com/logo.png")
  })

  it("shows error for unsupported file type", async () => {
    render(<OrgLogoUpload onSave={mockOnSave} />)
    fireEvent.change(screen.getByTestId("logo-file-input"), {
      target: { files: [makeFile("doc.pdf", "application/pdf")] },
    })
    await waitFor(() => expect(screen.getByTestId("logo-error").textContent).toMatch(/Unsupported file type/))
  })

  it("shows error when file exceeds max size", async () => {
    render(<OrgLogoUpload onSave={mockOnSave} maxSizeBytes={50} />)
    fireEvent.change(screen.getByTestId("logo-file-input"), {
      target: { files: [makeFile("big.png", "image/png", 200)] },
    })
    await waitFor(() => expect(screen.getByTestId("logo-error").textContent).toMatch(/too large/))
  })

  it("shows crop tool after valid file is selected", async () => {
    const fr = mockFileReader("data:image/png;base64,FAKE")
    render(<OrgLogoUpload onSave={mockOnSave} />)
    fireEvent.change(screen.getByTestId("logo-file-input"), { target: { files: [makeFile()] } })
    ;(fr.onload as unknown as (e: unknown) => void)?.({ target: { result: fr.result } })
    await waitFor(() => expect(screen.getByTestId("crop-tool")).toBeInTheDocument())
    jest.restoreAllMocks()
  })

  it("removes logo when REMOVE is clicked", () => {
    render(<OrgLogoUpload onSave={mockOnSave} currentLogoUrl="https://example.com/logo.png" />)
    fireEvent.click(screen.getByLabelText("Remove logo"))
    expect(screen.queryByTestId("logo-preview")).not.toBeInTheDocument()
  })

  it("shows file type hint text", () => {
    render(<OrgLogoUpload onSave={mockOnSave} />)
    expect(screen.getByText(/PNG, JPEG, GIF, WEBP/)).toBeInTheDocument()
  })

  it("crop tool has decrease and increase size buttons", async () => {
    const fr = mockFileReader("data:image/png;base64,FAKE")
    render(<OrgLogoUpload onSave={mockOnSave} />)
    fireEvent.change(screen.getByTestId("logo-file-input"), { target: { files: [makeFile()] } })
    ;(fr.onload as unknown as (e: unknown) => void)?.({ target: { result: fr.result } })
    await waitFor(() => screen.getByTestId("crop-tool"))
    expect(screen.getByLabelText("Decrease crop size")).toBeInTheDocument()
    expect(screen.getByLabelText("Increase crop size")).toBeInTheDocument()
    jest.restoreAllMocks()
  })

  it("crop tool CANCEL returns to upload view", async () => {
    const fr = mockFileReader("data:image/png;base64,FAKE")
    render(<OrgLogoUpload onSave={mockOnSave} />)
    fireEvent.change(screen.getByTestId("logo-file-input"), { target: { files: [makeFile()] } })
    ;(fr.onload as unknown as (e: unknown) => void)?.({ target: { result: fr.result } })
    await waitFor(() => screen.getByTestId("crop-tool"))
    fireEvent.click(screen.getByRole("button", { name: "CANCEL" }))
    expect(screen.queryByTestId("crop-tool")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "UPLOAD_LOGO" })).toBeInTheDocument()
    jest.restoreAllMocks()
  })

  it("crop tool CONFIRM_CROP calls onSave with data URL", async () => {
    const fr = mockFileReader("data:image/png;base64,FAKE")
    render(<OrgLogoUpload onSave={mockOnSave} />)
    fireEvent.change(screen.getByTestId("logo-file-input"), { target: { files: [makeFile()] } })
    ;(fr.onload as unknown as (e: unknown) => void)?.({ target: { result: fr.result } })
    await waitFor(() => screen.getByTestId("crop-tool"))
    fireEvent.click(screen.getByRole("button", { name: "CONFIRM_CROP" }))
    await waitFor(() => expect(mockOnSave).toHaveBeenCalledWith("data:image/png;base64,CROPPED"))
    jest.restoreAllMocks()
  })
})
