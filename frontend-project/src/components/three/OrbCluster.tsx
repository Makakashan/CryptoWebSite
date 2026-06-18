import { useMemo } from "react";
import * as THREE from "three";
import { buildOrbCluster } from "@/lib/three";
import { ThreeCanvas } from "./ThreeCanvas";

type Props = {
	radius?: number;
	distortion?: number;
	speed?: number;
	satelliteCount?: number;
	satelliteInnerRadius?: number;
	satelliteOuterRadius?: number;
	satelliteSize?: number;
	color?: number;
	lightIntensity?: number;
	parallax?: number;
	zIndex?: number;
	/** "absolute" (default) — clipped to parent; "fixed" — covers viewport. */
	position?: "absolute" | "fixed";
};

/**
 * Distorted icosahedron orb + cloud of orbiting satellites.
 *
 * Richer than OrbSphere — fills the surrounding space with small
 * wireframe octahedra on tilted elliptical orbits, so the centerpiece
 * never looks lonely. Designed for hero bands (e.g. Portfolio hero).
 */
export const OrbCluster = ({
	radius,
	distortion,
	speed,
	satelliteCount,
	satelliteInnerRadius,
	satelliteOuterRadius,
	satelliteSize,
	color,
	lightIntensity,
	parallax = 3,
	zIndex = 0,
	position = "absolute",
}: Props) => {
	const build = useMemo(() => {
		return (scene: THREE.Scene) => {
			scene.add(new THREE.AmbientLight(0xffffff, 0.4));
			const cluster = buildOrbCluster(scene, {
				radius,
				distortion,
				speed,
				satelliteCount,
				satelliteInnerRadius,
				satelliteOuterRadius,
				satelliteSize,
				color,
				lightIntensity,
			});
			return { onFrame: cluster.onFrame, dispose: cluster.dispose };
		};
	}, [
		radius,
		distortion,
		speed,
		satelliteCount,
		satelliteInnerRadius,
		satelliteOuterRadius,
		satelliteSize,
		color,
		lightIntensity,
	]);

	return <ThreeCanvas build={build} parallax={parallax} zIndex={zIndex} position={position} />;
};
