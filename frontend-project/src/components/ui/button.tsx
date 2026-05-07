import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f23f5d]/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
	{
		variants: {
			variant: {
				default: "bg-[#f23f5d] text-white hover:bg-[#b81a3c] shadow-lg shadow-[#f23f5d]/20 border border-transparent",
				success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 border border-transparent",
				outline:
					"border border-white/[0.12] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white hover:border-[#f23f5d]/30 backdrop-blur-xl",
				secondary: "bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.08] backdrop-blur-xl",
				ghost: "hover:bg-white/[0.06] hover:text-white text-white/60",
				link: "text-[#f23f5d] underline-offset-4 hover:underline hover:text-[#b81a3c] p-0",
				destructive: "bg-red-900 text-white hover:bg-red-700 border border-red-500/30",
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
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
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

export { Button, buttonVariants };
export default Button;
