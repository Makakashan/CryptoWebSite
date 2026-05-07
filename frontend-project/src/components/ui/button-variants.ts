import { cva } from "class-variance-authority";

export const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
	{
		variants: {
			variant: {
				default:
					"bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 border border-transparent",
				success:
					"bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 border border-transparent",
				outline:
					"border border-white/[0.12] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white hover:border-white/30 backdrop-blur-xl",
				secondary:
					"bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.08] backdrop-blur-xl",
				ghost: "hover:bg-white/[0.06] hover:text-white text-white/60",
				link: "text-white underline-offset-4 hover:underline hover:text-white/80 p-0",
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
