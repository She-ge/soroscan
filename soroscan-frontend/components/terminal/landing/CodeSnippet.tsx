"use client";

import { CodeBlock, type CodeBlockLanguage } from "@/components/ui/CodeBlock";

interface CodeSnippetProps {
  code: string;
  language?: CodeBlockLanguage;
  filename?: string;
  className?: string;
}

/**
 * Landing-page code window — thin wrapper around {@link CodeBlock}.
 * @deprecated Prefer importing CodeBlock directly for new code.
 */
export function CodeSnippet({
  code,
  language = "typescript",
  filename,
  className,
}: CodeSnippetProps) {
  return (
    <CodeBlock
      code={code}
      language={language}
      filename={filename}
      className={className}
      showHeader
      showLineNumbers
    />
  );
}
