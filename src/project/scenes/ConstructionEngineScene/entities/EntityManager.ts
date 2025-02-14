// src/engine/scenes/ConstructionEngineScene/entities/EntityManager.ts
import type { Container } from "pixi.js";
import { Sprite } from "pixi.js";

// Interfaz para describir cada entidad colocada.
export interface PlacedEntity {
	type: string;
	texture: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export class EntityManager {
	private container: Container;
	public placedEntities: PlacedEntity[] = [];

	constructor(container: Container) {
		this.container = container;
	}

	public placeEntity(tool: string, x: number, y: number): void {
		let sprite: Sprite;
		let entity: PlacedEntity;
		if (tool === "building") {
			sprite = Sprite.from("wood");
			sprite.anchor.set(0.5);
			sprite.width = 50;
			sprite.height = 50;
			sprite.x = x;
			sprite.y = y;
			this.container.addChild(sprite);
			entity = { type: "building", texture: "wood", x, y, width: 50, height: 50 };
		} else if (tool === "floor") {
			sprite = Sprite.from("grass");
			sprite.anchor.set(0.5);
			sprite.width = 50;
			sprite.height = 50;
			sprite.x = x;
			sprite.y = y;
			this.container.addChild(sprite);
			entity = { type: "floor", texture: "grass", x, y, width: 50, height: 50 };
		} else if (tool === "player") {
			sprite = Sprite.from("player");
			sprite.anchor.set(0.5);
			sprite.width = 50;
			sprite.height = 50;
			sprite.x = x;
			sprite.y = y;
			sprite.name = "player";
			this.container.addChild(sprite);
			entity = { type: "player", texture: "player", x, y, width: 50, height: 50 };
		} else if (tool === "flag") {
			sprite = Sprite.from("flag");
			sprite.anchor.set(0.5);
			sprite.width = 50;
			sprite.height = 50;
			sprite.x = x;
			sprite.y = y;
			sprite.name = "flag";
			this.container.addChild(sprite);
			entity = { type: "flag", texture: "flag", x, y, width: 50, height: 50 };
		} else {
			return;
		}
		this.placedEntities.push(entity);
	}

	public eraseEntityAt(x: number, y: number): void {
		for (let i = this.container.children.length - 1; i >= 0; i--) {
			const child = this.container.children[i];
			if (child instanceof Sprite && child.x === x && child.y === y) {
				this.container.removeChild(child);
			}
		}
		this.placedEntities = this.placedEntities.filter((entity) => entity.x !== x || entity.y !== y);
	}

	public loadState(state: string): void {
		const entities: PlacedEntity[] = JSON.parse(state);
		this.placedEntities = [];
		entities.forEach((entity) => {
			const sprite = Sprite.from(entity.texture);
			sprite.anchor.set(0.5);
			sprite.width = entity.width;
			sprite.height = entity.height;
			sprite.x = entity.x;
			sprite.y = entity.y;
			this.container.addChild(sprite);
			this.placedEntities.push(entity);
		});
	}

	public saveState(): string {
		return JSON.stringify(this.placedEntities, null, 2);
	}
}
