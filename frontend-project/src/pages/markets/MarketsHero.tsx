import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import Button from "@/components/ui/button";
import { FloatingShapes } from "@/components/three";

/**
 * Hero band for the Markets page — eyebrow + 5xl headline + "Add asset" CTA.
 * A sparse FloatingShapes layer sits behind the headline for ambient depth.
 */
export const MarketsHero = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<div className="glass-hero-glass relative overflow-hidden px-6 py-7 md:px-8 md:py-9">
			{/* Sparse wireframe polyhedra behind the headline */}
			<div className="pointer-events-none absolute z-0" style={{ inset: 0, opacity: 0.55 }}>
				<FloatingShapes
					count={5}
					spread={34}
					opacity={0.28}
					parallax={1.8}
					position="absolute"
					zIndex={0}
				/>
			</div>

			<div className="glass-panel-inner relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="max-w-2xl">
					<div className="glass-eyebrow">
						<span className="glass-eyebrow-dot" />
						Markets
					</div>
					<h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
						{t("markets")}
					</h1>
					<p className="mt-2 max-w-xl text-sm text-text-secondary md:text-base">
						Discover and track your favorite assets
					</p>
				</div>
				<Button
					onClick={() => navigate("/markets/add")}
					className="glass-cta-button gap-2 shrink-0 self-start lg:self-center"
				>
					<Plus className="h-4 w-4" />
					{t("addNewAsset")}
				</Button>
			</div>
		</div>
	);
};
