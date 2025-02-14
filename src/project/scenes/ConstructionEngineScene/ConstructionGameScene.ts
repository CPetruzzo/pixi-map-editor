import { Rectangle, Container, Sprite, Text, Graphics } from "pixi.js";
import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../../engine/utils/ScaleHelper";
import gameMap from "./savedProyects/state.json";
import { Manager } from "../../..";
import { ConstructionEngineScene } from "./ConstructionEngineScene";

// La misma interfaz que usaste para exportar el nivel.
interface PlacedEntity {
	type: string;
	texture: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export class ConstructionGameScene extends PixiScene {
	// Contenedores principales
	private backgroundContainer: Container;
	private levelContainer: Container; // Contenedor para el nivel cargado

	private backgroundImage: Sprite;
	private imageContainer: Container = new Container();

	// Jugador controlable
	private player: Sprite;

	// Variables para física y control
	private keys: { [key: string]: boolean } = {};
	private playerVelocity = { vx: 0, vy: 0 };
	private gravity: number = 0.5;
	private moveSpeed: number = 5;
	private jumpSpeed: number = -10;
	public static readonly BUNDLES = ["construction"];
	private uiContainer: Container = new Container();

	constructor() {
		super();

		this.backgroundImage = Sprite.from("blackboard");
		this.backgroundImage.scale.set(3, 1.5);
		this.backgroundImage.anchor.set(0.5);
		this.imageContainer.addChild(this.backgroundImage);

		this.backgroundContainer = new Container();
		this.backgroundContainer.name = "background";
		this.uiContainer.name = "UI";
		this.addChild(this.imageContainer, this.backgroundContainer, this.uiContainer);

		this.levelContainer = new Container();
		this.levelContainer.name = "level";
		this.backgroundContainer.addChild(this.levelContainer);

		this.createReturnButton();

		this.loadLevelFromFile(gameMap).then(() => {
			this.findOrCreatePlayer();
		});

		window.addEventListener("keydown", this.onKeyDown.bind(this));
		window.addEventListener("keyup", this.onKeyUp.bind(this));
	}

	/**
	 * Crea un botón que permite regresar a la ConstructionEngineScene.
	 */
	private createReturnButton(): void {
		const button = new Graphics();
		button.beginFill(0x333333);
		button.drawRoundedRect(0, 0, 250, 90, 10);
		button.endFill();
		button.pivot.set(button.width, 0);

		const buttonText = new Text("Return", {
			fontFamily: "Arial",
			fontSize: 46,
			fill: 0xffffff,
		});
		buttonText.anchor.set(0.5);
		buttonText.x = button.width * 0.5;
		buttonText.y = button.height * 0.5;
		button.addChild(buttonText);

		button.interactive = true;
		button.on("pointerup", () => {
			Manager.changeScene(ConstructionEngineScene);
		});

		this.uiContainer.addChild(button);
	}

	/**
	 * Carga el nivel desde datos ya importados o una URL.
	 * Si se pasa un string, se asume que es una URL y se realiza un fetch;
	 * de lo contrario, se carga directamente.
	 */
	private async loadLevelFromFile(data: PlacedEntity[] | string): Promise<void> {
		if (typeof data === "string") {
			try {
				const response = await fetch(data);
				if (!response.ok) {
					throw new Error(`Error al cargar el archivo: ${response.statusText}`);
				}
				const entities: PlacedEntity[] = await response.json();
				this.loadLevel(entities);
			} catch (error) {
				console.error("Error cargando el nivel desde state.json:", error);
			}
		} else {
			this.loadLevel(data);
		}
	}

	/**
	 * Recrea el nivel a partir de un arreglo de entidades.
	 */
	private loadLevel(entities: PlacedEntity[]): void {
		entities.forEach((entity) => {
			const sprite = Sprite.from(entity.texture);
			sprite.anchor.set(0.5);
			sprite.width = entity.width;
			sprite.height = entity.height;
			sprite.x = entity.x;
			sprite.y = entity.y;
			// Usamos el campo name para identificar el tipo de objeto:
			// "floor" (suelo), "building" (pared) o "player"
			sprite.name = entity.type;
			this.levelContainer.addChild(sprite);
		});
	}

	/**
	 * Busca un sprite con name "player" en el nivel o lo crea si no existe.
	 */
	private findOrCreatePlayer(): void {
		for (const child of this.levelContainer.children) {
			if (child instanceof Sprite && child.name === "player") {
				this.player = child;
				return;
			}
		}
		// Si no se encontró, creamos uno en una posición por defecto.
		this.player = Sprite.from("player");
		this.player.anchor.set(0.5);
		this.player.width = 50;
		this.player.height = 50;
		this.player.x = 100;
		this.player.y = 100;
		this.player.name = "player";
		this.levelContainer.addChild(this.player);
	}

	private onKeyDown(e: KeyboardEvent): void {
		this.keys[e.code] = true;
	}

	private onKeyUp(e: KeyboardEvent): void {
		this.keys[e.code] = false;
	}

	/**
	 * Método de actualización (llamado cada frame).
	 * Aquí se aplican los controles, la gravedad y se actualiza la posición del jugador.
	 */
	public override update(delta: number): void {
		if (!this.player) {
			return;
		}

		// --- Movimiento Horizontal ---
		let tentativeX = this.player.x;
		if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
			tentativeX = this.player.x - (this.moveSpeed * delta) / 50;
		} else if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
			tentativeX = this.player.x + (this.moveSpeed * delta) / 50;
		}

		const horizRect = new Rectangle(tentativeX - this.player.width / 2, this.player.y - this.player.height / 2, this.player.width, this.player.height);

		// Verificar colisiones horizontales con paredes ("building")
		for (const child of this.levelContainer.children) {
			if (child === this.player || !(child instanceof Sprite)) {
				continue;
			}
			if (child.name === "building") {
				const buildingBounds = child.getBounds();
				if (this.rectsIntersect(horizRect, buildingBounds)) {
					tentativeX = this.player.x;
					break;
				}
			}
		}

		// --- Movimiento Vertical ---
		let tentativeY = this.player.y;
		if (this.isOnGround()) {
			this.playerVelocity.vy = 0;
			if (this.keys["ArrowUp"] || this.keys["KeyW"] || this.keys["Space"]) {
				this.playerVelocity.vy = this.jumpSpeed;
			}
		} else {
			this.playerVelocity.vy += (this.gravity * delta) / 50;
		}
		tentativeY = this.player.y + (this.playerVelocity.vy * delta) / 50;

		const vertRect = new Rectangle(tentativeX - this.player.width / 2, tentativeY - this.player.height / 2, this.player.width, this.player.height);

		// Verificar colisiones verticales con el suelo ("floor")
		for (const child of this.levelContainer.children) {
			if (child === this.player || !(child instanceof Sprite)) {
				continue;
			}
			if (child.name === "floor") {
				const floorBounds = child.getBounds();
				if (this.playerVelocity.vy >= 0 && vertRect.y + vertRect.height >= floorBounds.y && this.rectsIntersect(vertRect, floorBounds)) {
					tentativeY = floorBounds.y - this.player.height / 2;
					this.playerVelocity.vy = 0;
					break;
				}
				if (this.playerVelocity.vy < 0 && vertRect.y <= floorBounds.y + floorBounds.height && this.rectsIntersect(vertRect, floorBounds)) {
					tentativeY = floorBounds.y + floorBounds.height + this.player.height / 2;
					this.playerVelocity.vy = 0;
					break;
				}
			}
		}

		this.player.x = tentativeX;
		this.player.y = tentativeY;
	}

	/**
	 * Retorna true si el jugador está apoyado sobre algún "floor".
	 */
	private isOnGround(): boolean {
		const playerBottom = this.player.y + this.player.height / 2;
		for (const child of this.levelContainer.children) {
			if (child === this.player || !(child instanceof Sprite)) {
				continue;
			}
			if (child.name === "floor") {
				const floorTop = child.y - child.height / 2;
				if (
					Math.abs(playerBottom - floorTop) < 5 &&
					this.player.x + this.player.width / 2 > child.x - child.width / 2 &&
					this.player.x - this.player.width / 2 < child.x + child.width / 2
				) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Función auxiliar para detectar colisiones entre dos rectángulos.
	 */
	private rectsIntersect(a: Rectangle, b: Rectangle): boolean {
		return a.x + a.width > b.x && a.x < b.x + b.width && a.y + a.height > b.y && a.y < b.y + b.height;
	}

	public override onResize(newW: number, newH: number): void {
		ScaleHelper.setScaleRelativeToIdeal(this.imageContainer, newW, newH, 1920, 1080, ScaleHelper.FILL);
		this.imageContainer.x = newW / 2;
		this.imageContainer.y = newH / 2;

		ScaleHelper.setScaleRelativeToIdeal(this.backgroundContainer, newW, newH, 1920, 1080, ScaleHelper.FIT);
		this.backgroundContainer.x = newW / 2;
		this.backgroundContainer.y = newH / 2;

		ScaleHelper.setScaleRelativeToIdeal(this.uiContainer, newW, newH, 1920, 1080, ScaleHelper.FIT);
		this.uiContainer.x = newW;
		this.uiContainer.y = 0;
	}
}
