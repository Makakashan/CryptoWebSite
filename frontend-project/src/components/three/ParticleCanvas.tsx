import { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "./ThreeCanvas";
import { buildParticleField } from "@/lib/three";

type Props = {
	count?: number;
	spread?: number;
	color?: number;
	size?: number;
	opacity?: number;
	connect?: boolean;
	linkDistance?: number;
	parallax?: number;
	zIndex?: number;
	/** "fixed" (default) for ambient backgrounds, "absolute" for clipped surfaces. */
	position?: "absolute" | "fixed";
};

/**
 * Ambient particle field background. Particles drift slowly and
 * (optionally) connect with thin lines when close.
 *
 * Defaults to `position: fixed` so it covers the viewport without
 * contributing to document scroll height — ideal for ambient page bg.
 */
export const ParticleCanvas = ({
	count,
	spread,
	color,
	size,
	opacity,
	connect = true,
	linkDistance,
	parallax = 4,
	zIndex = 0,
	position = "fixed",
}: Props) => {
	const build = useMemo(() => {
		return (scene: THREE.Scene) => {
			const field = buildParticleField(scene, {
				count,
				spread,
				color,
				size,
				opacity,
				connect,
				linkDistance,
			});
			return { onFrame: field.onFrame, dispose: field.dispose };
		};
	}, [count, spread, color, size, opacity, connect, linkDistance]);

	return <ThreeCanvas build={build} parallax={parallax} zIndex={zIndex} position={position} />;
};
