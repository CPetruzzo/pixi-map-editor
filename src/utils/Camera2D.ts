/* eslint-disable prettier/prettier */
import type { Container } from "@pixi/display";
import { Tween } from "tweedle.js";
import { lerp } from "../engine/utils/MathUtils";

export class Camera2D {
	constructor() { }
	/**
	 *
	 * @param world container that have the level and the character
	 * @param container
	 */
	public anchoredOnLevel(world: Container, container: Container): void {
		world.pivot.x = container.width * 0.5;
		world.pivot.y = container.height * 0.5;
	}

	/**
	 *
	 * @param world container that have the level and the character
	 * @param character
	 * @param lerpTime closer to 1 is Slow; closer to 0 is Fast
	 */
	public anchoredOnCharacterWithLerp(world: Container, character: Container, lerpTime: number): void {
		world.pivot.x = lerp(character.x, world.pivot.x, lerpTime);
		world.pivot.y = lerp(character.y * 0.8, world.pivot.y, lerpTime);
	}

	/**
	 *
	 * @param world container that have the level and the character
	 * @param character
	 * @param lerpTime closer to 1 is Slow; closer to 0 is Fast
	 */
	public anchoredOnCharacterWithLerpOnX(world: Container, character: Container, lerpTime: number): void {
		world.pivot.x = lerp(character.x, world.pivot.x, lerpTime);
	}

	public shakeIt(camera: Container): void {
		new Tween(camera)
			.to({ x: camera.x + 5 }, 150)
			.chain(new Tween(camera).to({ x: camera.x - 10 }, 100).start())
			.chain(new Tween(camera).to({ x: camera.x + 5 }, 50).start())
			.repeat(2)
			.start();
	}

	public zoomIn(world: Container): void {
		world.scale.x += 0.01;
		world.scale.y += 0.01;
	}
	public zoomOut(world: Container): void {
		world.scale.x -= 0.01;
		world.scale.y -= 0.01;
	}
}
