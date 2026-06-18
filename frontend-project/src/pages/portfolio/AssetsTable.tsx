import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { formatPrice } from "@/utils/formatPrice";
import type { SortKey, SortOrder } from "@/store/types/portfolio.types";
import { PortfolioGlassHighlight } from "./PortfolioGlassHighlight";

export type EnrichedAsset = {
	asset_symbol: string;
	amount: number;
	currentPrice: number;
	value: number;
	avgBuyPrice: number;
	name: string;
	image_url?: string | null;
	netProfit: number;
	netProfitPercent: number;
};

type Props = {
	assets: EnrichedAsset[];
	hasAssets: boolean;
	searchAsset: string;
	setSearchAsset: (v: string) => void;
	sortBy: SortKey;
	setSortBy: (v: SortKey) => void;
	sortOrder: SortOrder;
	setSortOrder: (v: SortOrder) => void;
	onReset: () => void;
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
};

/**
 * "Your Assets" card — searchable / sortable table of positions with pagination.
 */
export const AssetsTable = ({
	assets,
	hasAssets,
	searchAsset,
	setSearchAsset,
	sortBy,
	setSortBy,
	sortOrder,
	setSortOrder,
	onReset,
	currentPage,
	totalPages,
	onPageChange,
}: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<Card className="portfolio-glass-panel portfolio-glass-panel-assets">
			<PortfolioGlassHighlight
				rimClassName="portfolio-glass-highlight__rim--wide"
				glowClassName="portfolio-glass-highlight__glow--wide"
			/>
			<CardHeader className="pb-3">
				<CardTitle className="text-xl">{t("yourAssets")}</CardTitle>
				<CardDescription>Manage positions and monitor per-asset PnL</CardDescription>
			</CardHeader>

			<CardContent>
				{!hasAssets ? (
					<div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
						<p className="text-text-secondary">{t("noAssetsYet")}</p>
						<Button onClick={() => navigate("/markets")}>{t("browseMarkets")}</Button>
					</div>
				) : (
					<>
						<div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
							<input
								type="text"
								placeholder={t("searchAssets")}
								value={searchAsset}
								onChange={(e) => setSearchAsset(e.target.value)}
								className="input md:col-span-2"
							/>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as SortKey)}
								className="select"
							>
								<option value="value">{t("totalValue")}</option>
								<option value="pnl">Net Profit</option>
								<option value="symbol">{t("symbol")}</option>
								<option value="amount">{t("amount")}</option>
							</select>
							<select
								value={sortOrder}
								onChange={(e) => setSortOrder(e.target.value as SortOrder)}
								className="select"
							>
								<option value="desc">{t("highToLow")}</option>
								<option value="asc">{t("lowToHigh")}</option>
							</select>
						</div>

						<div className="mb-4 flex justify-end">
							<Button
								variant="secondary"
								className="portfolio-assets-reset rounded-full text-text-primary"
								onClick={onReset}
							>
								{t("reset")}
							</Button>
						</div>

						<div className="portfolio-assets-table overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr>
										<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
											{t("asset")}
										</th>
										<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
											{t("amount")}
										</th>
										<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
											{t("currentPrice")}
										</th>
										<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
											{t("avgBuyPrice")}
										</th>
										<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
											{t("totalValue")}
										</th>
										<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
											Net Profit
										</th>
										<th className="p-3 text-left text-xs font-semibold uppercase text-text-secondary">
											{t("actions")}
										</th>
									</tr>
								</thead>
								<tbody>
									{assets.map((asset) => {
										const short = asset.asset_symbol.replace("USDT", "");
										const defaultIcon = `https://ui-avatars.com/api/?name=${short}&background=random&size=32`;
										const positive = asset.netProfit > 0;
										const negative = asset.netProfit < 0;

										return (
											<tr key={asset.asset_symbol}>
												<td className="p-3">
													<div className="flex items-center gap-3">
														<img
															src={asset.image_url || defaultIcon}
															alt={short}
															className="h-8 w-8 rounded-full"
															onError={(e) => {
																e.currentTarget.src = defaultIcon;
															}}
														/>
														<div>
															<p className="text-sm font-semibold text-text-primary">
																{short}
															</p>
															<p className="text-xs text-text-secondary">
																{asset.name}
															</p>
														</div>
													</div>
												</td>
												<td className="p-3 text-sm text-text-primary">
													{asset.amount.toFixed(6)}
												</td>
												<td className="p-3 text-sm text-text-primary">
													{formatPrice(asset.currentPrice)}
												</td>
												<td className="p-3 text-sm text-text-primary">
													{formatPrice(asset.avgBuyPrice)}
												</td>
												<td className="p-3 text-sm font-semibold text-text-primary">
													{formatPrice(asset.value)}
												</td>
												<td className="p-3">
													<div
														className={`portfolio-status-chip ${
															positive
																? "portfolio-status-chip-positive"
																: negative
																	? "portfolio-status-chip-negative"
																	: "portfolio-status-chip-neutral"
														}`}
													>
														{asset.netProfit > 0 ? "+" : ""}
														{formatPrice(asset.netProfit)} (
														{asset.netProfitPercent.toFixed(2)}%)
													</div>
												</td>
												<td className="p-3">
													<Button
														variant="outline"
														size="sm"
														className="portfolio-assets-action rounded-full text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
														onClick={() => navigate(`/markets/${asset.asset_symbol}`)}
													>
														{t("trade")}
														<ArrowUpRight className="h-4 w-4" />
													</Button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						{totalPages > 1 && (
							<div className="mt-5 flex items-center justify-center gap-3">
								<Button
									variant="secondary"
									size="sm"
									className="rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]"
									disabled={currentPage === 1}
									onClick={() => onPageChange(currentPage - 1)}
								>
									{t("previous")}
								</Button>
								<span className="text-sm text-text-secondary">
									{t("page")} {currentPage} {t("of")} {totalPages}
								</span>
								<Button
									variant="secondary"
									size="sm"
									className="rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]"
									disabled={currentPage === totalPages}
									onClick={() => onPageChange(currentPage + 1)}
								>
									{t("next")}
								</Button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
};
