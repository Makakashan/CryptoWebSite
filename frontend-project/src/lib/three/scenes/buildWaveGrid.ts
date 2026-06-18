import * as THREE from "three";

type Options = {
	/** Plane subdivisions per side. */
	segments?: number;
	width?: number;
	height?: number;
	color?: number;
	opacity?: number;
	/** Wave amplitude in world units. */
	amplitude?: number;
	/** Wave frequency — higher = more peaks. */
	frequency?: number;
	/** Animation speed. */
	speed?: number;
};

const DEFAULT_SEGMENTS = 32;
const DEFAULT_WIDTH = 50;
const DEFAULT_HEIGHT = 50;
const DEFAULT_COLOR = 0xffffff;
const DEFAULT_OPACITY = 0.08;
const DEFAULT_AMPLITUDE = 1.2;
const DEFAULT_FREQUENCY = 0.18;
const DEFAULT_SPEED = 0.6;

/**
 * Animated wireframe plane that ripples like water. Rotated to lie
 * flat (XZ plane) and tilted slightly toward the camera.
 */
export const buildWaveGrid = (scene: THREE.Scene, options: Options = {}) => {
	const segments = options.segments ?? DEFAULT_SEGMENTS;
	const width = options.width ?? DEFAULT_WIDTH;
	const height = options.height ?? DEFAULT_HEIGHT;
	const color = options.color ?? DEFAULT_COLOR;
	const opacity = options.opacity ?? DEFAULT_OPACITY;
	const amplitude = options.amplitude ?? DEFAULT_AMPLITUDE;
	const frequency = options.frequency ?? DEFAULT_FREQUENCY;
	const speed = options.speed ?? DEFAULT_SPEED;

	const geo = new THREE.PlaneGeometry(width, height, segments, segments);
	geo.rotateX(-Math.PI / 2.4);

	const mat = new THREE.MeshBasicMaterial({
		color,
		wireframe: true,
		transparent: true,
		opacity,
	});

	const mesh = new THREE.Mesh(geo, mat);
	mesh.position.y = -8;
	scene.add(mesh);

	const basePositions = new Float32Array(geo.attributes.position.array as Float32Array);

	const onFrame = (t: number) => {
		const pos = geo.attributes.position.array as Float32Array;
		for (let i = 0; i < pos.length; i += 3) {
			const x = basePositions[i];
			const z = basePositions[i + 2];
			pos[i + 1] =
				Math.sin(x * frequency + t * speed) * amplitude +
				Math.cos(z * frequency * 0.8 + t * speed * 0.7) * amplitude * 0.6;
		}
		geo.attributes.position.needsUpdate = true;
		geo.computeVertexNormals();
	};

	const dispose = () => {
		geo.dispose();
		mat.dispose();
		scene.remove(mesh);
	};

	return { mesh, onFrame, dispose };
};
