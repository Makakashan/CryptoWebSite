import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-lg border border-bg-hover bg-bg-dark px-4 py-3 text-base text-text-primary transition-colors focus:border-red focus:ring-1 focus:ring-red focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Select.displayName = "Select";

export default Select;
