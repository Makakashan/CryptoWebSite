import * as THREE from "three";

type Options = {
	radius?: number;
	color?: number;
	/** Distortion noise amplitude. */
	distortion?: number;
	/** Rotation speed. */
	speed?: number;
	/** Wireframe overlay opacity. */
	wireframeOpacity?: number;
};

const DEFAULT_RADIUS = 2.2;
const DEFAULT_COLOR = 0xffffff;
const DEFAULT_DISTORTION = 0.25;
const DEFAULT_SPEED = 0.4;
const DEFAULT_WIREFRAME_OPACITY = 0.35;

/**
 * Distorted icosahedron sphere with a soft fill + wireframe overlay.
 * Vertices are displaced using sin/cos noise for an organic "breathing"
 * look. Pairs well with a colored point light orbiting it.
 */
export const buildOrbSphere = (scene: THREE.Scene, options: Options = {}) => {
	const radius = options.radius ?? DEFAULT_RADIUS;
	const color = options.color ?? DEFAULT_COLOR;
	const distortion = options.distortion ?? DEFAULT_DISTORTION;
	const speed = options.speed ?? DEFAULT_SPEED;
	const wireframeOpacity = options.wireframeOpacity ?? DEFAULT_WIREFRAME_OPACITY;

	const geo = new THREE.IcosahedronGeometry(radius, 4);
	const basePositions = new Float32Array(geo.attributes.position.array as Float32Array);

	const fillMat = new THREE.MeshStandardMaterial({
		color,
		metalness: 0.6,
		roughness: 0.3,
		transparent: true,
		opacity: 0.08,
		flatShading: true,
	});
	const fillMesh = new THREE.Mesh(geo, fillMat);
	scene.add(fillMesh);

	const wireGeo = new THREE.IcosahedronGeometry(radius * 1.001, 4);
	const wireBase = new Float32Array(wireGeo.attributes.position.array as Float32Array);
	const wireMat = new THREE.MeshBasicMaterial({
		color,
		wireframe: true,
		transparent: true,
		opacity: wireframeOpacity,
	});
	const wireMesh = new THREE.Mesh(wireGeo, wireMat);
	scene.add(wireMesh);

	const light = new THREE.PointLight(0xffffff, 1.6, 14);
	light.position.set(3, 3, 4);
	scene.add(light);

	const onFrame = (t: number) => {
		const fillPos = geo.attributes.position.array as Float32Array;
		const wirePos = wireGeo.attributes.position.array as Float32Array;
		for (let i = 0; i < fillPos.length; i += 3) {
			const x = basePositions[i];
			const y = basePositions[i + 1];
			const z = basePositions[i + 2];
			const noise =
				Math.sin(x * 2 + t * speed) * 0.5 +
				Math.cos(y * 2 + t * speed * 0.8) * 0.4 +
				Math.sin(z * 1.5 + t * speed * 0.6) * 0.3;
			const factor = 1 + noise * distortion * 0.1;
			fillPos[i] = x * factor;
			fillPos[i + 1] = y * factor;
			fillPos[i + 2] = z * factor;
			wirePos[i] = wireBase[i] * factor;
			wirePos[i + 1] = wireBase[i + 1] * factor;
			wirePos[i + 2] = wireBase[i + 2] * factor;
		}
		geo.attributes.position.needsUpdate = true;
		geo.computeVertexNormals();
		wireGeo.attributes.position.needsUpdate = true;

		fillMesh.rotation.y = t * speed * 0.3;
		fillMesh.rotation.x = Math.sin(t * speed * 0.2) * 0.2;
		wireMesh.rotation.copy(fillMesh.rotation);

		light.position.x = Math.cos(t * speed * 0.5) * 4;
		light.position.z = Math.sin(t * speed * 0.5) * 4;
	};

	const dispose = () => {
		geo.dispose();
		wireGeo.dispose();
		fillMat.dispose();
		wireMat.dispose();
		scene.remove(fillMesh);
		scene.remove(wireMesh);
		scene.remove(light);
	};

	return { fillMesh, wireMesh, light, onFrame, dispose };
};
