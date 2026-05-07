import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-11 w-full rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-2 text-sm text-white shadow-sm transition-all duration-200",
					"placeholder:text-white/40",
					"focus:outline-none focus:ring-2 focus:ring-[#f23f5d]/30 focus:border-[#f23f5d]/50",
					"disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
export default Input;
