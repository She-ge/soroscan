export interface SC36Payload {
  version: string;
  data: unknown;
}

export function verifySC36Payload(payload: SC36Payload): boolean {
  return typeof payload.version === "string" && payload.version.length > 0;
}
