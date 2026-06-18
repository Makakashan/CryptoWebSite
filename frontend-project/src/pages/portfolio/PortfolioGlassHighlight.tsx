/**
 * Decorative glass highlight — a 1px rim light + soft glow + optional
 * floating orbs. Rendered absolutely inside any glass card.
 */
export const PortfolioGlassHighlight = ({
	rimClassName,
	glowClassName,
	showOrbs = false,
}: {
	rimClassName: string;
	glowClassName: string;
	showOrbs?: boolean;
}) => (
	<div
		aria-hidden
		className="portfolio-glass-highlight pointer-events-none absolute inset-0 overflow-hidden"
	>
		<div className={`portfolio-glass-highlight__rim ${rimClassName}`} />
		<div className={`portfolio-glass-highlight__glow ${glowClassName}`} />
		{showOrbs ? (
			<>
				<div className="portfolio-glass-highlight__orb portfolio-glass-highlight__orb--left" />
				<div className="portfolio-glass-highlight__orb portfolio-glass-highlight__orb--right" />
			</>
		) : null}
	</div>
);
