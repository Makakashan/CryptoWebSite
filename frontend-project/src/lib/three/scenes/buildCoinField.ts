import * as THREE from "three";

type Options = {
	symbols?: string[];
	count?: number;
	spread?: number;
	fontSize?: number;
	color?: string;
	opacity?: number;
};

const DEFAULT_SYMBOLS = ["₿", "$", "Ξ", "₸", "◈"];
const DEFAULT_COUNT = 8;
const DEFAULT_SPREAD = 32;
const DEFAULT_FONT_SIZE = 72;
const DEFAULT_COLOR = "rgba(200,200,200,0.6)";
const DEFAULT_OPACITY = 0.25;

const createTextTexture = (text: string, fontSize: number, color: string) => {
	const canvas = document.createElement("canvas");
	const size = 128;
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
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

/**
 * Spawns floating currency-symbol sprites that bob and drift.
 * Each sprite uses a CanvasTexture so we keep polygon count minimal.
 */
export const buildCoinField = (scene: THREE.Scene, options: Options = {}) => {
	// Destructure with defaults so undefined props don't clobber defaults.
	const symbols = options.symbols ?? DEFAULT_SYMBOLS;
	const requestedCount = options.count ?? DEFAULT_COUNT;
	const spread = options.spread ?? DEFAULT_SPREAD;
	const fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
	const color = options.color ?? DEFAULT_COLOR;
	const opacity = options.opacity ?? DEFAULT_OPACITY;

	if (!Array.isArray(symbols) || symbols.length === 0) {
		return {
			sprites: [] as THREE.Sprite[],
			onFrame: () => {},
			dispose: () => {},
		};
	}

	const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
	const count = isMobile ? Math.floor(requestedCount * 0.4) : requestedCount;

	const sprites: THREE.Sprite[] = [];
	const textures: THREE.CanvasTexture[] = [];

	for (let i = 0; i < count; i++) {
		const symbol = symbols[i % symbols.length] ?? "$";
		const texture = createTextTexture(symbol, fontSize, color);
		if (!texture) continue;
		textures.push(texture);
		const material = new THREE.SpriteMaterial({
			map: texture,
			transparent: true,
			opacity,
		});
		const sprite = new THREE.Sprite(material);
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

	const onFrame = (t: number) => {
		for (const sprite of sprites) {
			const ud = sprite.userData;
			sprite.position.y = ud.baseY + Math.sin(t * ud.floatSpeed + ud.baseX) * ud.floatAmp;
			sprite.position.x = ud.baseX + Math.cos(t * 0.15 + ud.baseY) * 0.6 + ud.driftX * t;
		}
	};

	const dispose = () => {
		for (const sprite of sprites) {
			const material = sprite.material as THREE.SpriteMaterial;
			material.dispose();
			scene.remove(sprite);
		}
		for (const texture of textures) texture.dispose();
	};

	return { sprites, onFrame, dispose };
};
