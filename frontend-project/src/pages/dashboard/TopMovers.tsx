import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { formatPrice } from "@/utils/formatPrice";

type Asset = {
	symbol: string;
	name?: string;
	image_url?: string | null;
	price?: number;
	current_price?: number;
	price_change_24h?: number | null;
};

type Props = {
	assets: Asset[];
};

/**
 * Top movers list — 5 assets with the strongest 24h move (abs).
 */
export const TopMovers = ({ assets }: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const topMovers = [...assets]
		.filter((asset) => typeof asset.price_change_24h === "number")
		.sort((a, b) => Math.abs(b.price_change_24h || 0) - Math.abs(a.price_change_24h || 0))
		.slice(0, 5);

	return (
		<Card className="glass-chart-panel">
			<div className="glass-panel-inner">
				<CardHeader>
					<span className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">
						Market pulse
					</span>
					<CardTitle className="mt-1 text-xl">{t("topMovers")}</CardTitle>
					<CardDescription>{t("strongest24hMove")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2.5">
					{topMovers.length === 0 ? (
						<p className="text-sm text-text-secondary">{t("noMarketDataYet")}</p>
					) : (
						topMovers.map((asset) => {
							const shortName = asset.symbol.replace("USDT", "");
							const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=32`;
							const price = asset.price || asset.current_price || 0;
							const change = asset.price_change_24h || 0;

							return (
								<button
									type="button"
									key={asset.symbol}
									className="glass-inline-metric flex w-full items-center justify-between rounded-2xl p-3"
									onClick={() => navigate(`/markets/${asset.symbol}`)}
								>
									<div className="flex items-center gap-3 text-left">
										<img
											src={asset.image_url || defaultIcon}
											alt={shortName}
											className="h-9 w-9 rounded-full border border-white/10"
											onError={(e) => {
												e.currentTarget.src = defaultIcon;
											}}
										/>
										<div>
											<p className="text-sm font-semibold text-text-primary">
												{shortName}
											</p>
											<p className="text-xs tabular-nums text-text-secondary">
												{formatPrice(price)}
											</p>
										</div>
									</div>
									<span
										className={`portfolio-status-chip ${
											change >= 0
												? "portfolio-status-chip-positive"
												: "portfolio-status-chip-negative"
										}`}
									>
										{change >= 0 ? "+" : ""}
										{change.toFixed(2)}%
									</span>
								</button>
							);
						})
					)}

					<Button
						variant="outline"
						className="glass-cta-button mt-3 w-full"
						onClick={() => navigate("/markets")}
					>
						{t("viewMarkets")}
						<ArrowRight className="h-4 w-4" />
					</Button>
				</CardContent>
			</div>
		</Card>
	);
};
