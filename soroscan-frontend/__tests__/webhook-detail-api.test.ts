import { adaptDeliveryLog, adaptWebhook } from "@/app/webhooks/[id]/page";

describe("webhook detail adapters (API -> UI)", () => {
  it("adapts a REST webhook payload to the UI Webhook type", () => {
    const adapted = adaptWebhook(
      {
        id: 7,
        target_url: "https://example.com/hook",
        event_type: "swap",
        contract_id: "CABC123",
        is_active: true,
        status: "active",
        created_at: "2026-02-10T09:12:00Z",
        last_triggered: "2026-02-23T22:34:01Z",
        timeout_seconds: 30,
        failure_count: 0,
      },
      "7",
    );

    expect(adapted.id).toBe("7");
    expect(adapted.url).toBe("https://example.com/hook");
    expect(adapted.status).toBe("ACTIVE");
    expect(adapted.contractFilter).toBe("CABC123");
    expect(adapted.timeoutSeconds).toBe(30);
  });

  it("maps blank event_type to ALL and suspended status", () => {
    const adapted = adaptWebhook(
      { id: "wh_1", target_url: "https://example.com/h", is_active: false, status: "suspended" },
      "wh_1",
    );
    expect(adapted.eventTypes).toEqual(["ALL"]);
    expect(adapted.status).toBe("SUSPENDED");
  });

  it("adapts a delivery-log payload to the UI DeliveryLog type", () => {
    const log = adaptDeliveryLog(
      {
        id: 99,
        status_code: 500,
        duration_ms: 812,
        attempt_number: 2,
        error: "timeout",
        timestamp: "2026-02-23T22:35:00Z",
      },
      "wh_1",
    );

    expect(log.webhookId).toBe("wh_1");
    expect(log.statusCode).toBe(500);
    expect(log.responseTimeMs).toBe(812);
    expect(log.attempt).toBe(2);
    expect(log.errorMessage).toBe("timeout");
  });
});
