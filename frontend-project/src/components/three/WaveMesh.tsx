import { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "./ThreeCanvas";
import { buildWaveGrid } from "@/lib/three";

type Props = {
	segments?: number;
	width?: number;
	height?: number;
	color?: number;
	opacity?: number;
	amplitude?: number;
	frequency?: number;
	speed?: number;
	parallax?: number;
	zIndex?: number;
	/** "absolute" (default) — clipped to parent; "fixed" — covers viewport. */
	position?: "absolute" | "fixed";
};

/**
 * Wireframe wave plane that ripples like water.
 * Default positioning: tilted forward at the bottom of the viewport.
 */
export const WaveMesh = ({
	segments,
	width,
	height,
	color,
	opacity,
	amplitude,
	frequency,
	speed,
	parallax = 2,
	zIndex = 0,
	position = "absolute",
}: Props) => {
	const build = useMemo(() => {
		return (scene: THREE.Scene) => {
			const wave = buildWaveGrid(scene, {
				segments,
				width,
				height,
				color,
				opacity,
				amplitude,
				frequency,
				speed,
			});
			return { onFrame: wave.onFrame, dispose: wave.dispose };
		};
	}, [segments, width, height, color, opacity, amplitude, frequency, speed]);

	return <ThreeCanvas build={build} parallax={parallax} zIndex={zIndex} position={position} />;
};
