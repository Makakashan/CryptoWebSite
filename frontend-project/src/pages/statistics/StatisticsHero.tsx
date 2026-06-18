import { useTranslation } from "react-i18next";

/**
 * Hero band for the Statistics page — eyebrow + 5xl headline.
 *
 * No 3D backdrop (kept clean for content focus).
 * The glass surface still gets the pointer-tracked spotlight +
 * iridescent edge from glass-premium.css.
 */
export const StatisticsHero = () => {
	const { t } = useTranslation();

	return (
		<div className="glass-hero-glass px-6 py-7 md:px-8 md:py-9">
			<div className="glass-panel-inner max-w-2xl">
				<div className="glass-eyebrow">
					<span className="glass-eyebrow-dot" />
					Analytics
				</div>
				<h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
					{t("tradingStatistics")}
				</h1>
				<p className="mt-2 max-w-xl text-sm text-text-secondary md:text-base">
					Execution quality, portfolio behavior, and realized performance.
				</p>
			</div>
		</div>
	);
};
