import { useTranslation } from "react-i18next";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/utils/formatPrice";
import { PortfolioGlassHighlight } from "./PortfolioGlassHighlight";

type Holding = {
	asset_symbol: string;
	value: number;
	image_url?: string | null;
};

type Props = {
	topHoldings: Holding[];
	totalValue: number;
};

/**
 * "Allocation preview" card — top holdings with percentage bars.
 */
export const AllocationPreview = ({ topHoldings, totalValue }: Props) => {
	const { t } = useTranslation();

	return (
		<Card className="portfolio-glass-panel xl:col-span-1">
			<PortfolioGlassHighlight
				rimClassName="portfolio-glass-highlight__rim--wide"
				glowClassName="portfolio-glass-highlight__glow--wide"
			/>
			<CardHeader>
				<CardTitle className="text-xl">Allocation preview</CardTitle>
				<CardDescription>Largest positions by portfolio value</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{topHoldings.length > 0 ? (
					topHoldings.map((asset) => {
						const short = asset.asset_symbol.replace("USDT", "");
						const share = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
						const defaultIcon = `https://ui-avatars.com/api/?name=${short}&background=random&size=32`;

						return (
							<div key={asset.asset_symbol} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<img
											src={asset.image_url || defaultIcon}
											alt={short}
											className="h-7 w-7 rounded-full"
											onError={(e) => {
												e.currentTarget.src = defaultIcon;
											}}
										/>
										<div>
											<p className="text-sm font-semibold text-text-primary">{short}</p>
											<p className="text-xs text-text-secondary">
												{formatPrice(asset.value)}
											</p>
										</div>
									</div>
									<span className="text-xs text-text-secondary">{share.toFixed(1)}%</span>
								</div>
								<div className="h-2 overflow-hidden rounded-full border border-white/6 bg-white/4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
									<div
										className="h-full rounded-full bg-linear-to-r from-white/85 via-white/45 to-white/18 shadow-[0_0_16px_rgba(255,255,255,0.14)]"
										style={{ width: `${Math.min(share, 100)}%` }}
									/>
								</div>
							</div>
						);
					})
				) : (
					<p className="text-sm text-text-secondary">{t("noAssetsYet")}</p>
				)}
			</CardContent>
		</Card>
	);
};
