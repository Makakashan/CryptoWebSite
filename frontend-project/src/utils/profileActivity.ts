import { Clock3, Image as ImageIcon, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const mapProfileActivityIcon = (eventType: string): LucideIcon => {
	if (eventType.includes("avatar")) return ImageIcon;
	if (eventType.includes("login")) return ShieldCheck;
	if (eventType.includes("preferences")) return Sparkles;
	return Clock3;
};
