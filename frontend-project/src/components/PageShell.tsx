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
	className?: string;
};

export const PageHero = ({ title, description, actions, className }: PageHeroProps) => (
	<div className={cn("glass-hero-glass px-6 py-5", className)}>
		<div className="glass-panel-inner flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<div className="max-w-2xl">
				<h1 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
				{description ? (
					<p className="mt-1.5 max-w-xl text-sm text-text-secondary">{description}</p>
				) : null}
			</div>
			{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
		</div>
	</div>
);
