import { useMemo } from "react";
import * as THREE from "three";
import { buildFloatingShapes } from "@/lib/three";
import { ThreeCanvas } from "./ThreeCanvas";

type Props = {
	count?: number;
	spread?: number;
	opacity?: number;
	parallax?: number;
	zIndex?: number;
	/** "absolute" (default) — clipped to parent; "fixed" — covers viewport. */
	position?: "absolute" | "fixed";
	/** If true, each shape can be grabbed and dragged individually. */
	draggable?: boolean;
};

/**
 * Floating wireframe polyhedra — icosahedra, octahedra, tetrahedra,
 * dodecahedra. Each rotates and bobs at its own random speed.
 *
 * Pass `draggable` to let the user grab and drag each shape.
 */
export const FloatingShapes = ({
	count,
	spread,
	opacity,
	parallax = 3,
	zIndex = 0,
	position = "absolute",
	draggable = false,
}: Props) => {
	const build = useMemo(() => {
		return (scene: THREE.Scene) => {
			scene.add(new THREE.AmbientLight(0xffffff, 0.3));
			const p1 = new THREE.PointLight(0xdddddd, 2.2, 80);
			p1.position.set(12, 10, 12);
			scene.add(p1);
			const p2 = new THREE.PointLight(0xbbbbbb, 1.5, 80);
			p2.position.set(-12, -6, 18);
			scene.add(p2);

			const shapes = buildFloatingShapes(scene, { count, spread, opacity });
			return {
				onFrame: shapes.onFrame,
				dispose: shapes.dispose,
				draggableObjects: draggable ? shapes.meshes : [],
			};
		};
	}, [count, spread, opacity, draggable]);

	return (
		<ThreeCanvas
			build={build}
			parallax={parallax}
			zIndex={zIndex}
			position={position}
			draggable={draggable}
		/>
	);
};
