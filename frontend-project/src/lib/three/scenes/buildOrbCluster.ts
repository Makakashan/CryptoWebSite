import * as THREE from "three";

type Options = {
	/** Main orb radius. */
	radius?: number;
	/** Distortion amount for the orb (0..1). */
	distortion?: number;
	/** Orb rotation speed. */
	speed?: number;
	/** Number of small particles orbiting the orb. */
	satelliteCount?: number;
	/** Inner orbit radius (closest satellites). */
	satelliteInnerRadius?: number;
	/** Outer orbit radius (farthest satellites). */
	satelliteOuterRadius?: number;
	/** Size of each satellite. */
	satelliteSize?: number;
	/** Color of the orb + satellites. */
	color?: number;
	/** Orbiting light intensity. */
	lightIntensity?: number;
};

const DEFAULTS = {
	radius: 2.4,
	distortion: 0.3,
	speed: 0.35,
	satelliteCount: 24,
	satelliteInnerRadius: 3.2,
	satelliteOuterRadius: 4.6,
	satelliteSize: 0.07,
	color: 0xffffff,
	lightIntensity: 1.8,
};

type Satellite = {
	mesh: THREE.Mesh;
	orbitRadius: number;
	orbitSpeed: number;
	orbitPhase: number;
	orbitTilt: number;
	yOffset: number;
};

/**
 * Distorted icosahedron orb + a cloud of small orbiting satellites.
 * Designed to be the centerpiece of a hero band — fills the visual
 * space around the orb so it doesn't look lonely.
 *
 * Each satellite orbits on its own tilted ellipse at its own speed,
 * giving a "swarm of electrons" effect.
 */
export const buildOrbCluster = (scene: THREE.Scene, options: Options = {}) => {
	const opts = { ...DEFAULTS, ...options };

	// --- Orb (distorted icosahedron with wireframe overlay) ---
	const orbGeo = new THREE.IcosahedronGeometry(opts.radius, 4);
	const orbBasePositions = new Float32Array(orbGeo.attributes.position.array as Float32Array);

	const fillMat = new THREE.MeshStandardMaterial({
		color: opts.color,
		metalness: 0.5,
		roughness: 0.35,
		transparent: true,
		opacity: 0.08,
		flatShading: true,
	});
	const fillMesh = new THREE.Mesh(orbGeo, fillMat);
	scene.add(fillMesh);

	const wireGeo = new THREE.IcosahedronGeometry(opts.radius * 1.005, 4);
	const wireBase = new Float32Array(wireGeo.attributes.position.array as Float32Array);
	const wireMat = new THREE.MeshBasicMaterial({
		color: opts.color,
		wireframe: true,
		transparent: true,
		opacity: 0.28,
	});
	const wireMesh = new THREE.Mesh(wireGeo, wireMat);
	scene.add(wireMesh);

	const light = new THREE.PointLight(0xffffff, opts.lightIntensity, 18);
	light.position.set(3, 3, 4);
	scene.add(light);

	// --- Satellites (small octahedra orbiting the orb) ---
	const satellites: Satellite[] = [];
	const satGeo = new THREE.OctahedronGeometry(opts.satelliteSize, 0);
	const satMat = new THREE.MeshStandardMaterial({
		color: opts.color,
		wireframe: true,
		transparent: true,
		opacity: 0.65,
	});

	for (let i = 0; i < opts.satelliteCount; i++) {
		const mesh = new THREE.Mesh(satGeo, satMat);
		const orbitRadius =
			opts.satelliteInnerRadius +
			Math.random() * (opts.satelliteOuterRadius - opts.satelliteInnerRadius);
		const orbitSpeed = 0.15 + Math.random() * 0.35;
		const orbitPhase = Math.random() * Math.PI * 2;
		const orbitTilt = (Math.random() - 0.5) * Math.PI * 0.8;
		const yOffset = (Math.random() - 0.5) * 1.5;
		const scale = 0.6 + Math.random() * 0.9;
		mesh.scale.set(scale, scale, scale);
		scene.add(mesh);
		satellites.push({ mesh, orbitRadius, orbitSpeed, orbitPhase, orbitTilt, yOffset });
	}

	// --- Animation ---
	const onFrame = (t: number) => {
		// Distort orb
		const fillPos = orbGeo.attributes.position.array as Float32Array;
		const wirePos = wireGeo.attributes.position.array as Float32Array;
		for (let i = 0; i < fillPos.length; i += 3) {
			const x = orbBasePositions[i];
			const y = orbBasePositions[i + 1];
			const z = orbBasePositions[i + 2];
			const noise =
				Math.sin(x * 2 + t * opts.speed) * 0.5 +
				Math.cos(y * 2 + t * opts.speed * 0.8) * 0.4 +
				Math.sin(z * 1.5 + t * opts.speed * 0.6) * 0.3;
			const factor = 1 + noise * opts.distortion * 0.1;
			fillPos[i] = x * factor;
			fillPos[i + 1] = y * factor;
			fillPos[i + 2] = z * factor;
			wirePos[i] = wireBase[i] * factor;
			wirePos[i + 1] = wireBase[i + 1] * factor;
			wirePos[i + 2] = wireBase[i + 2] * factor;
		}
		orbGeo.attributes.position.needsUpdate = true;
		orbGeo.computeVertexNormals();
		wireGeo.attributes.position.needsUpdate = true;

		fillMesh.rotation.y = t * opts.speed * 0.3;
		fillMesh.rotation.x = Math.sin(t * opts.speed * 0.2) * 0.2;
		wireMesh.rotation.copy(fillMesh.rotation);

		// Orbiting light
		light.position.x = Math.cos(t * opts.speed * 0.5) * 4;
		light.position.z = Math.sin(t * opts.speed * 0.5) * 4;

		// Satellites on tilted elliptical orbits
		for (const sat of satellites) {
			const angle = sat.orbitPhase + t * sat.orbitSpeed;
			const x = Math.cos(angle) * sat.orbitRadius;
			const z = Math.sin(angle) * sat.orbitRadius * 0.6;
			// Apply tilt rotation around X axis
			const y = z * Math.sin(sat.orbitTilt) + sat.yOffset;
			const zRot = z * Math.cos(sat.orbitTilt);
			sat.mesh.position.set(x, y, zRot);
			sat.mesh.rotation.x = t * sat.orbitSpeed * 1.5;
			sat.mesh.rotation.y = t * sat.orbitSpeed * 0.8;
		}
	};

	const dispose = () => {
		orbGeo.dispose();
		wireGeo.dispose();
		fillMat.dispose();
		wireMat.dispose();
		satGeo.dispose();
		satMat.dispose();
		scene.remove(fillMesh, wireMesh, light);
		for (const sat of satellites) scene.remove(sat.mesh);
	};

	return { fillMesh, wireMesh, light, satellites, onFrame, dispose };
};
