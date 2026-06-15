import { useEffect, useRef } from "react";
import * as THREE from "three";

const MiniScene = ({
	geometry,
	color = 0x999999,
	speed = 0.01,
}: {
	geometry: THREE.BufferGeometry;
	color?: number;
	speed?: number;
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<number>(0);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 100);
		camera.position.z = 3;

		const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		el.appendChild(renderer.domElement);

		const resize = () => {
			const width = Math.max(el.clientWidth, 1);
			const height = Math.max(el.clientHeight, 1);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height, false);
		};
		resize();

		const light = new THREE.PointLight(0xffffff, 1.5, 20);
		light.position.set(2, 2, 3);
		scene.add(light);
		scene.add(new THREE.AmbientLight(0xffffff, 0.4));

		const localGeometry = geometry.clone();
		const material = new THREE.MeshStandardMaterial({
			color,
			wireframe: true,
			transparent: true,
			opacity: 0.35,
			roughness: 0.35,
			metalness: 0.15,
		});
		const mesh = new THREE.Mesh(localGeometry, material);
		const s = 0.8 + Math.random() * 0.4;
		mesh.scale.set(s, s, s);
		scene.add(mesh);

		const clock = new THREE.Clock();
		const animate = () => {
			const t = clock.getElapsedTime();
			mesh.rotation.x = t * speed;
			mesh.rotation.y = t * speed * 1.3;
			mesh.position.y = Math.sin(t * 0.6) * 0.1;
			renderer.render(scene, camera);
			frameRef.current = requestAnimationFrame(animate);
		};
		frameRef.current = requestAnimationFrame(animate);

		const ro = new ResizeObserver(resize);
		ro.observe(el);

		return () => {
			cancelAnimationFrame(frameRef.current);
			ro.disconnect();
			localGeometry.dispose();
			material.dispose();
			renderer.dispose();
			el.removeChild(renderer.domElement);
		};
	}, [geometry, color, speed]);

	return <div ref={containerRef} className="bento-3d-canvas" />;
};

const geometries = {
	icosahedron: new THREE.IcosahedronGeometry(1, 0),
	octahedron: new THREE.OctahedronGeometry(1, 0),
	dodecahedron: new THREE.DodecahedronGeometry(1, 0),
	tetrahedron: new THREE.TetrahedronGeometry(1, 0),
};

export const BentoChart3D = ({ prices = [] }: { prices?: number[] }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<number>(0);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(35, el.clientWidth / el.clientHeight, 0.1, 100);
		camera.position.set(0, 1.5, 4);
		camera.lookAt(0, 0, 0);

		const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		el.appendChild(renderer.domElement);

		const resize = () => {
			const width = Math.max(el.clientWidth, 1);
			const height = Math.max(el.clientHeight, 1);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height, false);
		};
		resize();

		const ambient = new THREE.AmbientLight(0xffffff, 0.3);
		scene.add(ambient);
		const pl = new THREE.PointLight(0xffffff, 1.2, 30);
		pl.position.set(3, 3, 5);
		scene.add(pl);

		const pts = prices.length > 2 ? prices.slice(-72) : [100, 101, 100.5, 102, 103, 102.4, 104, 103.2];
		const min = Math.min(...pts);
		const max = Math.max(...pts);
		const range = Math.max(max - min, 1e-9);

		const lineGeo = new THREE.BufferGeometry();
		const positions = new Float32Array(pts.length * 3);
		for (let i = 0; i < pts.length; i++) {
			positions[i * 3] = (i / (pts.length - 1)) * 5 - 2.5;
			positions[i * 3 + 1] = ((pts[i] - min) / range) * 1.5 - 0.75;
			positions[i * 3 + 2] = 0;
		}
		lineGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		const lineMat = new THREE.LineBasicMaterial({ color: 0x99f6cf, transparent: true, opacity: 0.58 });
		const line = new THREE.Line(lineGeo, lineMat);
		scene.add(line);

		const areaGeo = new THREE.BufferGeometry();
		const areaPos = new Float32Array((pts.length + 2) * 3);
		for (let i = 0; i < pts.length; i++) {
			areaPos[i * 3] = (i / (pts.length - 1)) * 5 - 2.5;
			areaPos[i * 3 + 1] = ((pts[i] - min) / range) * 1.5 - 0.75;
			areaPos[i * 3 + 2] = 0;
		}
		areaPos[pts.length * 3] = 2.5;
		areaPos[pts.length * 3 + 1] = -0.75;
		areaPos[pts.length * 3 + 2] = 0;
		areaPos[(pts.length + 1) * 3] = -2.5;
		areaPos[(pts.length + 1) * 3 + 1] = -0.75;
		areaPos[(pts.length + 1) * 3 + 2] = 0;
		areaGeo.setAttribute("position", new THREE.BufferAttribute(areaPos, 3));
		const areaMat = new THREE.MeshBasicMaterial({
			color: 0x888888,
			transparent: true,
			opacity: 0.08,
			side: THREE.DoubleSide,
		});
		const area = new THREE.Mesh(areaGeo, areaMat);
		scene.add(area);

		const dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
		const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
		const dot = new THREE.Mesh(dotGeo, dotMat);
		const lastIdx = pts.length - 1;
		dot.position.set(
			(lastIdx / (pts.length - 1)) * 5 - 2.5,
			((pts[lastIdx] - min) / range) * 1.5 - 0.75,
			0,
		);
		scene.add(dot);

		const clock = new THREE.Clock();
		const animate = () => {
			const t = clock.getElapsedTime();
			line.rotation.y = Math.sin(t * 0.15) * 0.08;
			area.rotation.y = Math.sin(t * 0.15) * 0.08;
			dot.position.y = ((pts[lastIdx] - min) / range) * 1.5 - 0.75 + Math.sin(t * 1.5) * 0.02;
			dot.scale.setScalar(1 + Math.sin(t * 2) * 0.2);
			renderer.render(scene, camera);
			frameRef.current = requestAnimationFrame(animate);
		};
		frameRef.current = requestAnimationFrame(animate);

		const ro = new ResizeObserver(resize);
		ro.observe(el);

		return () => {
			cancelAnimationFrame(frameRef.current);
			ro.disconnect();
			lineGeo.dispose();
			lineMat.dispose();
			areaGeo.dispose();
			areaMat.dispose();
			dotGeo.dispose();
			dotMat.dispose();
			renderer.dispose();
			el.removeChild(renderer.domElement);
		};
	}, [prices]);

	return <div ref={containerRef} className="bento-3d-canvas bento-3d-canvas--chart" />;
};

export const MarketConstellation3D = ({ prices = [] }: { prices?: number[] }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<number>(0);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(32, el.clientWidth / el.clientHeight, 0.1, 100);
		camera.position.set(0, 0.8, 8);

		const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		el.appendChild(renderer.domElement);

		const resize = () => {
			const width = Math.max(el.clientWidth, 1);
			const height = Math.max(el.clientHeight, 1);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height, false);
		};
		resize();

		scene.add(new THREE.AmbientLight(0x8df6c9, 0.55));
		const light = new THREE.PointLight(0xffffff, 1.4, 24);
		light.position.set(3, 4, 5);
		scene.add(light);

		const particleGeo = new THREE.BufferGeometry();
		const particleCount = 90;
		const particlePositions = new Float32Array(particleCount * 3);
		for (let i = 0; i < particleCount; i++) {
			particlePositions[i * 3] = (Math.random() - 0.5) * 8;
			particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 5;
			particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
		}
		particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
		const particleMat = new THREE.PointsMaterial({
			color: 0x2ce6d3,
			size: 0.025,
			transparent: true,
			opacity: 0.52,
			depthWrite: false,
		});
		const particles = new THREE.Points(particleGeo, particleMat);
		scene.add(particles);

		const clock = new THREE.Clock();
		const animate = () => {
			const t = clock.getElapsedTime();
			particles.rotation.z = t * 0.012;
			particles.rotation.y = Math.sin(t * 0.12) * 0.05;
			renderer.render(scene, camera);
			frameRef.current = requestAnimationFrame(animate);
		};
		frameRef.current = requestAnimationFrame(animate);

		const ro = new ResizeObserver(resize);
		ro.observe(el);

		return () => {
			cancelAnimationFrame(frameRef.current);
			ro.disconnect();
			particleGeo.dispose();
			particleMat.dispose();
			renderer.dispose();
			el.removeChild(renderer.domElement);
		};
	}, [prices]);

	return <div ref={containerRef} className="landing-constellation-canvas" />;
};

export const BentoStat3D = ({
	type = "icosahedron",
	color = 0x888888,
}: {
	type?: keyof typeof geometries;
	color?: number;
}) => {
	return (
		<div className="bento-3d-wrapper">
			<MiniScene geometry={geometries[type]} color={color} speed={0.008} />
		</div>
	);
};

export const BentoTicker3D = ({
	type = "tetrahedron",
}: {
	type?: keyof typeof geometries;
}) => {
	return (
		<div className="bento-3d-wrapper bento-3d-wrapper--sm">
			<MiniScene geometry={geometries[type]} color={0x777777} speed={0.012} />
		</div>
	);
};
