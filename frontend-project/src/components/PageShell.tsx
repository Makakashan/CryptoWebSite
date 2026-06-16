import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
	children: ReactNode;
	bodyClassName?: string;
};

export const PageShell = ({ children, bodyClassName }: PageShellProps) => (
	<div className="glass-page-shell">
		<div className={cn("glass-page-body", bodyClassName)}>{children}</div>
	</div>
);

type PageHeroProps = {
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	eyebrow?: ReactNode;
	/** When true, shows a pulsing dot inside the eyebrow pill. */
	eyebrowLive?: boolean;
	className?: string;
};

export const PageHero = ({
	title,
	description,
	actions,
	eyebrow,
	eyebrowLive = false,
	className,
}: PageHeroProps) => (
	<div className={cn("glass-hero-glass px-6 py-7 md:px-8 md:py-9", className)}>
		<div className="glass-panel-inner flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div className="max-w-2xl">
				{eyebrow ? (
					<div className="glass-eyebrow">
						<span
							className={cn("glass-eyebrow-dot", eyebrowLive && "glass-eyebrow-dot--ping")}
						/>
						{eyebrow}
					</div>
				) : null}
				<h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
					{title}
				</h1>
				{description ? (
					<p className="mt-2 max-w-xl text-sm text-text-secondary md:text-base">
						{description}
					</p>
				) : null}
			</div>
			{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
		</div>
	</div>
);
