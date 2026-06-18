import * as THREE from "three";

type Options = {
	count?: number;
	spread?: number;
	color?: number;
	size?: number;
	opacity?: number;
	/** Draw lines between nearby particles (within `linkDistance`). */
	connect?: boolean;
	linkDistance?: number;
	linkColor?: number;
	linkOpacity?: number;
};

const DEFAULT_COUNT = 240;
const DEFAULT_SPREAD = 30;
const DEFAULT_COLOR = 0xbbbbbb;
const DEFAULT_SIZE = 0.1;
const DEFAULT_OPACITY = 0.5;
const DEFAULT_CONNECT = true;
const DEFAULT_LINK_DISTANCE = 7;
const DEFAULT_LINK_COLOR = 0x888888;
const DEFAULT_LINK_OPACITY = 0.05;

/**
 * Builds a particle field with optional connecting lines.
 * Particles drift slowly using sin/cos based on their position.
 *
 * Returns a `dispose()` that releases GPU resources.
 */
export const buildParticleField = (scene: THREE.Scene, options: Options = {}) => {
	const count0 = options.count ?? DEFAULT_COUNT;
	const spread = options.spread ?? DEFAULT_SPREAD;
	const color = options.color ?? DEFAULT_COLOR;
	const size = options.size ?? DEFAULT_SIZE;
	const opacity = options.opacity ?? DEFAULT_OPACITY;
	const connect = options.connect ?? DEFAULT_CONNECT;
	const linkDistance = options.linkDistance ?? DEFAULT_LINK_DISTANCE;
	const linkColor = options.linkColor ?? DEFAULT_LINK_COLOR;
	const linkOpacity = options.linkOpacity ?? DEFAULT_LINK_OPACITY;

	const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
	const count = isMobile ? Math.floor(count0 * 0.45) : count0;

	const positions = new Float32Array(count * 3);
	for (let i = 0; i < count; i++) {
		positions[i * 3] = (Math.random() - 0.5) * spread * 2;
		positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.5;
		positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.8;
	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

	const mat = new THREE.PointsMaterial({
		color,
		size,
		transparent: true,
		opacity,
		sizeAttenuation: true,
		depthWrite: false,
	});

	const points = new THREE.Points(geo, mat);
	scene.add(points);

	let lineSegments: THREE.LineSegments | null = null;
	let lineMat: THREE.LineBasicMaterial | null = null;
	let lineGeo: THREE.BufferGeometry | null = null;

	if (connect) {
		lineMat = new THREE.LineBasicMaterial({
			color: linkColor,
			transparent: true,
			opacity: linkOpacity,
		});
		const linePositions = new Float32Array(count * count * 6);
		lineGeo = new THREE.BufferGeometry();
		lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
		lineSegments = new THREE.LineSegments(lineGeo, lineMat);
		scene.add(lineSegments);
	}

	const onFrame = (t: number) => {
		const pos = geo.attributes.position.array as Float32Array;
		for (let i = 0; i < count; i++) {
			pos[i * 3 + 1] += Math.sin(t * 0.4 + pos[i * 3] * 0.08) * 0.004;
			pos[i * 3] += Math.cos(t * 0.25 + pos[i * 3 + 1] * 0.06) * 0.002;
		}
		geo.attributes.position.needsUpdate = true;

		if (lineSegments && lineGeo) {
			const lpos = lineGeo.attributes.position.array as Float32Array;
			let idx = 0;
			const thresholdSq = linkDistance * linkDistance;
			for (let i = 0; i < count && idx < lpos.length; i++) {
				for (let j = i + 1; j < count && idx < lpos.length; j++) {
					const dx = pos[i * 3] - pos[j * 3];
					const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
					const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
					if (dx * dx + dy * dy + dz * dz < thresholdSq) {
						lpos[idx++] = pos[i * 3];
						lpos[idx++] = pos[i * 3 + 1];
						lpos[idx++] = pos[i * 3 + 2];
						lpos[idx++] = pos[j * 3];
						lpos[idx++] = pos[j * 3 + 1];
						lpos[idx++] = pos[j * 3 + 2];
					}
				}
			}
			for (; idx < lpos.length; idx++) lpos[idx] = 0;
			lineGeo.attributes.position.needsUpdate = true;
		}
	};

	const dispose = () => {
		geo.dispose();
		mat.dispose();
		lineMat?.dispose();
		lineGeo?.dispose();
		scene.remove(points);
		if (lineSegments) scene.remove(lineSegments);
	};

	return { points, lineSegments, onFrame, dispose };
};
