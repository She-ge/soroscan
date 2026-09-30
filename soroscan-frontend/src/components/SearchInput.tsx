import * as React from "react";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (query: string) => void;
  showShortcutBadge?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      placeholder = "Search contracts... (Press / to focus)",
      value,
      onChange,
      onSearch,
      showShortcutBadge = true,
      ...props
    },
    ref
  ) => {
    const internalInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if user is currently typing inside an input, textarea, or contentEditable element
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable)
        ) {
          return;
        }

        // Global shortcut '/' to focus the search input
        if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
          e.preventDefault();
          internalInputRef.current?.focus();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        e.preventDefault();
        onSearch((e.currentTarget.value || "").trim());
      }
      props.onKeyDown?.(e);
    };

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <Search
          aria-hidden="true"
          className="absolute left-3 w-4 h-4 text-terminal-gray pointer-events-none"
        />
        <input
          ref={internalInputRef}
          type="text"
          role="searchbox"
          aria-label={props["aria-label"] || "Search contracts"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-12 py-2 text-sm bg-terminal-black/70 border border-terminal-green/30 text-terminal-green placeholder:text-terminal-gray focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green rounded transition-colors font-terminal-mono"
          {...props}
        />
        {showShortcutBadge && (
          <kbd
            aria-hidden="true"
            className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono font-medium text-terminal-gray border border-terminal-green/20 rounded bg-terminal-black/50 pointer-events-none select-none"
          >
            /
          </kbd>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
