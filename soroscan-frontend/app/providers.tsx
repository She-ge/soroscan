"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/context/ToastContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ApolloProvider } from "@/providers/ApolloProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { KeyboardShortcutsOverlay } from "@/components/terminal/KeyboardShortcutsOverlay";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <ApolloProvider>
        <OnboardingProvider>
          <ToastProvider>
            <KeyboardShortcutsOverlay />
            {children}
            <OnboardingTour />
          </ToastProvider>
        </OnboardingProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
}