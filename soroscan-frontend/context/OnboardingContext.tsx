"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  url?: string;
}

interface OnboardingContextValue {
  isActive: boolean;
  currentStepIndex: number;
  steps: OnboardingStep[];
  startOnboarding: (steps?: OnboardingStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  isCompleted: boolean;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

const defaultSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to SoroScan!",
    description:
      "Let's walk through the basics of SoroScan. We'll cover creating an organization, registering a contract, viewing events, and setting up webhooks.",
  },
  {
    id: "create-org",
    title: "Create an Organization",
    description:
      "Your first step is to create an organization. This will be your workspace for managing contracts and events.",
    url: "/contracts",
  },
  {
    id: "register-contract",
    title: "Register a Contract",
    description:
      "Now let's register your first contract. This allows SoroScan to start indexing events from it.",
    target: "[data-tour='register-contract']",
  },
  {
    id: "view-events",
    title: "View Events",
    description:
      "Once your contract is registered, you can view all events emitted by it in the dashboard.",
    url: "/dashboard",
  },
  {
    id: "set-up-webhook",
    title: "Set Up a Webhook",
    description:
      "Want to get real-time event updates? Let's set up a webhook to receive events as they happen.",
    url: "/webhooks",
    target: "[data-tour='create-webhook']",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description:
      "Great job! You've completed the SoroScan onboarding. Feel free to explore and let us know if you need any help!",
  },
];

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps);
  const [isCompleted, setIsCompleted] = useState(false);

  const startOnboarding = useCallback((customSteps?: OnboardingStep[]) => {
    if (customSteps) {
      setSteps(customSteps);
    }
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        setIsActive(false);
        setIsCompleted(true);
        return prev;
      }
      return next;
    });
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const skipOnboarding = useCallback(() => {
    setIsActive(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      isActive,
      currentStepIndex,
      steps,
      startOnboarding,
      nextStep,
      prevStep,
      skipOnboarding,
      completeOnboarding,
      isCompleted,
    }),
    [
      isActive,
      currentStepIndex,
      steps,
      startOnboarding,
      nextStep,
      prevStep,
      skipOnboarding,
      completeOnboarding,
      isCompleted,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
