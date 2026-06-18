import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/three";

type Props = {
	children: ReactNode;
	className?: string;
	/** How strongly the button is pulled toward the cursor (in px). */
	strength?: number;
	/** Radius of influence in px (default 120). */
	radius?: number;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

/**
 * Button that is magnetically attracted to the cursor when it's within
 * `radius` pixels. Returns to origin with a spring-like ease.
 *
 * Respects `prefers-reduced-motion`.
 */
export const MagneticButton = ({
	children,
	className,
	strength = 0.4,
	radius = 120,
	...rest
}: Props) => {
	const ref = useRef<HTMLButtonElement>(null);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const reduced = useReducedMotion();

	const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (reduced || !ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const dx = e.clientX - cx;
		const dy = e.clientY - cy;
		const dist = Math.hypot(dx, dy);
		if (dist > radius) return;
		const factor = (1 - dist / radius) * strength;
		setOffset({ x: dx * factor, y: dy * factor });
	};

	const handleLeave = () => {
		setOffset({ x: 0, y: 0 });
	};

	return (
		<button
			ref={ref}
			onMouseMove={handleMove}
			onMouseLeave={handleLeave}
			className={cn("transition-transform duration-300 ease-out", className)}
			style={{
				transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
				willChange: "transform",
			}}
			{...rest}
		>
			{children}
		</button>
	);
};
