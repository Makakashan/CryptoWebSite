import * as THREE from "three";

type Options = {
	count?: number;
	spread?: number;
	/** Min/max scale for each shape. */
	minScale?: number;
	maxScale?: number;
	opacity?: number;
	wireframe?: boolean;
};

const DEFAULT_COUNT = 16;
const DEFAULT_SPREAD = 36;
const DEFAULT_MIN_SCALE = 0.5;
const DEFAULT_MAX_SCALE = 2;
const DEFAULT_OPACITY = 0.5;
const DEFAULT_WIREFRAME = true;

const GEOMETRIES = [
	() => new THREE.IcosahedronGeometry(1, 0),
	() => new THREE.OctahedronGeometry(0.85, 0),
	() => new THREE.TetrahedronGeometry(0.7, 0),
	() => new THREE.DodecahedronGeometry(0.95, 0),
];

/**
 * Spawns floating wireframe polyhedra that rotate and bob gently.
 * Each shape has its own random rotation speed and float amplitude.
 */
export const buildFloatingShapes = (scene: THREE.Scene, options: Options = {}) => {
	const requestedCount = options.count ?? DEFAULT_COUNT;
	const spread = options.spread ?? DEFAULT_SPREAD;
	const minScale = options.minScale ?? DEFAULT_MIN_SCALE;
	const maxScale = options.maxScale ?? DEFAULT_MAX_SCALE;
	const opacity = options.opacity ?? DEFAULT_OPACITY;
	const wireframe = options.wireframe ?? DEFAULT_WIREFRAME;

	const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
	const count = isMobile ? Math.floor(requestedCount * 0.5) : requestedCount;

	const geometries = GEOMETRIES.map((factory) => factory());
	const materials = [
		new THREE.MeshStandardMaterial({
			color: 0xdddddd,
			wireframe,
			transparent: true,
			opacity,
		}),
		new THREE.MeshStandardMaterial({
			color: 0xcccccc,
			wireframe,
			transparent: true,
			opacity: opacity * 0.8,
		}),
		new THREE.MeshStandardMaterial({
			color: 0xe0e0e0,
			wireframe,
			transparent: true,
			opacity: opacity * 0.7,
		}),
	];

	const meshes: THREE.Mesh[] = [];
	for (let i = 0; i < count; i++) {
		const geo = geometries[i % geometries.length];
		const mat = materials[i % materials.length];
		const mesh = new THREE.Mesh(geo, mat);
		mesh.position.set(
			(Math.random() - 0.5) * spread,
			(Math.random() - 0.5) * spread,
			(Math.random() - 0.5) * 20 - 5,
		);
		const s = minScale + Math.random() * (maxScale - minScale);
		mesh.scale.set(s, s, s);
		mesh.userData = {
			rotSpeed: {
				x: (Math.random() - 0.5) * 0.015,
				y: (Math.random() - 0.5) * 0.015,
				z: (Math.random() - 0.5) * 0.007,
			},
			floatSpeed: 0.15 + Math.random() * 0.35,
			floatAmp: 0.5 + Math.random() * 1.2,
			baseX: mesh.position.x,
			baseY: mesh.position.y,
		};
		scene.add(mesh);
		meshes.push(mesh);
	}

	const onFrame = (t: number) => {
		for (const mesh of meshes) {
			const ud = mesh.userData;
			mesh.rotation.x += ud.rotSpeed.x;
			mesh.rotation.y += ud.rotSpeed.y;
			mesh.rotation.z += ud.rotSpeed.z;
			mesh.position.y = ud.baseY + Math.sin(t * ud.floatSpeed) * ud.floatAmp;
			mesh.position.x = ud.baseX + Math.sin(t * 0.2 + ud.baseY) * 0.4;
		}
	};

	const dispose = () => {
		for (const g of geometries) g.dispose();
		for (const m of materials) m.dispose();
		for (const mesh of meshes) scene.remove(mesh);
	};

	return { meshes, onFrame, dispose };
};
