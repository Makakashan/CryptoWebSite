import { Coins, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnrichedAsset } from "./AssetsTable";
import { PortfolioGlassHighlight } from "./PortfolioGlassHighlight";

type Props = {
	bestPerformer: EnrichedAsset | null;
	worstPerformer: EnrichedAsset | null;
	bestPerformerTone: string;
	worstPerformerTone: string;
	concentrationRisk: number;
	cashRatio: number;
};

const Metric = ({
	icon,
	label,
	value,
	sub,
	tone,
	unusual,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub?: string;
	tone?: string;
	unusual?: boolean;
}) => (
	<div className="portfolio-glass-metric">
		<PortfolioGlassHighlight
			rimClassName="portfolio-glass-highlight__rim--metric"
			glowClassName="portfolio-glass-highlight__glow--metric"
		/>
		<div className="mb-1 flex items-center gap-2 text-xs text-text-secondary">
			{icon}
			{label}
			{unusual && (
				<span className="portfolio-status-chip portfolio-status-chip-unusual ml-1">
					Unusual
				</span>
			)}
		</div>
		<div className="text-sm font-semibold text-text-primary">{value}</div>
		{sub && <div className={`text-xs ${tone || "text-text-secondary"}`}>{sub}</div>}
	</div>
);

/**
 * "Position Health" card — best/worst performer + concentration risk + cash ratio.
 */
export const PositionHealth = ({
	bestPerformer,
	worstPerformer,
	bestPerformerTone,
	worstPerformerTone,
	concentrationRisk,
	cashRatio,
}: Props) => (
	<Card className="portfolio-glass-panel xl:col-span-2">
		<PortfolioGlassHighlight
			rimClassName="portfolio-glass-highlight__rim--wide"
			glowClassName="portfolio-glass-highlight__glow--wide"
		/>
		<CardHeader>
			<CardTitle className="text-xl">Position Health</CardTitle>
			<CardDescription>Performance and risk snapshot of your holdings</CardDescription>
		</CardHeader>
		<CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
			<Metric
				icon={<TrendingUp className={`h-3.5 w-3.5 ${bestPerformerTone}`} />}
				label="Best performer"
				value={bestPerformer ? bestPerformer.asset_symbol.replace("USDT", "") : "-"}
				sub={bestPerformer ? `${bestPerformer.netProfitPercent.toFixed(2)}%` : "0.00%"}
				tone={bestPerformerTone}
				unusual={!!(bestPerformer && bestPerformer.netProfitPercent < 0)}
			/>
			<Metric
				icon={<TrendingDown className={`h-3.5 w-3.5 ${worstPerformerTone}`} />}
				label="Worst performer"
				value={worstPerformer ? worstPerformer.asset_symbol.replace("USDT", "") : "-"}
				sub={worstPerformer ? `${worstPerformer.netProfitPercent.toFixed(2)}%` : "0.00%"}
				tone={worstPerformerTone}
				unusual={!!(worstPerformer && worstPerformer.netProfitPercent > 0)}
			/>
			<Metric
				icon={<ShieldAlert className="h-3.5 w-3.5 text-white/75" />}
				label="Concentration risk"
				value={`${concentrationRisk.toFixed(1)}%`}
				sub="Largest single position share"
			/>
			<Metric
				icon={<Coins className="h-3.5 w-3.5 text-white/75" />}
				label="Cash ratio"
				value={`${cashRatio.toFixed(1)}%`}
				sub="Unallocated liquidity"
			/>
		</CardContent>
	</Card>
);
