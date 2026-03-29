import * as React from "react";
import { cn } from "@/lib/utils";

// Chart container component
const ChartContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn("flex aspect-video justify-center text-xs", className)}
				{...props}
			/>
		);
	},
);
ChartContainer.displayName = "ChartContainer";

// Chart tooltip types
interface TooltipPayloadEntry {
	value: number;
	name: string;
	color: string;
	[key: string]: unknown;
}

interface ChartTooltipProps {
	active?: boolean;
	payload?: TooltipPayloadEntry[];
	label?: string;
	labelFormatter?: (label: string) => string;
	formatter?: (value: number, name?: string) => string | number;
}

// Chart tooltip wrapper
const ChartTooltip = ({ active, payload, label, labelFormatter, formatter }: ChartTooltipProps) => {
	if (!active || !payload || !payload.length) {
		return null;
	}

	return (
		<div className="rounded-lg border border-bg-hover bg-bg-card shadow-xl p-3 backdrop-blur-sm pointer-events-none">
			<div className="text-xs font-medium text-text-primary mb-2">
				{labelFormatter && label ? labelFormatter(label) : label}
			</div>
			<div className="space-y-1">
				{payload.map((entry: TooltipPayloadEntry, index: number) => {
					const value = formatter ? formatter(entry.value, entry.name) : entry.value;
					return (
						<div key={`item-${index}`} className="flex items-center gap-2">
							<div
								className="w-2 h-2 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							<span className="text-xs text-text-secondary">{entry.name}:</span>
							<span className="text-xs font-medium text-text-primary">{value}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};
ChartTooltip.displayName = "ChartTooltip";

// Chart legend types
interface LegendPayloadEntry {
	value: string;
	color: string;
	[key: string]: unknown;
}

interface ChartLegendProps {
	payload?: LegendPayloadEntry[];
}

// Chart legend
const ChartLegend = ({ payload }: ChartLegendProps) => {
	if (!payload || !payload.length) {
		return null;
	}

	return (
		<div className="flex flex-wrap gap-4 justify-center pt-4">
			{payload.map((entry: LegendPayloadEntry, index: number) => (
				<div key={`legend-${index}`} className="flex items-center gap-2">
					<div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
					<span className="text-xs text-text-secondary">{entry.value}</span>
				</div>
			))}
		</div>
	);
};
ChartLegend.displayName = "ChartLegend";

// Chart config type
export interface ChartConfig {
	[key: string]: {
		label: string;
		color?: string;
		icon?: React.ComponentType<{ className?: string }>;
	};
}

export { ChartContainer, ChartTooltip, ChartLegend };
