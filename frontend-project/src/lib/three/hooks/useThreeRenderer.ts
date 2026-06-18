import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "./useReducedMotion";

export type SceneBuilderResult = {
	scene: THREE.Scene;
	camera: THREE.Camera;
	/** Called every frame. Receives elapsed seconds and delta. */
	onFrame?: (elapsed: number, delta: number) => void;
	/** Called on container resize. */
	onResize?: (width: number, height: number) => void;
	/** Optional three.js objects to dispose on unmount. */
	dispose?: () => void;
};

export type SceneBuilder = (
	renderer: THREE.WebGLRenderer,
	width: number,
	height: number,
) => SceneBuilderResult;

export type UseThreeRendererOptions = {
	/** If false, the renderer is not created (use for reduced motion). */
	enabled?: boolean;
	/** Cap pixel ratio — defaults to 2. */
	maxPixelRatio?: number;
	/** Use alpha channel for transparent backgrounds. Default true. */
	alpha?: boolean;
	/** Antialias flag. Default true on desktop, false on mobile. */
	antialias?: boolean;
};

/**
 * Boots a three.js renderer attached to the returned container ref.
 * Pass a `buildScene` function that constructs the scene, camera and
 * animation callbacks. The hook handles RAF, resize and disposal.
 *
 * Returns a React ref to attach to a `<div>` element.
 */
export const useThreeRenderer = (
	buildScene: SceneBuilder,
	options: UseThreeRendererOptions = {},
) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const reduced = useReducedMotion();
	const enabled = options.enabled ?? !reduced;

	useEffect(() => {
		if (!enabled) return;
		const container = containerRef.current;
		if (!container) return;

		const isMobile = window.innerWidth < 768;
		const getViewport = () => ({
			width: Math.max(container.clientWidth, 1),
			height: Math.max(container.clientHeight, 1),
		});
		const viewport = getViewport();

		const renderer = new THREE.WebGLRenderer({
			alpha: options.alpha ?? true,
			antialias: options.antialias ?? !isMobile,
			powerPreference: "high-performance",
		});
		renderer.setSize(viewport.width, viewport.height, false);
		renderer.setPixelRatio(
			Math.min(window.devicePixelRatio, options.maxPixelRatio ?? (isMobile ? 1.5 : 2)),
		);
		container.appendChild(renderer.domElement);

		const built = buildScene(renderer, viewport.width, viewport.height);

		const clock = new THREE.Clock();
		let frameId = 0;

		const animate = () => {
			const elapsed = clock.getElapsedTime();
			const delta = clock.getDelta();
			built.onFrame?.(elapsed, delta);
			renderer.render(built.scene, built.camera);
			frameId = requestAnimationFrame(animate);
		};
		frameId = requestAnimationFrame(animate);

		const onResize = () => {
			const { width, height } = getViewport();
			renderer.setSize(width, height, false);
			built.onResize?.(width, height);
		};
		window.addEventListener("resize", onResize);
		window.visualViewport?.addEventListener("resize", onResize);

		return () => {
			cancelAnimationFrame(frameId);
			window.removeEventListener("resize", onResize);
			window.visualViewport?.removeEventListener("resize", onResize);
			built.dispose?.();
			renderer.dispose();
			if (renderer.domElement.parentNode === container) {
				container.removeChild(renderer.domElement);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled]);

	return containerRef;
};
