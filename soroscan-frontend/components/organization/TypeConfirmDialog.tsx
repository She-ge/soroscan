"use client";

import * as React from "react";
import { Button } from "@/components/terminal/Button";
import { Input } from "@/components/terminal/Input";
import { Modal } from "@/components/terminal/Modal";

interface TypeConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** Exact phrase the user must type to confirm. */
  confirmPhrase: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TypeConfirmDialog({
  open,
  title,
  description,
  confirmPhrase,
  confirmText = "Confirm",
  onConfirm,
  onCancel,
  loading = false,
}: TypeConfirmDialogProps) {
  const [typed, setTyped] = React.useState("");

  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const matches = typed.trim() === confirmPhrase;

  return (
    <Modal isOpen={open} onClose={onCancel} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-terminal-gray">{description}</p>
        <p className="text-xs text-terminal-warning">
          Type <span className="font-bold text-terminal-green">{confirmPhrase}</span> to
          confirm.
        </p>
        <Input
          id="type-confirm"
          label="Confirmation"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          disabled={loading}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!matches || loading}
            onClick={onConfirm}
          >
            {loading ? `${confirmText}…` : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
