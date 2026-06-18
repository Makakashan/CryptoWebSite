import { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "./ThreeCanvas";
import { buildOrbSphere } from "@/lib/three";

type Props = {
	radius?: number;
	color?: number;
	distortion?: number;
	speed?: number;
	wireframeOpacity?: number;
	parallax?: number;
	zIndex?: number;
	/** "absolute" (default) — clipped to parent; "fixed" — covers viewport. */
	position?: "absolute" | "fixed";
};

/**
 * Distorted icosahedron sphere — vertices displaced by sin/cos noise
 * for an organic "breathing" effect. Pairs with an orbiting point light.
 *
 * Great as a hero centerpiece (e.g. Portfolio hero).
 */
export const OrbSphere = ({
	radius,
	color,
	distortion,
	speed,
	wireframeOpacity,
	parallax = 5,
	zIndex = 0,
	position = "absolute",
}: Props) => {
	const build = useMemo(() => {
		return (scene: THREE.Scene) => {
			scene.add(new THREE.AmbientLight(0xffffff, 0.4));
			const orb = buildOrbSphere(scene, {
				radius,
				color,
				distortion,
				speed,
				wireframeOpacity,
			});
			return { onFrame: orb.onFrame, dispose: orb.dispose };
		};
	}, [radius, color, distortion, speed, wireframeOpacity]);

	return <ThreeCanvas build={build} parallax={parallax} zIndex={zIndex} position={position} />;
};
