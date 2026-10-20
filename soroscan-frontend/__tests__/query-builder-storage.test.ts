import { readStoredArray } from "@/lib/safe-storage";

describe("readStoredArray", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("returns [] when nothing is stored", () => {
    const isString = (v: unknown): v is string => typeof v === "string";
    expect(readStoredArray("missing-key", isString)).toEqual([]);
  });

  it("returns [] and does not throw on corrupt JSON", () => {
    localStorage.setItem("savedReports", "{not-valid-json");
    const isObject = (v: unknown): v is Record<string, unknown> =>
      typeof v === "object" && v !== null;
    expect(() => readStoredArray("savedReports", isObject)).not.toThrow();
    expect(readStoredArray("savedReports", isObject)).toEqual([]);
  });

  it("returns [] when stored value is not an array", () => {
    localStorage.setItem("savedReports", JSON.stringify({ id: "1" }));
    const isObject = (v: unknown): v is Record<string, unknown> =>
      typeof v === "object" && v !== null;
    expect(readStoredArray("savedReports", isObject)).toEqual([]);
  });

  it("filters out invalid entries and keeps valid ones", () => {
    localStorage.setItem(
      "savedReports",
      JSON.stringify([
        { id: "1", name: "ok", createdAt: "2026-01-01", columns: ["a"] },
        { id: 2, name: null },
        "garbage",
      ]),
    );
    const isValid = (v: unknown): v is { id: string } =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as Record<string, unknown>).id === "string";
    expect(readStoredArray("savedReports", isValid)).toEqual([
      { id: "1", name: "ok", createdAt: "2026-01-01", columns: ["a"] },
    ]);
  });
});
