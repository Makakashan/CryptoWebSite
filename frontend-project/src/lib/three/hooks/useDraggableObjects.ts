import { type MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";

type Options = {
	/** Camera ref used for raycasting (must match the renderer's camera). */
	camera: MutableRefObject<THREE.Camera | null>;
	/** Objects that can be grabbed. Updated live so you can push new meshes in. */
	objects: MutableRefObject<THREE.Object3D[]>;
	/** DOM element to attach pointer listeners to. Defaults to window. */
	domElement?: HTMLElement | null;
	/**
	 * Drag plane distance from camera. The grabbed object is constrained to
	 * a plane parallel to the camera's near/far plane at this distance.
	 * Default 30 (matches the default camera.position.z).
	 */
	dragDistance?: number;
	/** When dragging, the object is offset by this factor (gentle parallax). */
	dragStrength?: number;
	/** Whether drag is enabled at all. */
	enabled?: boolean;
};

const tmpRaycaster = new THREE.Raycaster();
const tmpNDC = new THREE.Vector2();
const tmpPlane = new THREE.Plane();
const tmpIntersect = new THREE.Vector3();
const tmpOffset = new THREE.Vector3();

/**
 * Lets the user grab and drag individual three.js objects with the pointer.
 *
 * How it works:
 *   - On pointerdown, raycasts from camera through the pointer.
 *   - If the ray hits one of `objects.current`, that object is "grabbed".
 *   - On pointermove, the grabbed object is moved along a plane parallel to
 *     the camera's image plane at `dragDistance`.
 *   - On pointerup, the object is released but stays where it was dropped.
 *
 * The dragged object's original userData.baseX / baseY / baseZ are updated
 * so any per-frame animation that uses them (e.g. floating) continues from
 * the new position instead of snapping back.
 *
 * Works for both mouse and touch (uses PointerEvents).
 */
export const useDraggableObjects = ({
	camera: cameraRef,
	objects,
	domElement,
	dragDistance = 30,
	dragStrength = 1,
	enabled = true,
}: Options) => {
	const grabbed = useRef<THREE.Object3D | null>(null);
	const isDragging = useRef(false);

	useEffect(() => {
		if (!enabled) return;
		const target = domElement ?? window;

		const ndcFromEvent = (e: PointerEvent | MouseEvent | Touch) => {
			const rect = (target as HTMLElement).getBoundingClientRect?.() ?? {
				left: 0,
				top: 0,
				width: window.innerWidth,
				height: window.innerHeight,
			};
			tmpNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			tmpNDC.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
		};

		const setCursor = (cursor: string) => {
			if (target instanceof HTMLElement) target.style.cursor = cursor;
		};

		const onPointerDown = (e: Event) => {
			if (!(e instanceof PointerEvent)) return;
			const camera = cameraRef.current;
			if (!camera || grabbed.current) return;
			ndcFromEvent(e);
			tmpRaycaster.setFromCamera(tmpNDC, camera);
			const hits = tmpRaycaster.intersectObjects(objects.current, false);
			if (hits.length === 0) return;
			const obj = hits[0].object;
			grabbed.current = obj;
			isDragging.current = true;

			// Set up the drag plane: parallel to camera's image plane at the
			// object's current distance from the camera.
			const camDir = new THREE.Vector3();
			camera.getWorldDirection(camDir);
			const objWorldPos = new THREE.Vector3();
			obj.getWorldPosition(objWorldPos);
			tmpPlane.setFromNormalAndCoplanarPoint(camDir.negate(), objWorldPos);

			// Remember offset between object origin and grab point so the
			// object doesn't jump when grabbed.
			tmpOffset.copy(hits[0].point).sub(objWorldPos);

			obj.userData.__isGrabbed = true;
			setCursor("grabbing");
			e.preventDefault();
		};

		const onPointerMove = (e: Event) => {
			if (!(e instanceof PointerEvent)) return;
			const camera = cameraRef.current;
			if (!camera || !grabbed.current) return;
			ndcFromEvent(e);
			tmpRaycaster.setFromCamera(tmpNDC, camera);
			if (!tmpRaycaster.ray.intersectPlane(tmpPlane, tmpIntersect)) return;

			// Compute new local position relative to parent (the scene).
			const parent = grabbed.current.parent;
			const newWorld = tmpIntersect.clone().sub(tmpOffset);
			if (parent) {
				const local = parent.worldToLocal(newWorld.clone());
				grabbed.current.position.x = local.x * dragStrength;
				grabbed.current.position.y = local.y * dragStrength;
			}

			// Update the userData base positions so any per-frame animation
			// (floating / drifting) continues from the new spot instead of
			// snapping back to the original.
			const ud = grabbed.current.userData;
			if (ud.baseX !== undefined) ud.baseX = grabbed.current.position.x;
			if (ud.baseY !== undefined) ud.baseY = grabbed.current.position.y;
			if (ud.baseZ !== undefined) ud.baseZ = grabbed.current.position.z;
		};

		const onPointerUp = () => {
			if (grabbed.current) {
				grabbed.current.userData.__isGrabbed = false;
				grabbed.current = null;
			}
			isDragging.current = false;
			setCursor("grab");
		};

		// Use pointer events (unified mouse + touch)
		target.addEventListener("pointerdown", onPointerDown, { passive: false });
		window.addEventListener("pointermove", onPointerMove, { passive: true });
		window.addEventListener("pointerup", onPointerUp);
		window.addEventListener("pointercancel", onPointerUp);

		return () => {
			target.removeEventListener("pointerdown", onPointerDown);
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
			window.removeEventListener("pointercancel", onPointerUp);
		};
	}, [cameraRef, objects, domElement, dragDistance, dragStrength, enabled]);

	return { grabbed, isDragging };
};
