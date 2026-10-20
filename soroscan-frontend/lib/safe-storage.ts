export function readStoredArray<T>(key: string, validate: (value: unknown) => value is T): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validate);
  } catch (error) {
    console.error(`Failed to parse stored value for "${key}":`, error);
    return [];
  }
}
