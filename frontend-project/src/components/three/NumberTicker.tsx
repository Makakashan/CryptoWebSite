import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/three";

type Props = {
	/** Target numeric value. */
	value: number;
	/** Format function (e.g. price formatting). */
	format?: (v: number) => string;
	/** Animation duration in ms (default 1200). */
	duration?: number;
	className?: string;
};

/**
 * Smoothly animates a number from its previous value to the new one
 * using ease-out cubic. Re-runs whenever `value` changes.
 *
 * Honors prefers-reduced-motion (snaps to final value instantly).
 */
export const NumberTicker = ({ value, format, duration = 1200, className }: Props) => {
	const reduced = useReducedMotion();
	// When reduced motion is on, just render the value directly without state.
	const [display, setDisplay] = useState(reduced ? value : value);
	const fromRef = useRef(value);
	const rafRef = useRef<number>(0);

	useEffect(() => {
		if (reduced) return;

		const from = fromRef.current;
		const to = value;
		if (from === to) return;

		const start = performance.now();
		const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

		const step = (now: number) => {
			const t = Math.min(1, (now - start) / duration);
			const current = from + (to - from) * easeOut(t);
			setDisplay(current);
			if (t < 1) {
				rafRef.current = requestAnimationFrame(step);
			} else {
				fromRef.current = to;
			}
		};
		rafRef.current = requestAnimationFrame(step);

		return () => cancelAnimationFrame(rafRef.current);
	}, [value, duration, reduced]);

	const rendered = reduced ? value : display;

	return (
		<span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
			{format ? format(rendered) : rendered}
		</span>
	);
};
