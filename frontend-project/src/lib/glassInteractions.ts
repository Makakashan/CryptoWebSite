/* =================================================================
   MakakaTrade · Liquid Glass · Interaction Layer
   -----------------------------------------------------------------
   Vanilla TS module — zero dependencies.
   - Tracks pointer position over every glass surface and writes
     --mx / --my CSS vars so the spotlight + iridescent border can
     follow the cursor.
   - Adds optional tilt to elements with .glass-tilt.
   - Injects the spotlight/iridescent layers automatically so the
     existing TSX components don't need markup changes.

   Usage:
     import { initGlassInteractions } from "@/lib/glassInteractions";
     useEffect(() => initGlassInteractions(), []);
   ================================================================= */

const GLASS_SURFACE_SELECTOR = [
	".glass-metric-card",
	".portfolio-glass-card",
	".portfolio-glass-metric",
	".glass-chart-panel",
	".glass-surface-panel",
	".glass-filter-panel",
	".glass-empty-panel",
	".glass-table-panel",
	".portfolio-glass-panel",
	".portfolio-glass-panel-assets",
	".glass-market-card",
	".top-performer-card",
	".glass-inline-metric",
	".glass-hero-glass",
	".portfolio-hero-glass",
].join(",");

const TILT_SELECTOR = ".glass-tilt";

let isInitialised = false;
let boundElements = new WeakSet<HTMLElement>();
const cleanups: Array<() => void> = [];

/**
 * Injects the spotlight + iridescent layers as the FIRST/LAST child
 * of the surface so they sit beneath the content but above the
 * surface background.
 */
function ensureLayers(el: HTMLElement) {
	if (el.dataset.glassLayers === "true") return;
	el.dataset.glassLayers = "true";

	const spotlight = document.createElement("span");
	spotlight.className = "glass-spotlight-layer";
	spotlight.setAttribute("aria-hidden", "true");
	el.prepend(spotlight);

	const iridescent = document.createElement("span");
	iridescent.className = "glass-iridescent-border";
	iridescent.setAttribute("aria-hidden", "true");
	el.appendChild(iridescent);
}

/**
 * Pointer move handler for a single surface.
 */
function bindSurface(el: HTMLElement) {
	const handler = (e: PointerEvent) => {
		const rect = el.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		el.style.setProperty("--mx", `${x}%`);
		el.style.setProperty("--my", `${y}%`);
	};
	el.addEventListener("pointermove", handler);
	return () => el.removeEventListener("pointermove", handler);
}

/**
 * Optional tilt handler — applies subtle rotateX / rotateY based on
 * pointer position relative to element center.
 */
function bindTilt(el: HTMLElement) {
	const MAX = 6; // degrees — keep in sync with --glass-tilt-max

	const onMove = (e: PointerEvent) => {
		const rect = el.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const dx = (e.clientX - cx) / (rect.width / 2);
		const dy = (e.clientY - cy) / (rect.height / 2);
		el.style.setProperty("--ry", `${(dx * MAX).toFixed(2)}deg`);
		el.style.setProperty("--rx", `${(-dy * MAX).toFixed(2)}deg`);
	};

	const onLeave = () => {
		el.style.setProperty("--rx", "0deg");
		el.style.setProperty("--ry", "0deg");
	};

	el.addEventListener("pointermove", onMove);
	el.addEventListener("pointerleave", onLeave);
	return () => {
		el.removeEventListener("pointermove", onMove);
		el.removeEventListener("pointerleave", onLeave);
	};
}

/**
 * Watch the DOM for new glass surfaces (route changes, lazy-loaded
 * lists, etc.) and bind them.
 */
function observeDOM() {
	const observer = new MutationObserver(() => {
		refreshSurfaces();
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	return () => observer.disconnect();
}

function refreshSurfaces() {
	const surfaces = document.querySelectorAll<HTMLElement>(GLASS_SURFACE_SELECTOR);
	surfaces.forEach((el) => {
		if (boundElements.has(el)) return;
		boundElements.add(el);
		ensureLayers(el);
		cleanups.push(bindSurface(el));
	});

	const tilts = document.querySelectorAll<HTMLElement>(TILT_SELECTOR);
	tilts.forEach((el) => {
		if ((el as HTMLElement & { __glassTiltBound?: boolean }).__glassTiltBound) return;
		(el as HTMLElement & { __glassTiltBound?: boolean }).__glassTiltBound = true;
		cleanups.push(bindTilt(el));
	});
}

/**
 * Public API.
 * Call once after first paint — safe to call multiple times.
 */
export function initGlassInteractions() {
	if (isInitialised) return;
	isInitialised = true;

	if (typeof window === "undefined") return;

	const start = () => {
		refreshSurfaces();
		cleanups.push(observeDOM());
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start, { once: true });
	} else {
		requestAnimationFrame(start);
	}
}

/**
 * Tear down — useful for HMR in dev.
 */
export function destroyGlassInteractions() {
	cleanups.forEach((fn) => fn());
	cleanups.length = 0;
	boundElements = new WeakSet<HTMLElement>();
	isInitialised = false;

	document.querySelectorAll<HTMLElement>("[data-glass-layers='true']").forEach((el) => {
		el.querySelectorAll(".glass-spotlight-layer, .glass-iridescent-border").forEach((n) =>
			n.remove(),
		);
		delete el.dataset.glassLayers;
	});
}
