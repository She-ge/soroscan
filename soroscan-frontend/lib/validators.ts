/**
 * Built-in validators for ValidatedInput.
 * Supports: required, email, url, minLength, maxLength.
 */

export type MinMaxRule = number | { value: number; message?: string }

export type ValidatorConfig = {
  required?: boolean | string
  email?: boolean | string
  url?: boolean | string
  minLength?: MinMaxRule
  maxLength?: MinMaxRule
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ruleValue(rule: MinMaxRule): number {
  return typeof rule === "number" ? rule : rule.value
}

function ruleMessage(rule: MinMaxRule, fallback: string): string {
  return typeof rule === "number" ? fallback : rule.message ?? fallback
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Run built-in validators against a string value.
 * Returns the first error message, or null when valid.
 */
export function runValidators(
  value: string,
  validators?: ValidatorConfig
): string | null {
  if (!validators) return null

  const trimmed = value.trim()

  if (validators.required) {
    const empty = value.length === 0 || trimmed.length === 0
    if (empty) {
      return typeof validators.required === "string"
        ? validators.required
        : "This field is required"
    }
  }

  // Skip remaining checks when empty and not required
  if (trimmed.length === 0) return null

  if (validators.email) {
    if (!isValidEmail(value)) {
      return typeof validators.email === "string"
        ? validators.email
        : "Enter a valid email address"
    }
  }

  if (validators.url) {
    if (!isValidUrl(value)) {
      return typeof validators.url === "string"
        ? validators.url
        : "Enter a valid URL"
    }
  }

  if (validators.minLength !== undefined) {
    const min = ruleValue(validators.minLength)
    if (value.length < min) {
      return ruleMessage(
        validators.minLength,
        `Must be at least ${min} characters`
      )
    }
  }

  if (validators.maxLength !== undefined) {
    const max = ruleValue(validators.maxLength)
    if (value.length > max) {
      return ruleMessage(
        validators.maxLength,
        `Must be at most ${max} characters`
      )
    }
  }

  return null
}
