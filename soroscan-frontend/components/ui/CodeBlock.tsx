"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./CodeBlock.module.css";
import {
  LANGUAGE_LABELS,
  renderHighlightedLine,
  type CodeBlockLanguage,
} from "./syntax-highlight";

export type { CodeBlockLanguage };

export interface CodeBlockProps {
  /** Raw source code to display. */
  code: string;
  /** Highlight.js / Prism-compatible language id. */
  language?: CodeBlockLanguage;
  /** Optional filename shown in the title bar. */
  filename?: string;
  /** Show macOS-style window chrome and language label. Default: true. */
  showHeader?: boolean;
  /** Prefix each line with a line number. Default: true. */
  showLineNumbers?: boolean;
  /** Floating copy control when header is hidden. Default: true when no header. */
  showCopyButton?: boolean;
  /** Max height for scrollable code area (CSS value). */
  maxHeight?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  showHeader = true,
  showLineNumbers = true,
  showCopyButton,
  maxHeight,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const lines = code.split("\n");
  const copyVisible = showCopyButton ?? !showHeader;
  const headerLabel = filename ?? LANGUAGE_LABELS[language] ?? language;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const copyControl = (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn(
        styles.copyButton,
        !showHeader && styles.copyButtonInline,
      )}
      aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
    >
      {copied ? (
        <>
          <Check size={14} aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy size={14} aria-hidden="true" />
          <span>Copy</span>
        </>
      )}
    </button>
  );

  return (
    <div
      className={cn(styles.block, className)}
      data-testid="code-block"
      data-language={language}
    >
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.dots} aria-hidden="true">
            <span className={cn(styles.dot, styles.dotRed)} />
            <span className={cn(styles.dot, styles.dotYellow)} />
            <span className={cn(styles.dot, styles.dotGreen)} />
          </div>
          <span className={styles.headerLabel}>{headerLabel}</span>
          {copyControl}
        </div>
      )}

      <div className={styles.bodyWrap}>
        {!showHeader && copyVisible && copyControl}

        <pre
          className={cn(
            styles.body,
            !showHeader && copyVisible && styles.bodyWithFloatingCopy,
          )}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <code>
            {lines.map((line, index) => (
              <div key={index} className={styles.line} data-testid="code-line">
                {showLineNumbers && (
                  <span
                    className={styles.lineNumber}
                    aria-hidden="true"
                    data-testid="line-number"
                  >
                    {index + 1}
                  </span>
                )}
                <span className={styles.lineContent}>
                  {renderHighlightedLine(line, language)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
