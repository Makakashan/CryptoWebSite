import { Wallet } from "lucide-react";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TiltCard3D, NumberTicker } from "@/components/three";

type Props = {
	title: string;
	/** Display value. Used directly when `numericValue` is not provided. */
	value: string | number;
	/**
	 * Optional numeric value — when provided, the card renders a NumberTicker
	 * that smoothly animates from the previous value to this one using
	 * ease-out cubic. The `format` function is applied to the interpolated
	 * number on every frame.
	 */
	numericValue?: number;
	/** Format function paired with `numericValue`. */
	format?: (v: number) => string;
	description: string;
	icon: typeof Wallet;
	valueClassName?: string;
};

/**
 * Single metric tile for the Dashboard hero row.
 * Wraps the glass card in a TiltCard3D so it tilts toward the cursor.
 *
 * When `numericValue` + `format` are provided, the value animates smoothly
 * via NumberTicker whenever the numeric value changes (e.g. live price
 * updates from the Binance WebSocket).
 */
export const DashboardMetricCard = ({
	title,
	value,
	numericValue,
	format,
	description,
	icon: Icon,
	valueClassName = "text-2xl",
}: Props) => (
	<TiltCard3D maxTilt={6} scale={1.015} glare={0.18} className="h-full">
		<Card className="glass-metric-card h-full">
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between gap-3">
					<CardDescription className="text-[11px] font-medium uppercase tracking-[0.14em]">
						{title}
					</CardDescription>
					<span className="glass-icon-pill">
						<Icon className="h-3.5 w-3.5" />
					</span>
				</div>
				<CardTitle className={`mt-1 tracking-tight tabular-nums ${valueClassName}`}>
					{numericValue !== undefined && format ? (
						<NumberTicker value={numericValue} format={format} duration={900} />
					) : (
						value
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="flex items-center gap-2 text-xs text-text-secondary">
					<span className="h-1 w-1 rounded-full bg-white/30" />
					{description}
				</p>
			</CardContent>
		</Card>
	</TiltCard3D>
);
