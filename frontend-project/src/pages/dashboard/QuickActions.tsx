import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";

/**
 * Quick actions panel at the bottom of the Dashboard.
 */
export const QuickActions = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<Card className="glass-surface-panel">
			<div className="glass-panel-inner">
				<CardHeader>
					<span className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">
						Shortcuts
					</span>
					<CardTitle className="mt-1 text-xl">{t("quickActions")}</CardTitle>
					<CardDescription>{t("shortcutsForNextMove")}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					<Button className="glass-cta-button" onClick={() => navigate("/markets")}>
						{t("viewMarkets")}
					</Button>
					<Button
						variant="secondary"
						className="glass-muted-button"
						onClick={() => navigate("/portfolio")}
					>
						{t("myPortfolio")}
					</Button>
					<Button
						variant="secondary"
						className="glass-muted-button"
						onClick={() => navigate("/orders")}
					>
						{t("orderHistory")}
					</Button>
				</CardContent>
			</div>
		</Card>
	);
};
