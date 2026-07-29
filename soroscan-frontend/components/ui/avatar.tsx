"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground select-none shrink-0",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-24 w-24 text-2xl",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-lg",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
    },
  }
)

const avatarImageVariants = cva(
  "object-cover w-full h-full",
  {
    variants: {
      shape: {
        circle: "rounded-full",
        square: "rounded-lg",
      },
    },
    defaultVariants: {
      shape: "circle",
    },
  }
)

const indicatorVariants = cva(
  "absolute block rounded-full border-2 border-background ring-1 ring-border",
  {
    variants: {
      size: {
        xs: "h-2 w-2 -bottom-0.5 -right-0.5",
        sm: "h-2.5 w-2.5 -bottom-0.5 -right-0.5",
        md: "h-3 w-3 -bottom-0.5 -right-0.5",
        lg: "h-3.5 w-3.5 -bottom-0.5 -right-0.5",
        xl: "h-4 w-4 -bottom-0.5 -right-0.5",
        "2xl": "h-5 w-5 -bottom-0.5 -right-0.5",
      },
      status: {
        online: "bg-green-500",
        away: "bg-yellow-500",
        busy: "bg-red-500",
        offline: "bg-gray-400",
      },
    },
    defaultVariants: {
      size: "md",
      status: "online",
    },
  }
)

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
  status?: "online" | "away" | "busy" | "offline"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, shape, src, alt = "", fallback, status, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false)

    const showImage = src && !imgError
    const initials = fallback ?? (alt ? alt.charAt(0).toUpperCase() : "?")

    return (
      <div
        ref={ref}
        data-slot="avatar"
        className={cn(avatarVariants({ size, shape }), className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className={avatarImageVariants({ shape })}
            onError={() => setImgError(true)}
          />
        ) : (
          <span aria-hidden="true" className="leading-none">
            {initials}
          </span>
        )}
        {status && (
          <span
            data-testid="avatar-status-indicator"
            className={indicatorVariants({ size, status })}
            aria-label={status}
          />
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar, avatarVariants }
