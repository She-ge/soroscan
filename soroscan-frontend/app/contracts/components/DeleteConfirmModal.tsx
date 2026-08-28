"use client";

import * as React from "react";
import { Modal } from "@/components/terminal/Modal";
import { Button } from "@/components/terminal/Button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  contractName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  contractName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="CONFIRM_DELETE">
      <div className="space-y-4">
        <p className="text-terminal-danger">
          Are you sure you want to delete contract &quot;{contractName}&quot;?
        </p>
        <p className="text-sm text-terminal-gray">
          This action cannot be undone. All associated data will be permanently removed.
        </p>

        <div className="flex gap-3 pt-4">
          <Button
            variant="danger"
            data-testid="confirm-delete-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? "DELETING..." : "DELETE"}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
            CANCEL
          </Button>
        </div>
      </div>
    </Modal>
  );
}
