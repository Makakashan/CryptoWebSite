import type { ComponentType } from "react";
import type { Asset } from "../types";

export type AvatarSize = "sm" | "md" | "lg";

export type PriceFlash = "up" | "down" | null;

export interface AvatarUploadProps {
	currentAvatar?: string | null;
	username: string;
	onAvatarChange: (avatar: string | null) => void;
	size?: AvatarSize;
}

export interface AssetCardProps {
	asset: Asset;
}

export interface MiniChartProps {
	data: number[];
	color: string;
}

export interface SidebarNavItem {
	to: string;
	label: string;
	icon: ComponentType<{ className?: string }>;
}
