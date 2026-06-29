"use client";

import React, { useEffect, useRef } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function OnboardingTour() {
  const {
    isActive,
    currentStepIndex,
    steps,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const router = useRouter();
  const currentStep = steps[currentStepIndex];
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentStep?.url) {
      router.push(currentStep.url);
    }
  }, [currentStep?.url, router]);

  useEffect(() => {
    if (isActive && currentStep?.target) {
      const targetEl = document.querySelector(currentStep.target);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isActive, currentStep]);

  if (!isActive) return null;

  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/80"
        onClick={skipOnboarding}
      />

      {/* Highlight Target */}
      {currentStep.target && (
        <div className="absolute inset-0 pointer-events-none">
          {(() => {
            const target = document.querySelector(currentStep.target!);
            if (!target) return null;
            const rect = target.getBoundingClientRect();
            return (
              <div
                className="absolute border-4 border-terminal-cyan rounded-lg pointer-events-auto shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                style={{
                  top: rect.top - 4,
                  left: rect.left - 4,
                  width: rect.width + 8,
                  height: rect.height + 8,
                }}
              />
            );
          })()}
        </div>
      )}

      {/* Tour Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-xl">
        <div className="border border-terminal-green/40 bg-terminal-black/95 p-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
          <div className="absolute inset-0 border border-terminal-green/20" aria-hidden="true" />
          
          <div className="relative flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-terminal-green font-terminal-mono">
                {currentStep.title}
              </h2>
              <p className="text-sm text-terminal-green/70 mt-1">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
            <button
              onClick={skipOnboarding}
              className="text-terminal-green/60 hover:text-terminal-green transition-colors"
              aria-label="Skip tour"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="relative text-terminal-green/90 mb-6">
            {currentStep.description}
          </p>

          {/* Progress Dots */}
          <div className="relative flex justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  idx < currentStepIndex
                    ? "bg-terminal-green"
                    : idx === currentStepIndex
                    ? "bg-terminal-cyan w-6"
                    : "bg-terminal-green/30"
                )}
              />
            ))}
          </div>

          <div className="relative flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isFirstStep}
              className="border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={skipOnboarding}
                className="border-terminal-green/40 text-terminal-green/70 hover:bg-terminal-green/10"
              >
                Skip
              </Button>
              <Button
                onClick={isLastStep ? completeOnboarding : nextStep}
                className="bg-terminal-green text-terminal-black hover:bg-terminal-green/90"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
