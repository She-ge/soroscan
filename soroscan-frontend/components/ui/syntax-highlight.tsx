import * as React from "react";

export type CodeBlockLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "bash"
  | "json"
  | "graphql"
  | "rust"
  | "yaml"
  | "text";

type TokenClass =
  | "tok-keyword"
  | "tok-string"
  | "tok-comment"
  | "tok-number"
  | "tok-boolean"
  | "tok-null"
  | "tok-function"
  | "tok-property"
  | "tok-punctuation"
  | "tok-operator"
  | "tok-type"
  | "tok-variable"
  | "tok-meta";

interface Token {
  text: string;
  className: TokenClass;
}

const KEYWORDS: Record<CodeBlockLanguage, Set<string>> = {
  typescript: new Set([
    "import",
    "export",
    "from",
    "const",
    "let",
    "var",
    "async",
    "await",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "switch",
    "case",
    "break",
    "continue",
    "new",
    "type",
    "interface",
    "class",
    "extends",
    "implements",
    "public",
    "private",
    "protected",
    "readonly",
    "true",
    "false",
    "null",
    "undefined",
    "as",
    "in",
    "of",
  ]),
  javascript: new Set([
    "import",
    "export",
    "from",
    "const",
    "let",
    "var",
    "async",
    "await",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "switch",
    "case",
    "break",
    "continue",
    "new",
    "class",
    "extends",
    "true",
    "false",
    "null",
    "undefined",
    "as",
    "in",
    "of",
  ]),
  python: new Set([
    "def",
    "class",
    "import",
    "from",
    "as",
    "return",
    "if",
    "elif",
    "else",
    "for",
    "while",
    "with",
    "try",
    "except",
    "finally",
    "raise",
    "pass",
    "True",
    "False",
    "None",
    "and",
    "or",
    "not",
    "in",
    "is",
    "lambda",
    "yield",
    "async",
    "await",
  ]),
  bash: new Set([
    "if",
    "then",
    "else",
    "fi",
    "for",
    "do",
    "done",
    "while",
    "case",
    "esac",
    "function",
    "export",
    "local",
    "return",
    "echo",
    "cd",
    "exit",
  ]),
  json: new Set([]),
  graphql: new Set([
    "query",
    "mutation",
    "subscription",
    "fragment",
    "on",
    "type",
    "interface",
    "union",
    "enum",
    "input",
    "schema",
    "extend",
    "implements",
    "true",
    "false",
    "null",
  ]),
  rust: new Set([
    "fn",
    "let",
    "mut",
    "const",
    "if",
    "else",
    "match",
    "for",
    "while",
    "loop",
    "return",
    "struct",
    "enum",
    "impl",
    "trait",
    "pub",
    "use",
    "mod",
    "self",
    "Self",
    "true",
    "false",
    "async",
    "await",
    "where",
    "move",
    "ref",
    "in",
  ]),
  yaml: new Set(["true", "false", "null", "yes", "no"]),
  text: new Set([]),
};

const TYPES_TS = new Set([
  "string",
  "number",
  "boolean",
  "void",
  "never",
  "unknown",
  "any",
  "object",
  "Promise",
  "Record",
  "Array",
]);

function isCommentLine(line: string, language: CodeBlockLanguage): boolean {
  const trimmed = line.trimStart();
  if (language === "python" || language === "bash" || language === "yaml") {
    return trimmed.startsWith("#");
  }
  if (
    language === "typescript" ||
    language === "javascript" ||
    language === "rust"
  ) {
    return trimmed.startsWith("//");
  }
  return false;
}

function pushToken(tokens: Token[], text: string, className: TokenClass) {
  if (!text) return;
  const last = tokens[tokens.length - 1];
  if (last && last.className === className) {
    last.text += text;
    return;
  }
  tokens.push({ text, className });
}

function tokenizeGeneric(line: string, language: CodeBlockLanguage): Token[] {
  const tokens: Token[] = [];
  const keywords = KEYWORDS[language];
  const pattern =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b[A-Za-z_][\w$]*\b)|([{}[\](),.:;=<>!&|+\-*/%@#]+|\s+|[^\s])/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line)) !== null) {
    const [raw, stringLit, numberLit, word] = match;

    if (stringLit) {
      pushToken(tokens, stringLit, "tok-string");
      continue;
    }
    if (numberLit) {
      pushToken(tokens, numberLit, "tok-number");
      continue;
    }
    if (word) {
      if (word === "true" || word === "false") {
        pushToken(tokens, word, "tok-boolean");
      } else if (word === "null" || word === "None" || word === "undefined") {
        pushToken(tokens, word, "tok-null");
      } else if (keywords.has(word)) {
        pushToken(tokens, word, "tok-keyword");
      } else if (
        (language === "typescript" || language === "javascript") &&
        TYPES_TS.has(word)
      ) {
        pushToken(tokens, word, "tok-type");
      } else if (/^[A-Z]/.test(word)) {
        pushToken(tokens, word, "tok-type");
      } else {
        pushToken(tokens, word, "tok-variable");
      }
      continue;
    }

    if (/^[{}[\](),.:;]$/.test(raw)) {
      pushToken(tokens, raw, "tok-punctuation");
    } else if (/^[=<>!&|+\-*/%@#]+$/.test(raw)) {
      pushToken(tokens, raw, "tok-operator");
    } else {
      pushToken(tokens, raw, "tok-variable");
    }
  }

  return tokens;
}

function tokenizeJsonLine(line: string): Token[] {
  const tokens: Token[] = [];
  const pattern =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|([{}[\],:]|\s+|[^\s])/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line)) !== null) {
    const [, stringLit, colon, boolOrNull, other] = match;
    if (stringLit && colon) {
      pushToken(tokens, stringLit, "tok-property");
      pushToken(tokens, colon.trim(), "tok-punctuation");
    } else if (stringLit) {
      pushToken(tokens, stringLit, "tok-string");
    } else if (boolOrNull === "true" || boolOrNull === "false") {
      pushToken(tokens, boolOrNull, "tok-boolean");
    } else if (boolOrNull === "null") {
      pushToken(tokens, boolOrNull, "tok-null");
    } else if (other && /^\d/.test(other)) {
      pushToken(tokens, other, "tok-number");
    } else if (other) {
      if (/^[{}[\],:]$/.test(other)) {
        pushToken(tokens, other, "tok-punctuation");
      } else {
        pushToken(tokens, other, "tok-variable");
      }
    }
  }

  return tokens;
}

function tokenizeGraphqlLine(line: string): Token[] {
  const tokens: Token[] = [];
  const trimmed = line.trim();
  if (trimmed.startsWith("#")) {
    return [{ text: line, className: "tok-comment" }];
  }

  const pattern =
    /(#.*)|("(?:\\.|[^"\\])*")|(\$[A-Za-z_]\w*)|(\b[A-Za-z_]\w*\b)|([{}():!|=]|\s+|[^\s])/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line)) !== null) {
    const [, comment, stringLit, variable, word, other] = match;
    if (comment) {
      pushToken(tokens, comment, "tok-comment");
    } else if (stringLit) {
      pushToken(tokens, stringLit, "tok-string");
    } else if (variable) {
      pushToken(tokens, variable, "tok-meta");
    } else if (word) {
      if (KEYWORDS.graphql.has(word)) {
        pushToken(tokens, word, "tok-keyword");
      } else {
        pushToken(tokens, word, "tok-function");
      }
    } else if (other) {
      pushToken(
        tokens,
        other,
        /^[{}():!|=]$/.test(other) ? "tok-punctuation" : "tok-variable",
      );
    }
  }

  return tokens;
}

function tokenizeYamlLine(line: string): Token[] {
  const tokens: Token[] = [];
  if (line.trimStart().startsWith("#")) {
    return [{ text: line, className: "tok-comment" }];
  }

  const keyMatch = line.match(/^(\s*)([A-Za-z0-9_-]+)(\s*:\s*)(.*)$/);
  if (keyMatch) {
    const [, indent, key, sep, rest] = keyMatch;
    pushToken(tokens, indent, "tok-variable");
    pushToken(tokens, key, "tok-property");
    pushToken(tokens, sep, "tok-punctuation");
    tokens.push(...tokenizeGeneric(rest, "yaml"));
    return tokens;
  }

  return tokenizeGeneric(line, "yaml");
}

export function tokenizeLine(
  line: string,
  language: CodeBlockLanguage,
): Token[] {
  if (!line) {
    return [{ text: "", className: "tok-variable" }];
  }

  if (isCommentLine(line, language)) {
    return [{ text: line, className: "tok-comment" }];
  }

  switch (language) {
    case "json":
      return tokenizeJsonLine(line);
    case "graphql":
      return tokenizeGraphqlLine(line);
    case "yaml":
      return tokenizeYamlLine(line);
    case "text":
      return [{ text: line, className: "tok-variable" }];
    default:
      return tokenizeGeneric(line, language);
  }
}

export function renderHighlightedLine(
  line: string,
  language: CodeBlockLanguage,
): React.ReactNode {
  const tokens = tokenizeLine(line, language);
  return (
    <>
      {tokens.map((token, index) => (
        <span key={index} className={token.className}>
          {token.text}
        </span>
      ))}
    </>
  );
}

export const LANGUAGE_LABELS: Record<CodeBlockLanguage, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  bash: "Bash",
  json: "JSON",
  graphql: "GraphQL",
  rust: "Rust",
  yaml: "YAML",
  text: "Plain Text",
};
