import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { tokenizeLine } from "@/components/ui/syntax-highlight";

describe("CodeBlock", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders code with syntax highlighting tokens", () => {
    render(
      <CodeBlock
        code={'const message = "hello";'}
        language="typescript"
      />,
    );

    expect(screen.getByText("const")).toHaveClass("tok-keyword");
    expect(screen.getByText(/hello/)).toHaveClass("tok-string");
  });

  it("shows filename in header when provided", () => {
    render(
      <CodeBlock
        code="print('hi')"
        language="python"
        filename="example.py"
      />,
    );

    expect(screen.getByText("example.py")).toBeInTheDocument();
  });

  it("shows language label when filename is omitted", () => {
    render(<CodeBlock code="echo hi" language="bash" />);
    expect(screen.getByText("Bash")).toBeInTheDocument();
  });

  it("renders line numbers by default", () => {
    render(<CodeBlock code={"line1\nline2\nline3"} language="text" />);
    expect(screen.getAllByTestId("line-number")).toHaveLength(3);
  });

  it("hides line numbers when showLineNumbers is false", () => {
    render(
      <CodeBlock
        code={"line1\nline2"}
        language="text"
        showLineNumbers={false}
      />,
    );
    expect(screen.queryByTestId("line-number")).not.toBeInTheDocument();
  });

  it("copies code to clipboard", async () => {
    const source = "curl https://api.soroscan.io/health/";
    render(<CodeBlock code={source} language="bash" />);

    fireEvent.click(
      screen.getByRole("button", { name: /copy code to clipboard/i }),
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(source);
      expect(
        screen.getByRole("button", { name: /copied to clipboard/i }),
      ).toBeInTheDocument();
    });
  });

  it("resets copied state after 2 seconds", async () => {
    jest.useFakeTimers();
    render(<CodeBlock code="x = 1" language="python" />);

    fireEvent.click(
      screen.getByRole("button", { name: /copy code to clipboard/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /copied to clipboard/i }),
      ).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(
      screen.getByRole("button", { name: /copy code to clipboard/i }),
    ).toBeInTheDocument();
  });

  it("shows floating copy button when header is hidden", () => {
    render(
      <CodeBlock
        code='{"ok": true}'
        language="json"
        showHeader={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: /copy code to clipboard/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("JSON")).not.toBeInTheDocument();
  });

  it("respects maxHeight on the scroll container", () => {
    const { container } = render(
      <CodeBlock code="a\nb\nc" language="text" maxHeight="240px" />,
    );

    expect(container.querySelector("pre")).toHaveStyle({ maxHeight: "240px" });
  });

  it("applies terminal window test id and language data attribute", () => {
    render(<CodeBlock code="fn main() {}" language="rust" />);
    const block = screen.getByTestId("code-block");
    expect(block).toHaveAttribute("data-language", "rust");
  });
});

describe("syntax-highlight tokenizeLine", () => {
  it("tokenizes JSON keys and booleans", () => {
    const tokens = tokenizeLine('  "active": true,', "json");
    expect(tokens.some((t) => t.className === "tok-property")).toBe(true);
    expect(tokens.some((t) => t.text === "true" && t.className === "tok-boolean")).toBe(
      true,
    );
  });

  it("tokenizes GraphQL query keywords", () => {
    const tokens = tokenizeLine("query GetEvents {", "graphql");
    expect(tokens[0]).toMatchObject({ text: "query", className: "tok-keyword" });
  });

  it("tokenizes Python comments", () => {
    const tokens = tokenizeLine("# setup client", "python");
    expect(tokens[0].className).toBe("tok-comment");
  });
});
