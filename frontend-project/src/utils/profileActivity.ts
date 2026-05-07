import React from "react";
import { ShoppingCart, User, Settings, Bell, Image } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	order: ShoppingCart,
	login: User,
	profile: User,
	settings: Settings,
	notification: Bell,
	avatar: Image,
};

export const mapProfileActivityIcon = (eventType: string) => {
	return iconMap[eventType] || Settings;
};
