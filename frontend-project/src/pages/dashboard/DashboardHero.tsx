import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/button";
import { CoinField } from "@/components/three";

type Props = {
	/** Optional pulse dot to indicate live data. */
	live?: boolean;
};

/**
 * Glass hero band at the top of the Dashboard with eyebrow + CTA.
 * A sparse, low-opacity CoinField sits behind the headline for ambient
 * crypto-flavoured depth.
 */
export const DashboardHero = ({ live = true }: Props) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<div className="glass-hero-glass relative overflow-hidden px-6 py-7 md:px-8 md:py-9">
			{/* Sparse coin sprites behind the headline — low opacity, no drag */}
			<div className="pointer-events-none absolute z-0" style={{ inset: 0, opacity: 0.5 }}>
				<CoinField
					count={5}
					spread={30}
					opacity={0.12}
					parallax={1.5}
					position="absolute"
					zIndex={0}
				/>
			</div>

			<div className="glass-panel-inner relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="max-w-2xl">
					<div className="glass-eyebrow">
						<span className={`glass-eyebrow-dot ${live ? "glass-eyebrow-dot--ping" : ""}`} />
						Live
					</div>
					<h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
						{t("dashboard")}
					</h1>
					<p className="mt-2 max-w-xl text-sm text-text-secondary md:text-base">
						Live balance, market pulse, and your next trading moves.
					</p>
				</div>
				<Button
					className="glass-cta-button shrink-0 self-start lg:self-center"
					onClick={() => navigate("/markets")}
				>
					{t("viewMarkets")}
					<ArrowRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};
