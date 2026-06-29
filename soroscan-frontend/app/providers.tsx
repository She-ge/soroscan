"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/context/ToastContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ApolloProvider } from "@/providers/ApolloProvider";
import { KeyboardShortcutsOverlay } from "@/components/terminal/KeyboardShortcutsOverlay";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ApolloProvider>
      <ToastProvider>
        <KeyboardShortcutsOverlay />
        {children}
      </ToastProvider>
      <OnboardingProvider>
        <ToastProvider>
          {children}
          <OnboardingTour />
        </ToastProvider>
      </OnboardingProvider>
    </ApolloProvider>
  );
}

