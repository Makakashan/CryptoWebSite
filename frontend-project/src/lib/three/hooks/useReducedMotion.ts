import { useEffect, useState } from "react";

/**
 * Returns true if the user has `prefers-reduced-motion: reduce` set.
 * Re-evaluates when the preference changes.
 */
export const useReducedMotion = (): boolean => {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;

		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => setReduced(mql.matches);

		update();
		mql.addEventListener("change", update);
		return () => mql.removeEventListener("change", update);
	}, []);

	return reduced;
};
