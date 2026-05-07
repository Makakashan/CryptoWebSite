import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
	({ className, children, ...props }, ref) => (
		<select
			ref={ref}
			className={cn(
				"flex h-11 w-full rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-2 text-sm text-white shadow-sm transition-all duration-200 appearance-none cursor-pointer",
				"focus:outline-none focus:ring-2 focus:ring-[#f23f5d]/30 focus:border-[#f23f5d]/50",
				"disabled:cursor-not-allowed disabled:opacity-50",
				"[&>option]:bg-[#0a0a0a] [&>option]:text-white",
				className,
			)}
			{...props}
		>
			{children}
		</select>
	),
);
Select.displayName = "Select";

export { Select };
export default Select;
