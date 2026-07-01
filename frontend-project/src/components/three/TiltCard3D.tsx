import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/three";

type Props = {
	children: ReactNode;
	className?: string;
	/** Max tilt in degrees (default 8). */
	maxTilt?: number;
	/** Perspective in px (default 800). */
	perspective?: number;
	/** Scale factor on hover (default 1.02). */
	scale?: number;
	/** Glare highlight intensity 0..1 (default 0.18). */
	glare?: number;
};

/**
 * CSS-only 3D tilt wrapper. Tracks pointer inside the element and
 * rotates it in 3D space. Adds a subtle radial glare that follows
 * the cursor. Respects `prefers-reduced-motion` (becomes static).
 *
 * Wrap any card / surface — no three.js dependency.
 */
export const TiltCard3D = ({
	children,
	className,
	maxTilt = 8,
	perspective = 800,
	scale = 1.02,
	glare = 0.18,
}: Props) => {
	const ref = useRef<HTMLDivElement>(null);
	const [innerStyle, setInnerStyle] = useState<React.CSSProperties>({});
	const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
	const reduced = useReducedMotion();

	const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (reduced || !ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const dx = (e.clientX - cx) / (rect.width / 2);
		const dy = (e.clientY - cy) / (rect.height / 2);
		const rx = -dy * maxTilt;
		const ry = dx * maxTilt;
		setInnerStyle({
			transform: `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`,
		});
		setGlarePos({
			x: ((e.clientX - rect.left) / rect.width) * 100,
			y: ((e.clientY - rect.top) / rect.height) * 100,
			opacity: glare,
		});
	};

	const handleLeave = () => {
		setInnerStyle({
			transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
			transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
		});
		setGlarePos((g) => ({ ...g, opacity: 0 }));
	};

	return (
		<div
			ref={ref}
			onPointerMove={handleMove}
			onPointerLeave={handleLeave}
			className={cn("glass-tilt-card relative", className)}
		>
			<div
				className="relative h-full [transform-style:preserve-3d] transition-transform duration-200 ease-out"
				style={innerStyle}
			>
				{children}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
					style={{
						background: `radial-gradient(220px 220px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}), transparent 60%)`,
						opacity: glarePos.opacity,
						mixBlendMode: "screen",
					}}
				/>
			</div>
		</div>
	);
};
