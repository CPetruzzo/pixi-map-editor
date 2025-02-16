/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Container, Sprite, Text, Graphics } from "pixi.js";
import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../../engine/utils/ScaleHelper";
import gameMap from "./savedProyects/state.json";
import { Manager } from "../../..";
import { ConstructionEngineScene } from "./ConstructionEngineScene";
import type { PlacedEntity } from "./entities/EntityManager";
import { HitPoly } from "../../../engine/collision/HitPoly";
import { Hit } from "../../../engine/collision/Hit";
import { Response } from "sat";
import { lerp } from "../../../engine/utils/MathUtils";
import { Keyboard } from "../../../engine/input/Keyboard";

export class SideScrollerScene extends PixiScene {
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
	// Propiedades para la "cámara"
	private cameraLerp: number = 0.1; // Factor de suavizado
	private cameraZoom: number = 2; // Zoom deseado (mayor valor = más zoom)

	constructor() {
		super();

		this.backgroundImage = Sprite.from("blackboard");
		this.backgroundImage.scale.set(3, 1.5);
		this.backgroundImage.anchor.set(0.5);
		this.imageContainer.addChild(this.backgroundImage);

		this.backgroundContainer = new Container();
		this.backgroundContainer.name = "background";
		this.uiContainer.name = "UI";
		this.addChild(this.imageContainer, this.backgroundContainer);

		this.levelContainer = new Container();
		this.levelContainer.name = "level";
		this.levelContainer.scale.set(this.cameraZoom);
		this.backgroundContainer.addChild(this.levelContainer);

		this.createReturnButton();

		// En lugar de usar gameMap directamente, verificamos si hay un nivel cargado
		const levelToLoad: PlacedEntity[] | string = Manager.lastLoadedLevel ?? gameMap;

		// Cargamos el nivel (si levelToLoad ya es un objeto, se usará directamente)
		this.loadLevelFromFile(levelToLoad).then(() => {
			this.findOrCreatePlayer();
		});

		window.addEventListener("keydown", this.onKeyDown.bind(this));
		window.addEventListener("keyup", this.onKeyUp.bind(this));

		this.addChild(this.uiContainer);
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
	 * Para cada entidad, se crea su sprite y se le asigna una hitbox según su tipo:
	 * - "floor": se genera una hitbox que cubre el sprite (usada para colisiones verticales)
	 * - "building": se genera una hitbox (usada para colisiones horizontales)
	 * - "player": se genera una hitbox para el jugador
	 */
	private loadLevel(entities: PlacedEntity[]): void {
		entities.forEach((entity) => {
			const sprite = Sprite.from(entity.texture);
			sprite.anchor.set(0.5);
			sprite.width = entity.width;
			sprite.height = entity.height;
			sprite.x = entity.x;
			sprite.y = entity.y;
			// Usamos el campo name para identificar el tipo de objeto: "floor", "building" o "player"
			sprite.name = entity.type;
			this.levelContainer.addChild(sprite);

			// Crear hitboxes basados en las dimensiones reales del sprite
			if (entity.type === "floor") {
				const hitbox = HitPoly.makeBox(-200, -450, 500, 500, true);
				hitbox.name = "floorbox";
				sprite.addChild(hitbox);
			} else if (entity.type === "building") {
				const hitbox = HitPoly.makeBox(-200, -200, 400, 400, { color: 0x05fff5, show: true });
				hitbox.name = "buildingbox";
				sprite.addChild(hitbox);
			} else if (entity.type === "player") {
				// Ajusta el hitbox del jugador según lo que necesites (aquí se hace coincidir con el sprite)
				const hitbox = HitPoly.makeBox(-25, -25, 50, 100, { color: 0x05fff5, show: true });
				hitbox.name = "playerbox";
				sprite.addChild(hitbox);
				sprite.zIndex = 1000;
			}
		});
	}

	/**
	 * Busca un sprite con name "player" en el nivel o lo crea si no existe.
	 * Si se crea, se le asigna también su hitbox.
	 */
	private findOrCreatePlayer(): void {
		for (const child of this.levelContainer.children) {
			if (child instanceof Sprite && child.name === "player") {
				this.player = child;
				return;
			}
		}
		// Si no se encontró, se crea el jugador
		this.player = Sprite.from("player");
		this.player.anchor.set(0.5);
		this.player.width = 50;
		this.player.height = 50;
		this.player.x = 100;
		this.player.y = 100;
		this.player.name = "player";
		// Asignamos un hitbox acorde al sprite
		const hitbox = HitPoly.makeBox(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height, true);
		hitbox.name = "playerbox";
		this.player.addChild(hitbox);
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
	 * Se aplican los controles, la gravedad y se actualizan las colisiones usando SAT (Hit.test).
	 * El movimiento se resuelve en dos fases: horizontal y vertical.
	 */
	public override update(delta: number): void {
		if (!this.player) {
			return;
		}

		// Guardar posiciones anteriores
		const oldX = this.player.x;
		const oldY = this.player.y;

		// --- Movimiento Horizontal ---
		let dx = 0;
		if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
			dx = -(this.moveSpeed * delta) / 50;
		} else if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
			dx = (this.moveSpeed * delta) / 50;
		}
		this.player.x += dx;

		// Obtener la hitbox del jugador
		const playerHitbox = this.player.getChildByName("playerbox") as HitPoly;
		if (!playerHitbox) {
			return;
		}
		const response = new Response();

		// Colisión horizontal con paredes ("building")
		for (const child of this.levelContainer.children) {
			if (child === this.player || !(child instanceof Sprite)) {
				continue;
			}
			if (child.name !== "building") {
				continue;
			}
			const buildingHitbox = child.getChildByName("buildingbox") as HitPoly;
			if (!buildingHitbox) {
				continue;
			}
			response.clear();
			if (Hit.test(playerHitbox, buildingHitbox, response)) {
				// Si hay colisión, revertir el movimiento horizontal
				this.player.x = oldX;
				break;
			}
		}

		// --- Movimiento Vertical usando SAT para detectar piso ---
		let onGround = false;
		for (const child of this.levelContainer.children) {
			if (child === this.player || !(child instanceof Sprite)) {
				continue;
			}
			if (child.name !== "floor") {
				continue;
			}
			const floorHitbox = child.getChildByName("floorbox") as HitPoly;
			if (!floorHitbox) {
				continue;
			}
			response.clear();
			if (Hit.test(playerHitbox, floorHitbox, response)) {
				// Consideramos "onGround" solo si el jugador está cayendo o quieto
				if (this.playerVelocity.vy >= 0) {
					onGround = true;
					break;
				}
			}
		}

		if (onGround) {
			this.player.y = oldY;
			this.playerVelocity.vy = 0;
			if (Keyboard.shared.isDown("Space")) {
				this.playerVelocity.vy = this.jumpSpeed;
			}
		} else {
			this.playerVelocity.vy += (this.gravity * delta) / 50;
		}
		this.player.y += (this.playerVelocity.vy * delta) / 50;

		// --- "Snap" al piso con tolerancia ---
		// Solo aplicamos el encaje si NO se está presionando la tecla de salto.
		const tolerance = 1; // píxeles de tolerancia
		if (!(this.keys["ArrowUp"] || this.keys["KeyW"] || this.keys["Space"])) {
			for (const child of this.levelContainer.children) {
				if (child === this.player || !(child instanceof Sprite)) {
					continue;
				}
				if (child.name !== "floor") {
					continue;
				}

				// Suponiendo que los sprites están centrados:
				const floorLeft = child.x - child.width / 2;
				const floorRight = child.x + child.width / 2;
				const floorTop = child.y - child.height / 2;

				const playerLeft = this.player.x - this.player.width / 2;
				const playerRight = this.player.x + this.player.width / 2;
				const playerBottom = this.player.y + this.player.height / 2;

				if (playerRight > floorLeft && playerLeft < floorRight) {
					if (playerBottom > floorTop && playerBottom - floorTop < tolerance && this.playerVelocity.vy >= 0) {
						// Encajar al jugador justo sobre el piso
						this.player.y = floorTop - this.player.height / 2;
						this.playerVelocity.vy = 0;
						onGround = true;
						break;
					}
				}
			}
		}

		// --- Actualización de la "cámara" ---
		const targetX = -this.player.x;
		const targetY = -this.player.y;
		this.levelContainer.x = lerp(this.levelContainer.x, targetX, this.cameraLerp);
		this.levelContainer.y = lerp(this.levelContainer.y, targetY, this.cameraLerp);
	}

	/**
	 * Ajusta el escalado y posicionamiento de la escena cuando cambia el tamaño.
	 */
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
