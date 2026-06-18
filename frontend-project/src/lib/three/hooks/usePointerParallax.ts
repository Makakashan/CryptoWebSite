import { useEffect, useRef } from "react";

type PointerState = {
	x: number;
	y: number;
	/** Smoothed (lerped) values — use these in animation loops. */
	smoothX: number;
	smoothY: number;
};

/**
 * Tracks pointer / touch / device-orientation and exposes normalized
 * coordinates in range [-1, 1] on both axes. Smoothed with lerp.
 *
 * Mobile behaviour: on touch devices we listen to `touchstart` AND
 * `touchmove`, so the scene reacts as soon as the finger lands — not
 * only while scrolling. The smoothed value then drifts back to the
 * last touched position, giving a "drag the background" feel.
 *
 * Pass `smoothing` (0..1) — higher = snappier, lower = smoother.
 * Default 0.04 (very smooth, ideal for camera parallax).
 */
export const usePointerParallax = (smoothing = 0.04) => {
	const pointer = useRef<PointerState>({ x: 0, y: 0, smoothX: 0, smoothY: 0 });

	useEffect(() => {
		if (typeof window === "undefined") return;

		const updateFromClient = (clientX: number, clientY: number) => {
			pointer.current.x = (clientX / window.innerWidth) * 2 - 1;
			pointer.current.y = -((clientY / window.innerHeight) * 2 - 1);
		};

		const onMouse = (e: MouseEvent) => updateFromClient(e.clientX, e.clientY);
		const onTouch = (e: TouchEvent) => {
			const t = e.touches[0];
			if (t) updateFromClient(t.clientX, t.clientY);
		};
		const onOrientation = (e: DeviceOrientationEvent) => {
			if (typeof e.gamma !== "number" || typeof e.beta !== "number") return;
			pointer.current.x = Math.max(-1, Math.min(1, e.gamma / 28));
			pointer.current.y = Math.max(-1, Math.min(1, (e.beta - 45) / -38));
		};

		window.addEventListener("mousemove", onMouse);
		// touchstart fires the moment the finger touches the screen — gives
		// instant feedback on mobile even without scrolling.
		window.addEventListener("touchstart", onTouch, { passive: true });
		window.addEventListener("touchmove", onTouch, { passive: true });
		window.addEventListener("deviceorientation", onOrientation);

		return () => {
			window.removeEventListener("mousemove", onMouse);
			window.removeEventListener("touchstart", onTouch);
			window.removeEventListener("touchmove", onTouch);
			window.removeEventListener("deviceorientation", onOrientation);
		};
	}, []);

	/**
	 * Call this inside your RAF loop to apply smoothing.
	 * Returns the smoothed { x, y } tuple.
	 */
	const tick = () => {
		pointer.current.smoothX += (pointer.current.x - pointer.current.smoothX) * smoothing;
		pointer.current.smoothY += (pointer.current.y - pointer.current.smoothY) * smoothing;
		return { x: pointer.current.smoothX, y: pointer.current.smoothY };
	};

	return { pointer, tick };
};
