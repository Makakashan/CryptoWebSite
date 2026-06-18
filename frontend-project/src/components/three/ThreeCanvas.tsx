import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
	type SceneBuilder,
	useDraggableObjects,
	usePointerParallax,
	useThreeRenderer,
} from "@/lib/three";
import { ThreeErrorBoundary } from "./ThreeErrorBoundary";

type BuildResult = {
	onFrame?: (t: number, delta: number) => void;
	dispose?: () => void;
	/** If provided, these objects become grabbable when `draggable` is on. */
	draggableObjects?: THREE.Object3D[];
};

type Props = {
	/** Render the scene. Receives scene, camera, viewport. Return onFrame/dispose/draggableObjects. */
	build: (scene: THREE.Scene, camera: THREE.Camera, width: number, height: number) => BuildResult;
	/** Apply parallax to camera (default 0 = disabled). */
	parallax?: number;
	/**
	 * Position mode:
	 *   - "absolute" (default): canvas absolutely fills its closest positioned ancestor.
	 *   - "fixed": canvas covers the entire viewport (background-style).
	 */
	position?: "absolute" | "fixed";
	/** CSS z-index for the canvas. */
	zIndex?: number;
	/** @deprecated use position="absolute" */
	absolute?: boolean;
	className?: string;
	/**
	 * If true, the canvas accepts pointer events and the user can grab and
	 * drag individual objects returned by `build.draggableObjects`.
	 *
	 * When enabled, `pointer-events: auto` is set on the container.
	 */
	draggable?: boolean;
};

/**
 * Generic declarative three.js canvas. Pass a `build` function that
 * constructs the scene — the component handles RAF, resize, parallax,
 * optional per-object dragging, and disposal.
 *
 * By default the canvas is `pointer-events: none` and sits behind UI as
 * an ambient background. Pass `draggable` to enable grabbing individual
 * objects (the build function must return them in `draggableObjects`).
 *
 * Wrapped in <ThreeErrorBoundary> so any 3D crash silently falls back
 * to nothing instead of blanking the whole page.
 */
const ThreeCanvasInner = ({
	build,
	parallax = 0,
	position = "absolute",
	absolute,
	zIndex = 0,
	className,
	draggable = false,
}: Props) => {
	const { tick } = usePointerParallax(0.05);
	const resolvedPosition = absolute === false ? "fixed" : position;

	// Refs that survive rebuilds: camera + draggable object list.
	const cameraRef = useRef<THREE.Camera | null>(null);
	const objectsRef = useRef<THREE.Object3D[]>([]);

	const builder: SceneBuilder = useMemo(() => {
		return (_renderer, width, height) => {
			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
			camera.position.z = 30;
			cameraRef.current = camera;

			const built = build(scene, camera, width, height);
			objectsRef.current = built.draggableObjects ?? [];

			const onFrame = (t: number, delta: number) => {
				if (parallax > 0) {
					const { x, y } = tick();
					camera.position.x = x * parallax;
					camera.position.y = y * parallax;
					camera.lookAt(0, 0, 0);
				}
				built.onFrame?.(t, delta);
			};

			const onResize = (w: number, h: number) => {
				if (camera instanceof THREE.PerspectiveCamera) {
					camera.aspect = w / h;
					camera.updateProjectionMatrix();
				}
			};

			return { scene, camera, onFrame, onResize, dispose: built.dispose };
		};
	}, [build, parallax, tick]);

	// Enable per-object dragging if requested.
	useDraggableObjects({
		camera: cameraRef,
		objects: objectsRef,
		enabled: draggable,
	});

	const containerRef = useThreeRenderer(builder);

	return (
		<div
			ref={containerRef}
			className={className}
			style={{
				position: resolvedPosition,
				inset: 0,
				zIndex,
				pointerEvents: draggable ? "auto" : "none",
				cursor: draggable ? "grab" : "default",
				touchAction: draggable ? "none" : "auto",
			}}
			aria-hidden="true"
		/>
	);
};

export const ThreeCanvas = (props: Props) => (
	<ThreeErrorBoundary>
		<ThreeCanvasInner {...props} />
	</ThreeErrorBoundary>
);
