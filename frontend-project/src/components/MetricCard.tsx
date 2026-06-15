import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Card, { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
	title: ReactNode;
	value: ReactNode;
	description?: ReactNode;
	icon?: LucideIcon;
	valueClassName?: string;
	valueStyle?: CSSProperties;
};

const MetricCard = ({
	title,
	value,
	description,
	icon: Icon,
	valueClassName,
	valueStyle,
}: MetricCardProps) => (
	<Card className="glass-metric-card">
		<CardContent className="p-5">
			<p className="text-xs uppercase tracking-wider text-text-secondary">{title}</p>
			<div
				className={cn("mt-3 text-3xl font-bold text-text-primary", valueClassName)}
				style={valueStyle}
			>
				{value}
			</div>
			{description ? (
				<div className="mt-2 text-xs text-text-secondary flex items-center gap-1.5">
					{Icon ? <Icon className="w-3.5 h-3.5" /> : null}
					{description}
				</div>
			) : null}
		</CardContent>
	</Card>
);

export default MetricCard;
