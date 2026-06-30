"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

// ---------------------------------------------------------------------------
// Primitive re-exports (unchanged API surface)
// ---------------------------------------------------------------------------
const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalPortal = DialogPrimitive.Portal;

// ---------------------------------------------------------------------------
// ModalOverlay
// ---------------------------------------------------------------------------
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ---------------------------------------------------------------------------
// ModalContent
// Adds:
//  • useFocusTrap — traps Tab/Shift+Tab and restores focus on close
//  • scroll-lock  — prevents body scroll while the modal is open
//  • aria-labelledby wired to the modal's title id (if provided via prop)
//  • onPointerDownOutside prevention (overlay click does NOT close)
// ---------------------------------------------------------------------------
interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** id that matches the ModalTitle inside this content for aria-labelledby */
  titleId?: string;
}

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ className, children, titleId, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  // Merge the forwarded ref with our internal ref
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ref]
  );

  // Watch the data-state attribute on the content node so we work with both
  // real Radix (which sets data-state="open"/"closed") and the test mock
  // (which also sets data-state="open").
  React.useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const update = () => {
      setIsOpen(node.dataset.state === "open");
    };

    update(); // run once on mount

    const observer = new MutationObserver(update);
    observer.observe(node, { attributes: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  });

  // Scroll-lock: add overflow:hidden to <body> while the modal is open
  React.useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Activate focus trap when the modal is open
  useFocusTrap({ active: isOpen, containerRef: contentRef });

  const resolvedLabelledBy = ariaLabelledBy ?? titleId;

  return (
    <ModalPortal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={mergedRef}
        // Prevent overlay / outside-click from closing the modal (per requirements)
        onPointerDownOutside={(e) => e.preventDefault()}
        aria-labelledby={resolvedLabelledBy}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </ModalPortal>
  );
});
ModalContent.displayName = DialogPrimitive.Content.displayName;

// ---------------------------------------------------------------------------
// ModalHeader
// ---------------------------------------------------------------------------
const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);
ModalHeader.displayName = "ModalHeader";

// ---------------------------------------------------------------------------
// ModalTitle
// ---------------------------------------------------------------------------
const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

// ---------------------------------------------------------------------------
// ModalDescription
// ---------------------------------------------------------------------------
const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
};
