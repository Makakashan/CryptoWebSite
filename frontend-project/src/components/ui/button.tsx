import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-red text-white hover:bg-accent-red shadow-lg shadow-red/20",
        outline:
          "border border-bg-hover bg-transparent text-text-secondary hover:bg-bg-hover hover:text-white hover:border-red/50",
        secondary: "bg-bg-hover text-text-primary hover:bg-bg-hover/80",
        ghost: "hover:bg-bg-hover hover:text-white text-text-secondary",
        link: "text-red underline-offset-4 hover:underline hover:text-accent-red p-0",
        destructive: "bg-dark-red text-white hover:bg-red",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-5 py-2.5 text-xs",
        lg: "h-12 px-8 py-3.5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export default Button;
