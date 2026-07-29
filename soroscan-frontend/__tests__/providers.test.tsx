import React from "react"
import { render, screen } from "@testing-library/react"
import { Providers } from "@/app/providers"

// Providers composes several context providers; mock each as a thin
// passthrough so this test can focus purely on how many times {children}
// gets rendered, independent of what each provider actually does.
jest.mock("@/providers/ApolloProvider", () => ({
  ApolloProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock("@/context/ToastContext", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock("@/context/OnboardingContext", () => ({
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock("@/components/OnboardingTour", () => ({
  OnboardingTour: () => null,
}))
jest.mock("@/components/terminal/KeyboardShortcutsOverlay", () => ({
  KeyboardShortcutsOverlay: () => null,
}))

describe("Providers", () => {
  it("renders children exactly once", () => {
    render(
      <Providers>
        <div data-testid="marker">page content</div>
      </Providers>
    )
    expect(screen.getAllByTestId("marker")).toHaveLength(1)
  })
})
