/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Graphics, Text } from "pixi.js";
import { Container, Sprite } from "pixi.js";
import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../../engine/utils/ScaleHelper";
import gameMap from "./savedProyects/state.json";
import { Response } from "sat";
import { HitPoly } from "../../../engine/collision/HitPoly";
import type { IHitable } from "../../../engine/collision/IHitable";
import { Hit } from "../../../engine/collision/Hit";
import { lerp } from "../../../engine/utils/MathUtils"; // Asegúrate de que la ruta sea la correcta
import type { PlacedEntity } from "./entities/EntityManager";
import { Manager } from "../../..";
import { ConstructionEngineScene } from "./ConstructionEngineScene";

export class TopDownScene extends PixiScene {
	// Contenedores principales
	private backgroundContainer: Container;
	private levelContainer: Container; // Contenedor para el nivel cargado

	// Jugador controlable
	private player: Sprite;
	private uiContainer: Container = new Container();

	// Variables para control
	private keys: { [key: string]: boolean } = {};
	private moveSpeed: number = 5;
	public static readonly BUNDLES = ["construction"];
	// Opcional: si deseas llevar un listado de todas las hitboxes
	private hitboxes: (Graphics & IHitable)[] = [];

	// Propiedades para la "cámara"
	private cameraLerp: number = 0.1; // Factor de suavizado
	private cameraZoom: number = 2; // Zoom deseado (mayor valor = más zoom)

	constructor() {
		super();

		// Crear contenedores
		this.backgroundContainer = new Container();
		this.backgroundContainer.name = "background";
		this.addChild(this.backgroundContainer);

		this.levelContainer = new Container();
		this.levelContainer.name = "level";
		this.levelContainer.sortableChildren = true;
		// Aplicamos el zoom al contenedor del nivel
		this.levelContainer.scale.set(this.cameraZoom);
		this.backgroundContainer.addChild(this.levelContainer);

		// En lugar de usar gameMap directamente, verificamos si hay un nivel cargado
		const levelToLoad: PlacedEntity[] | string = Manager.lastLoadedLevel ?? gameMap;

		// Cargamos el nivel (si levelToLoad ya es un objeto, se usará directamente)
		this.loadLevelFromFile(levelToLoad).then(() => {
			this.findOrCreatePlayer();
		});

		this.createReturnButton();

		// Configurar eventos de teclado
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

	private loadLevel(entities: PlacedEntity[]): void {
		entities.forEach((entity) => {
			const sprite = Sprite.from(entity.texture);
			sprite.anchor.set(0.5);
			sprite.width = entity.width;
			sprite.height = entity.height;
			sprite.x = entity.x;
			sprite.y = entity.y;
			sprite.name = entity.type; // "floor", "building" o "player"
			this.levelContainer.addChild(sprite);

			// Si es un edificio, creamos su hitbox
			if (entity.type === "building") {
				const hitbox = HitPoly.makeBox(-200, -200, 400, 400, true);
				hitbox.name = "buildingbox";
				sprite.addChild(hitbox);
				this.hitboxes.push(hitbox);
			}

			// Si es el jugador, creamos su hitbox
			if (entity.type === "player") {
				const hitbox = HitPoly.makeBox(-25, -25, 50, 100, true);
				hitbox.name = "playerbox";
				sprite.addChild(hitbox);
				this.hitboxes.push(hitbox);
				sprite.zIndex = 1000;
			}
		});
	}

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
		this.levelContainer.addChild(this.player);
	}

	private onKeyDown(e: KeyboardEvent): void {
		this.keys[e.code] = true;
	}

	private onKeyUp(e: KeyboardEvent): void {
		this.keys[e.code] = false;
	}

	/**
	 * Actualización (cada frame).
	 * Se calcula el movimiento, se comprueba la colisión y se actualiza la posición de la "cámara"
	 * para centrar al jugador con un efecto de lerp.
	 */
	public override update(delta: number): void {
		if (!this.player) {
			return;
		}

		// Guardar la posición anterior para poder revertir en caso de colisión
		const oldX = this.player.x;
		const oldY = this.player.y;

		let dx = 0,
			dy = 0;
		if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
			dx = -(this.moveSpeed * delta) / 50;
		}
		if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
			dx = (this.moveSpeed * delta) / 50;
		}
		if (this.keys["ArrowUp"] || this.keys["KeyW"]) {
			dy = -(this.moveSpeed * delta) / 50;
		}
		if (this.keys["ArrowDown"] || this.keys["KeyS"]) {
			dy = (this.moveSpeed * delta) / 50;
		}

		// Aplicar el movimiento al jugador
		this.player.x += dx;
		this.player.y += dy;

		// Obtener la hitbox del jugador
		const playerHitbox = this.player.getChildByName("playerbox") as HitPoly;
		if (!playerHitbox) {
			return;
		}

		// Crear un objeto Response para almacenar el resultado de la colisión
		const response = new Response();
		let collisionDetected = false;

		// Iterar por cada edificio y comprobar la colisión
		for (const child of this.levelContainer.children) {
			// Saltar al jugador y elementos que no sean edificios
			if (child === this.player || !(child instanceof Sprite) || child.name !== "building") {
				continue;
			}
			const buildingHitbox = child.getChildByName("buildingbox") as HitPoly;
			if (!buildingHitbox) {
				continue;
			}
			// Si se detecta colisión usando SAT, se marca la colisión
			if (Hit.test(playerHitbox, buildingHitbox, response)) {
				console.log("Colisión detectada con:", child.name, child.x, child.y);
				collisionDetected = true;
				// Opcional: podrías ajustar la posición del jugador usando response.overlap y response.overlapN
				break;
			}
		}

		// Si se detectó colisión, se revierte el movimiento
		if (collisionDetected) {
			this.player.x = oldX;
			this.player.y = oldY;
		}

		// --- Actualización de la "cámara" ---
		// Queremos que el jugador se mantenga en el centro de la pantalla.
		// La posición objetivo del levelContainer será el negativo de la posición del jugador.
		const targetX = -this.player.x;
		const targetY = -this.player.y;
		// Aplicamos un lerp para suavizar la transición
		this.levelContainer.x = lerp(this.levelContainer.x, targetX, this.cameraLerp);
		this.levelContainer.y = lerp(this.levelContainer.y, targetY, this.cameraLerp);
	}

	/**
	 * Ajusta el escalado y posicionamiento de la escena cuando cambia el tamaño.
	 */
	public override onResize(newW: number, newH: number): void {
		ScaleHelper.setScaleRelativeToIdeal(this.backgroundContainer, newW, newH, 1920, 1080, ScaleHelper.FILL);
		// Posicionar el backgroundContainer en el centro de la pantalla
		this.backgroundContainer.x = newW / 2;
		this.backgroundContainer.y = newH / 2;
	}
}
