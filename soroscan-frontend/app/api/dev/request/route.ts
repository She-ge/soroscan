import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DevRequestPayload = {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | null;
};

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  let payload: DevRequestPayload;

  try {
    payload = (await request.json()) as DevRequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const method = (payload.method || "GET").toUpperCase();
  const url = (payload.url || "").trim();

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: "A valid http/https URL is required." }, { status: 400 });
  }

  const requestHeaders = new Headers();
  Object.entries(payload.headers || {}).forEach(([key, value]) => {
    if (typeof key === "string" && typeof value === "string" && key.trim()) {
      requestHeaders.set(key, value);
    }
  });

  const canHaveBody = !["GET", "HEAD"].includes(method);
  const requestBody = canHaveBody ? payload.body ?? undefined : undefined;

  try {
    const upstream = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      cache: "no-store",
    });

    const responseText = await upstream.text();
    const responseHeaders = Object.fromEntries(upstream.headers.entries());

    return NextResponse.json(
      {
        ok: upstream.ok,
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
        body: responseText,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: 0,
        statusText: "NETWORK_ERROR",
        headers: {},
        body: error instanceof Error ? error.message : "Request failed.",
      },
      { status: 200 },
    );
  }
}
