"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";

interface ConfirmationDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  title = "Confirm action",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <ModalContent className="max-w-md" aria-label={title}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description ? (
            <ModalDescription>{description}</ModalDescription>
          ) : null}
        </ModalHeader>

        <div className="grid gap-3 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {cancelText}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? `${confirmText}...` : confirmText}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
