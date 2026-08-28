import * as React from "react"
import { cn } from "@/lib/utils"
import { TerminalCursor } from "@/components/terminal/Motion"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    /** Show a blinking terminal cursor when focused (default true). */
    showCursor?: boolean;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, showCursor = true, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false)

    return (
      <div className="w-full space-y-1 group">
        {label && (
          <label htmlFor={props.id} className="text-xs font-terminal-mono text-terminal-cyan uppercase tracking-wider block ml-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-terminal-green font-terminal-mono transition-terminal-fast group-focus-within:opacity-100 opacity-70">
            &gt;
          </span>
          <input
            type={type}
            className={cn(
              "flex h-11 min-h-[44px] w-full bg-terminal-black border-terminal border-terminal-gray/40 px-8 py-2 text-sm font-terminal-mono text-terminal-green ring-offset-terminal-black file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-terminal-gray focus-visible:outline-none focus-visible:border-terminal-green focus-visible:shadow-glow-green transition-terminal-normal disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            onFocus={(event) => {
              setFocused(true)
              onFocus?.(event)
            }}
            onBlur={(event) => {
              setFocused(false)
              onBlur?.(event)
            }}
            {...props}
          />
          {showCursor && focused ? (
            <TerminalCursor className="pointer-events-none absolute right-8" />
          ) : (
            <div className="absolute right-3 w-2 h-2 rounded-full border border-terminal-green/40 group-focus-within:bg-terminal-green group-focus-within:shadow-glow-green transition-terminal-fast" />
          )}
        </div>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
