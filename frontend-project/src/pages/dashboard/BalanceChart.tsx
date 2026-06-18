import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card, {
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button";
import { formatPrice } from "@/utils/formatPrice";
import {
	BALANCE_HISTORY_INTERVAL,
	BALANCE_HISTORY_LIMIT,
	formatAxisPrice,
	type BalancePoint,
} from "./balanceHistory";

type Props = {
	data: BalancePoint[];
	isLoading: boolean;
	isCompact: boolean;
};

/**
 * Balance-over-time area chart with eyebrow label + Details CTA.
 */
export const BalanceChart = ({ data, isLoading, isCompact }: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	void BALANCE_HISTORY_INTERVAL;
	void BALANCE_HISTORY_LIMIT;

	return (
		<Card className="glass-chart-panel dashboard-chart-panel xl:col-span-2">
			<div className="glass-panel-inner">
				<CardHeader className="dashboard-chart-header">
					<div className="flex items-start justify-between gap-3">
						<div>
							<span className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">
								Performance
							</span>
							<CardTitle className="mt-1 text-xl">{t("balanceOverTime")}</CardTitle>
							<CardDescription className="mt-1">
								{t("balanceOverTimeDescription")}
							</CardDescription>
						</div>
						<CardAction>
							<Button
								variant="outline"
								size="sm"
								className="glass-muted-button"
								onClick={() => navigate("/statistics")}
							>
								{t("details")}
							</Button>
						</CardAction>
					</div>
				</CardHeader>
				<CardContent className="dashboard-chart-content">
					{isLoading ? (
						<div className="glass-chart-skeleton animate-pulse" />
					) : data.length > 1 ? (
						<div className="glass-chart-shell">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart
									data={data}
									margin={
										isCompact
											? { top: 6, right: 0, left: -16, bottom: 0 }
											: { top: 8, right: 8, left: 8, bottom: 0 }
									}
								>
									<defs>
										<linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#ffffff" stopOpacity={0.45} />
											<stop offset="95%" stopColor="#ffffff" stopOpacity={0.05} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
									<XAxis
										dataKey="ts"
										type="number"
										domain={["dataMin", "dataMax"]}
										stroke="rgba(255,255,255,0.45)"
										tickLine={false}
										axisLine={false}
										minTickGap={isCompact ? 14 : 5}
										tick={{ fontSize: isCompact ? 11 : 14 }}
										tickFormatter={(value) =>
											new Date(Number(value)).toLocaleDateString([], {
												day: "2-digit",
												month: "2-digit",
											})
										}
									/>
									<YAxis
										width={isCompact ? 46 : 90}
										stroke="rgba(255,255,255,0.45)"
										tickLine={false}
										axisLine={false}
										tick={{ fontSize: isCompact ? 11 : 14 }}
										tickFormatter={(value) => formatAxisPrice(Number(value))}
									/>
									<Tooltip
										labelFormatter={(label) =>
											new Date(Number(label)).toLocaleString([], {
												day: "2-digit",
												month: "2-digit",
												hour: "2-digit",
												minute: "2-digit",
											})
										}
										formatter={(value, _name, item) => [
											formatPrice(Number(value)),
											item?.payload?.label || t("balance"),
										]}
										contentStyle={{
											backgroundColor: "#111111",
											border: "1px solid rgba(255,255,255,0.1)",
											borderRadius: "16px",
										}}
									/>
									<Area
										type="monotone"
										dataKey="value"
										stroke="rgba(255,255,255,0.9)"
										strokeWidth={isCompact ? 2 : 2.5}
										fill="url(#balanceGradient)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="glass-chart-empty">{t("addMoreTradesToBuildChart")}</div>
					)}
				</CardContent>
			</div>
		</Card>
	);
};
