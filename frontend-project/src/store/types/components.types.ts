import type { Asset } from "./assets.types";

export interface AssetCardProps {
	asset: Asset;
}

export interface MiniChartProps {
	data: number[];
	color: string;
}

export type PriceFlash = "up" | "down" | null;

export interface SidebarNavItem {
	to: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}
