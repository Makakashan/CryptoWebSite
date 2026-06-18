import type { LucideIcon } from "lucide-react";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TiltCard3D } from "@/components/three";
import { PortfolioGlassHighlight } from "./PortfolioGlassHighlight";

type Props = {
	title: string;
	value: string | number;
	description: string;
	Icon: LucideIcon;
};

/**
 * Summary metric tile for the Portfolio hero row.
 * Wraps the glass card in TiltCard3D for a 3D hover.
 */
export const PortfolioSummaryCard = ({ title, value, description, Icon }: Props) => (
	<TiltCard3D maxTilt={5} scale={1.015} glare={0.16} className="h-full">
		<Card className="portfolio-glass-card h-full">
			<PortfolioGlassHighlight
				rimClassName="portfolio-glass-highlight__rim--card"
				glowClassName="portfolio-glass-highlight__glow--card"
			/>
			<CardHeader className="pb-2">
				<CardDescription>{title}</CardDescription>
				<CardTitle className="text-2xl">{value}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="flex items-center gap-2 text-xs text-text-secondary">
					<Icon className="h-3.5 w-3.5" />
					{description}
				</p>
			</CardContent>
		</Card>
	</TiltCard3D>
);
