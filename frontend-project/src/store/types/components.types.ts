import type { Asset } from "../types";

export type AvatarSize = "sm" | "md" | "lg";

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
