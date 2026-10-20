import React, {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { SoroScanClient } from "../client.js";
import type { Webhook, WebhookTrigger } from "../types.js";
import type { UseWebhookOptions, UseWebhookResult } from "./types.js";

export const SoroScanClientContext = createContext<SoroScanClient | null>(null);

export interface SoroScanHooksProviderProps {
  client: SoroScanClient;
  children: ReactNode;
}

/** Provide a REST {@link SoroScanClient} to {@link useWebhook}. */
export function SoroScanHooksProvider({
  client,
  children,
}: SoroScanHooksProviderProps): React.JSX.Element {
  return createElement(SoroScanClientContext.Provider, { value: client }, children);
}

/** List and manage webhook subscriptions using the REST SDK client. */
export function useWebhook(
  options: UseWebhookOptions & { client?: SoroScanClient } = {}
): UseWebhookResult {
  const contextClient = useContext(SoroScanClientContext);
  const client = options.client ?? contextClient;
  const { contractId, skip = false } = options;

  const [data, setData] = useState<Webhook[] | undefined>();
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | undefined>();
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<Error | undefined>();

  const load = useCallback(async () => {
    if (skip || !client) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const response = await client.listWebhooks();
      const items = response.items ?? [];
      setData(
        contractId
          ? items.filter((hook) => hook.contractId === contractId)
          : items
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client, contractId, skip]);

  useEffect(() => {
    void load();
  }, [load]);

  const subscribe = useCallback(
    async (params: {
      targetUrl: string;
      eventType?: string;
      secret?: string;
    }) => {
      if (!client) {
        throw new Error("useWebhook: SoroScanClient is required");
      }
      setMutating(true);
      setMutationError(undefined);
      try {
        const triggers: WebhookTrigger[] = params.eventType
          ? [params.eventType as WebhookTrigger]
          : ["event.created"];
        const created = await client.subscribeWebhook({
          url: params.targetUrl,
          contractId: contractId ?? undefined,
          triggers,
          secret: params.secret,
        });
        await load();
        return created;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setMutationError(wrapped);
        throw wrapped;
      } finally {
        setMutating(false);
      }
    },
    [client, contractId, load]
  );

  const remove = useCallback(
    async (webhookId: string) => {
      if (!client) {
        throw new Error("useWebhook: SoroScanClient is required");
      }
      setMutating(true);
      setMutationError(undefined);
      try {
        await client.deleteWebhook(webhookId);
        await load();
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setMutationError(wrapped);
        throw wrapped;
      } finally {
        setMutating(false);
      }
    },
    [client, load]
  );

  return {
    data,
    loading,
    error,
    refetch: () => {
      void load();
    },
    subscribe,
    remove,
    mutating,
    mutationError,
  };
}
