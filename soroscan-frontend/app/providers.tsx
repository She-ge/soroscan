"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/context/ToastContext";
import { ApolloProvider } from "@/providers/ApolloProvider";
import { EventStreamProvider } from "@/context/EventStreamContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ApolloProvider>
      <EventStreamProvider>
        <ToastProvider>{children}</ToastProvider>
      </EventStreamProvider>
    </ApolloProvider>
  );
}

