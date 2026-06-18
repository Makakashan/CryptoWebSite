import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button";
import { PortfolioGlassHighlight } from "./PortfolioGlassHighlight";

/**
 * Portfolio hero — eyebrow + 5xl headline + CTA.
 *
 * No 3D backdrop (kept clean and focused on the content).
 * The glass surface still gets the pointer-tracked spotlight +
 * iridescent edge from glass-premium.css.
 */
export const PortfolioHero = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<div className="portfolio-hero-glass px-6 py-7 md:px-8 md:py-9">
			<PortfolioGlassHighlight
				rimClassName="portfolio-glass-highlight__rim--wide"
				glowClassName="portfolio-glass-highlight__glow--wide"
				showOrbs
			/>
			<div className="glass-panel-inner relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="max-w-2xl">
					<div className="glass-eyebrow">
						<span className="glass-eyebrow-dot glass-eyebrow-dot--ping" />
						Portfolio
					</div>
					<h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
						{t("myPortfolio")}
					</h1>
					<p className="mt-2 max-w-xl text-sm text-text-secondary md:text-base">
						Your command center for capital, allocation, and execution.
					</p>
				</div>
				<Button
					variant="outline"
					className="glass-cta-button shrink-0 self-start lg:self-center"
					onClick={() => navigate("/markets")}
				>
					{t("tradeAssets")}
				</Button>
			</div>
		</div>
	);
};
