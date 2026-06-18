import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import AssetCard from "@/components/AssetCard";
import AssetCardSkeleton from "@/components/skeletons/AssetCardSkeleton";
import Card, { CardContent } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { TiltCard3D } from "@/components/three";
import type { Asset } from "@/store/types/assets.types";

type Props = {
	assets: Asset[];
	isLoading: boolean;
	error?: string | null;
	onReset: () => void;
};

/**
 * Markets grid — wraps each AssetCard in a TiltCard3D for a 3D hover.
 * Shows skeletons while loading, an empty state when no results.
 */
export const MarketsGrid = ({ assets, isLoading, error, onReset }: Props) => {
	const { t } = useTranslation();

	if (error) {
		return (
			<Card className="glass-empty-panel border-white/10">
				<CardContent className="glass-panel-inner p-6 text-center">
					<p className="text-red text-base">{error}</p>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 12 }).map((_, index) => (
					<AssetCardSkeleton key={`skeleton-${index}`} />
				))}
			</div>
		);
	}

	if (assets.length === 0) {
		return (
			<Card className="glass-empty-panel">
				<CardContent className="glass-panel-inner p-14 text-center">
					<div className="flex flex-col items-center gap-3">
						<div className="glass-inline-metric flex h-16 w-16 items-center justify-center rounded-full">
							<Search className="h-8 w-8 text-text-secondary" />
						</div>
						<p className="text-text-secondary text-lg">{t("noAssetsAvailable")}</p>
						<Button
							variant="outline"
							size="sm"
							className="glass-muted-button"
							onClick={onReset}
						>
							{t("resetFilters")}
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{assets.map((asset) => (
				<TiltCard3D key={asset.symbol} maxTilt={6} scale={1.02} glare={0.16} className="h-full">
					<AssetCard asset={asset} />
				</TiltCard3D>
			))}
		</div>
	);
};
