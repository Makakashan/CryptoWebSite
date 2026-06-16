import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

const createTextTexture = (text: string, fontSize: number, color: string) => {
	const canvas = document.createElement("canvas");
	const size = 128;
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d")!;
	ctx.clearRect(0, 0, size, size);
	ctx.font = `bold ${fontSize}px monospace`;
	ctx.fillStyle = color;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(text, size / 2, size / 2);
	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	return texture;
};

const createChartLine = (points: number[], width: number, height: number, color: number, opacity: number) => {
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(points.length * 3);
	const min = Math.min(...points);
	const max = Math.max(...points);
	const range = Math.max(max - min, 1e-9);
	for (let i = 0; i < points.length; i++) {
		positions[i * 3] = (i / (points.length - 1)) * width - width / 2;
		positions[i * 3 + 1] = ((points[i] - min) / range) * height - height / 2;
		positions[i * 3 + 2] = 0;
	}
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
	return new THREE.Line(geometry, material);
};

const generateFakeChart = (len: number, volatility: number) => {
	const points: number[] = [100];
	for (let i = 1; i < len; i++) {
		points.push(points[i - 1] + (Math.random() - 0.48) * volatility);
	}
	return points;
};

const ThreeBackground = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
	const frameRef = useRef<number>(0);

	const updatePointer = useCallback((clientX: number, clientY: number) => {
		const { innerWidth, innerHeight } = window;
		mouseRef.current.targetX = (clientX / innerWidth) * 2 - 1;
		mouseRef.current.targetY = -(clientY / innerHeight) * 2 + 1;
	}, []);

	const onMouseMove = useCallback((e: MouseEvent) => {
		updatePointer(e.clientX, e.clientY);
	}, [updatePointer]);

	const onTouchMove = useCallback((e: TouchEvent) => {
		const touch = e.touches[0];
		if (!touch) return;
		updatePointer(touch.clientX, touch.clientY);
	}, [updatePointer]);

	const onDeviceOrientation = useCallback((e: DeviceOrientationEvent) => {
		if (typeof e.gamma !== "number" || typeof e.beta !== "number") return;
		mouseRef.current.targetX = Math.max(-1, Math.min(1, e.gamma / 28));
		mouseRef.current.targetY = Math.max(-1, Math.min(1, (e.beta - 45) / -38));
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const isMobile = window.innerWidth < 768;
		const meshCount = isMobile ? 8 : 16;
		const spriteCount = isMobile ? 3 : 8;
		const chartCount = isMobile ? 2 : 4;
		const particleCount = isMobile ? 100 : 240;
		const getViewportSize = () => ({
			width: Math.max(container.clientWidth, window.visualViewport?.width ?? window.innerWidth, 1),
			height: Math.max(container.clientHeight, window.visualViewport?.height ?? window.innerHeight, 1),
		});
		const viewport = getViewportSize();

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(isMobile ? 62 : 55, viewport.width / viewport.height, 0.1, 1000);
		camera.position.z = isMobile ? 34 : 30;

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: !isMobile,
			preserveDrawingBuffer: import.meta.env.DEV,
		});
		renderer.setSize(viewport.width, viewport.height, false);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
		container.appendChild(renderer.domElement);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
		scene.add(ambientLight);
		const pointLight1 = new THREE.PointLight(0xdddddd, 2.2, 80);
		pointLight1.position.set(12, 10, 12);
		scene.add(pointLight1);
		const pointLight2 = new THREE.PointLight(0xbbbbbb, 1.5, 80);
		pointLight2.position.set(-12, -6, 18);
		scene.add(pointLight2);

		const meshes: THREE.Mesh[] = [];
		const geometries = [
			new THREE.IcosahedronGeometry(1, 0),
			new THREE.OctahedronGeometry(0.85, 0),
			new THREE.TetrahedronGeometry(0.7, 0),
			new THREE.DodecahedronGeometry(0.95, 0),
		];
		const wireMats = [
			new THREE.MeshStandardMaterial({ color: 0xdddddd, wireframe: true, transparent: true, opacity: 0.5 }),
			new THREE.MeshStandardMaterial({ color: 0xcccccc, wireframe: true, transparent: true, opacity: 0.4 }),
			new THREE.MeshStandardMaterial({ color: 0xe0e0e0, wireframe: true, transparent: true, opacity: 0.35 }),
		];
		const solidMats = [
			new THREE.MeshStandardMaterial({ color: 0xbbbbbb, wireframe: false, transparent: true, opacity: 0.08 }),
			new THREE.MeshStandardMaterial({ color: 0xaaaaaa, wireframe: false, transparent: true, opacity: 0.06 }),
		];

		for (let i = 0; i < meshCount; i++) {
			const geo = geometries[i % geometries.length];
			const mat = i < 10 ? wireMats[i % wireMats.length] : solidMats[i % solidMats.length];
			const mesh = new THREE.Mesh(geo, mat);
			const spread = isMobile ? 25 : 36;
			mesh.position.set(
				(Math.random() - 0.5) * spread,
				(Math.random() - 0.5) * spread,
				(Math.random() - 0.5) * 20 - 5,
			);
			const s = (isMobile ? 0.42 : 0.5) + Math.random() * (isMobile ? 1.05 : 1.5);
			mesh.scale.set(s, s, s);
			mesh.userData = {
				rotSpeed: { x: (Math.random() - 0.5) * 0.015, y: (Math.random() - 0.5) * 0.015, z: (Math.random() - 0.5) * 0.007 },
				floatSpeed: 0.15 + Math.random() * 0.35,
				floatAmp: 0.5 + Math.random() * 1.2,
				baseX: mesh.position.x,
				baseY: mesh.position.y,
			};
			scene.add(mesh);
			meshes.push(mesh);
		}

		const cryptoSymbols = ["₿", "$", "Ξ", "₸", "◈"];
		const sprites: THREE.Sprite[] = [];
		for (let i = 0; i < spriteCount; i++) {
			const symbol = cryptoSymbols[i % cryptoSymbols.length];
			const texture = createTextTexture(symbol, 72, "rgba(200,200,200,0.6)");
			const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.25 });
			const sprite = new THREE.Sprite(material);
			const spread = isMobile ? 22 : 32;
			sprite.position.set(
				(Math.random() - 0.5) * spread,
				(Math.random() - 0.5) * spread,
				(Math.random() - 0.5) * 15 - 3,
			);
			const scale = 1.2 + Math.random() * 1.8;
			sprite.scale.set(scale, scale, 1);
			sprite.userData = {
				floatSpeed: 0.1 + Math.random() * 0.3,
				floatAmp: 0.6 + Math.random() * 1.5,
				driftX: (Math.random() - 0.5) * 0.003,
				baseX: sprite.position.x,
				baseY: sprite.position.y,
			};
			scene.add(sprite);
			sprites.push(sprite);
		}

		const chartLines: THREE.Line[] = [];
		for (let i = 0; i < chartCount; i++) {
			const points = generateFakeChart(20 + Math.floor(Math.random() * 15), 3 + Math.random() * 5);
			const line = createChartLine(points, 4 + Math.random() * 3, 1.5 + Math.random() * 1.5, 0x999999, 0.15 + Math.random() * 0.1);
			const spread = isMobile ? 20 : 28;
			line.position.set(
				(Math.random() - 0.5) * spread,
				(Math.random() - 0.5) * spread,
				(Math.random() - 0.5) * 12 - 4,
			);
			line.rotation.z = (Math.random() - 0.5) * 0.3;
			line.userData = {
				floatSpeed: 0.08 + Math.random() * 0.2,
				floatAmp: 0.3 + Math.random() * 0.8,
				rotSpeed: (Math.random() - 0.5) * 0.003,
				baseY: line.position.y,
			};
			scene.add(line);
			chartLines.push(line);
		}

		const particleGeo = new THREE.BufferGeometry();
		const positions = new Float32Array(particleCount * 3);
		for (let i = 0; i < particleCount; i++) {
			positions[i * 3] = (Math.random() - 0.5) * (isMobile ? 36 : 60);
			positions[i * 3 + 1] = (Math.random() - 0.5) * (isMobile ? 58 : 45);
			positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
		}
		particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		const particleMat = new THREE.PointsMaterial({ color: 0xbbbbbb, size: 0.1, transparent: true, opacity: 0.5, sizeAttenuation: true });
		const particles = new THREE.Points(particleGeo, particleMat);
		scene.add(particles);

		const linesMat = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.05 });
		const linePositions = new Float32Array(particleCount * 6);
		const lineGeo = new THREE.BufferGeometry();
		lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
		const lines = new THREE.LineSegments(lineGeo, linesMat);
		scene.add(lines);

		const clock = new THREE.Clock();

		const animate = () => {
			const t = clock.getElapsedTime();
			const mx = mouseRef.current.x;
			const my = mouseRef.current.y;

			mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
			mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

			camera.position.x = mx * (isMobile ? 1.7 : 3);
			camera.position.y = my * (isMobile ? 1.2 : 2);
			camera.lookAt(0, 0, 0);

			pointLight1.position.x = 12 + mx * 6;
			pointLight1.position.y = 10 + my * 5;
			pointLight2.position.x = -12 + mx * 4;
			pointLight2.position.y = -6 + my * 4;

			for (const mesh of meshes) {
				const ud = mesh.userData;
				mesh.rotation.x += ud.rotSpeed.x;
				mesh.rotation.y += ud.rotSpeed.y;
				mesh.rotation.z += ud.rotSpeed.z;
				mesh.position.y = ud.baseY + Math.sin(t * ud.floatSpeed) * ud.floatAmp;
				mesh.position.x = ud.baseX + Math.sin(t * 0.2 + ud.baseY) * 0.4;
			}

			for (const sprite of sprites) {
				const ud = sprite.userData;
				sprite.position.y = ud.baseY + Math.sin(t * ud.floatSpeed + ud.baseX) * ud.floatAmp;
				sprite.position.x = ud.baseX + Math.cos(t * 0.15 + ud.baseY) * 0.6 + ud.driftX * t;
			}

			for (const line of chartLines) {
				const ud = line.userData;
				line.position.y = ud.baseY + Math.sin(t * ud.floatSpeed) * ud.floatAmp;
				line.rotation.z += ud.rotSpeed;
			}

			const ppos = particles.geometry.attributes.position.array as Float32Array;
			for (let i = 0; i < particleCount; i++) {
				ppos[i * 3 + 1] += Math.sin(t * 0.4 + ppos[i * 3] * 0.08) * 0.004;
				ppos[i * 3] += Math.cos(t * 0.25 + ppos[i * 3 + 1] * 0.06) * 0.002;
			}
			particles.geometry.attributes.position.needsUpdate = true;

			const lpos = lines.geometry.attributes.position.array as Float32Array;
			let lineIdx = 0;
			const maxLines = particleCount * 2;
			const threshold = isMobile ? 6 : 7;
			for (let i = 0; i < particleCount && lineIdx < maxLines; i++) {
				for (let j = i + 1; j < particleCount && lineIdx < maxLines; j++) {
					const dx = ppos[i * 3] - ppos[j * 3];
					const dy = ppos[i * 3 + 1] - ppos[j * 3 + 1];
					const dz = ppos[i * 3 + 2] - ppos[j * 3 + 2];
					const dist = dx * dx + dy * dy + dz * dz;
					if (dist < threshold * threshold) {
						lpos[lineIdx++] = ppos[i * 3];
						lpos[lineIdx++] = ppos[i * 3 + 1];
						lpos[lineIdx++] = ppos[i * 3 + 2];
						lpos[lineIdx++] = ppos[j * 3];
						lpos[lineIdx++] = ppos[j * 3 + 1];
						lpos[lineIdx++] = ppos[j * 3 + 2];
					}
				}
			}
			for (; lineIdx < lpos.length; lineIdx++) lpos[lineIdx] = 0;
			lines.geometry.attributes.position.needsUpdate = true;

			renderer.render(scene, camera);
			frameRef.current = requestAnimationFrame(animate);
		};

		frameRef.current = requestAnimationFrame(animate);

		const onResize = () => {
			const { width, height } = getViewportSize();
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height, false);
		};

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("touchmove", onTouchMove, { passive: true });
		window.addEventListener("deviceorientation", onDeviceOrientation);
		window.addEventListener("resize", onResize);
		window.visualViewport?.addEventListener("resize", onResize);

		return () => {
			cancelAnimationFrame(frameRef.current);
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("touchmove", onTouchMove);
			window.removeEventListener("deviceorientation", onDeviceOrientation);
			window.removeEventListener("resize", onResize);
			window.visualViewport?.removeEventListener("resize", onResize);
			for (const geometry of geometries) {
				geometry.dispose();
			}
			for (const material of [...wireMats, ...solidMats]) {
				material.dispose();
			}
			for (const sprite of sprites) {
				const material = sprite.material as THREE.SpriteMaterial;
				material.map?.dispose();
				material.dispose();
			}
			for (const line of chartLines) {
				line.geometry.dispose();
				(line.material as THREE.Material).dispose();
			}
			particleGeo.dispose();
			particleMat.dispose();
			lineGeo.dispose();
			linesMat.dispose();
			renderer.dispose();
			container.removeChild(renderer.domElement);
		};
	}, [onDeviceOrientation, onMouseMove, onTouchMove]);

	return (
		<div
			ref={containerRef}
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 0,
				pointerEvents: "none",
			}}
			aria-hidden="true"
		/>
	);
};

export default ThreeBackground;
