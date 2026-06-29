import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { Alert } from "../components/ui/alert"

describe("Alert Component", () => {
  it("renders the title and description correctly", () => {
    render(<Alert title="System Update" description="Your profile has been updated." />)
    expect(screen.getByText("System Update")).toBeInTheDocument()
    expect(screen.getByText("Your profile has been updated.")).toBeInTheDocument()
  })

  it("renders all variants without crashing", () => {
    const variants = ["info", "success", "warning", "error"] as const
    variants.forEach((variant) => {
      render(<Alert variant={variant} title={`${variant} alert`} />)
      expect(screen.getByText(`${variant} alert`)).toBeInTheDocument()
    })
  })

  it("removes itself from the DOM when dismissed", () => {
    render(<Alert title="Dismiss me" dismissible />)
    
    const alertElement = screen.getByRole("alert")
    expect(alertElement).toBeInTheDocument()
    
    const closeButton = screen.getByLabelText("Dismiss alert")
    fireEvent.click(closeButton)
    
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("does not render dismiss button if dismissible prop is false and onDismiss is omitted", () => {
    render(<Alert title="Static Alert" />)
    expect(screen.queryByLabelText("Dismiss alert")).not.toBeInTheDocument()
  })

  it("renders copy button when copyable is true and has title/description", () => {
    render(<Alert title="Error" description="Something went wrong" />)
    expect(screen.getByTestId("copy-alert-button")).toBeInTheDocument()
  })

  it("does not render copy button when copyable is false", () => {
    render(<Alert title="Error" description="Something went wrong" copyable={false} />)
    expect(screen.queryByTestId("copy-alert-button")).not.toBeInTheDocument()
  })

  it("does not render copy button when there's no title or description", () => {
    render(<Alert />)
    expect(screen.queryByTestId("copy-alert-button")).not.toBeInTheDocument()
  })

  it("copies alert text to clipboard when copy button is clicked", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })

    render(<Alert title="Error" description="Something went wrong" />)
    const copyButton = screen.getByTestId("copy-alert-button")
    
    await act(async () => {
      fireEvent.click(copyButton)
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Error\nSomething went wrong")
  })

  it("shows copied state after clicking copy button", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })
    jest.useFakeTimers()

    render(<Alert title="Error" description="Something went wrong" />)
    const copyButton = screen.getByTestId("copy-alert-button")
    
    expect(screen.getByLabelText("Copy alert text")).toBeInTheDocument()
    
    await act(async () => {
      fireEvent.click(copyButton)
    })

    expect(screen.getByLabelText("Copied!")).toBeInTheDocument()
    
    act(() => {
      jest.advanceTimersByTime(2000)
    })
    
    expect(screen.getByLabelText("Copy alert text")).toBeInTheDocument()
    jest.useRealTimers()
  })
})