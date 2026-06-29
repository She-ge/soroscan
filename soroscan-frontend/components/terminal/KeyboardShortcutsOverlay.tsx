"use client";

import * as React from "react";
import { Modal } from "./Modal";

const SHORTCUTS = [
  { key: "?", action: "Open keyboard shortcuts" },
  { key: "Escape", action: "Close this overlay" },
];

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
};

export function KeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      const isQuestionShortcut = event.key === "?" || (event.key === "/" && event.shiftKey);
      if (!isQuestionShortcut || isOpen) return;
      if (isInteractiveTarget(event.target)) return;

      event.preventDefault();
      setIsOpen(true);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="KEYBOARD SHORTCUTS">
      <div className="space-y-4 text-terminal-green">
        <p className="text-sm text-terminal-green/70">
          Press <span className="font-semibold">?</span> to open this help overlay.
        </p>

        <dl className="grid gap-3">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.key} className="grid grid-cols-[auto_1fr] gap-3 items-center rounded border border-terminal-green/20 bg-terminal-green/5 p-3">
              <dt className="rounded border border-terminal-green/40 bg-terminal-black px-3 py-2 text-sm font-semibold text-terminal-green">
                {shortcut.key}
              </dt>
              <dd className="text-sm text-terminal-green/80">{shortcut.action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}
