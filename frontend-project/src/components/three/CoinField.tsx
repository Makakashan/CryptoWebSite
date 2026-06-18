import { useMemo } from "react";
import type * as THREE from "three";
import { buildCoinField } from "@/lib/three";
import { ThreeCanvas } from "./ThreeCanvas";

type Props = {
	symbols?: string[];
	count?: number;
	spread?: number;
	opacity?: number;
	parallax?: number;
	zIndex?: number;
	/** "absolute" (default) — clipped to parent; "fixed" — covers viewport. */
	position?: "absolute" | "fixed";
	/** If true, each coin sprite can be grabbed and dragged individually. */
	draggable?: boolean;
};

/**
 * Floating currency-symbol sprites (₿, $, Ξ, ₸, ◈).
 * Uses CanvasTexture so polygon count stays minimal.
 *
 * Pass `draggable` to let the user grab and drag each coin.
 */
export const CoinField = ({
	symbols,
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
			const field = buildCoinField(scene, { symbols, count, spread, opacity });
			return {
				onFrame: field.onFrame,
				dispose: field.dispose,
				draggableObjects: draggable ? field.sprites : [],
			};
		};
	}, [symbols, count, spread, opacity, draggable]);

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
